






// gpsSimulator.js
const axios = require('axios');
const fs = require('fs');

const trips = JSON.parse(fs.readFileSync('trips.json', 'utf8'));
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWJjY2M0NDAwZTBmZjM1NmI3YTNhMSIsImlhdCI6MTc2MDM4NjYyNSwiZXhwIjoxNzYyOTc4NjI1fQ.IIlXCXgljC2roZ4jr77AdPnAozdLYgohKUCBaoa9JQABearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWJjY2M0NDAwZTBmZjM1NmI3YTNhMSIsImlhdCI6MTc2MDQzODUzNSwiZXhwIjoxNzYzMDMwNTM1fQ.SEarDnCOJpH9Ute6l4KPojOrnhH3xvC9ONJcZKPwVL0'; // Replace with a valid operator token

const SIMULATION_DURATION_MIN = 5; // Simulate each trip in 5 minutes
const UPDATE_INTERVAL_SEC = 10;    // Send update every 10 seconds

function timeStringToMinutes(timeString) {
  const [h, m] = timeString.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function simulateTrip(trip) {
  const stops = trip.stops;
  const scheduledStart = timeStringToMinutes(stops[0].scheduledArrival);
  const scheduledEnd = timeStringToMinutes(stops[stops.length - 1].scheduledArrival);
  const scheduledDuration = scheduledEnd - scheduledStart;

  const simulationStart = Date.now();
  const simulationEnd = simulationStart + SIMULATION_DURATION_MIN * 60 * 1000;
  let currentStopIndex = 0;

  while (Date.now() < simulationEnd && currentStopIndex < stops.length) {
    const now = Date.now();
    const elapsedSimMin = ((now - simulationStart) / (SIMULATION_DURATION_MIN * 60 * 1000)) * scheduledDuration;
    const currentScheduledMin = Math.round(scheduledStart + elapsedSimMin);
    const currentSimTime = minutesToTimeString(currentScheduledMin);

    // If it's time to "arrive" at the next stop
    const stop = stops[currentStopIndex];
    if (currentScheduledMin >= timeStringToMinutes(stop.scheduledArrival)) {
      try {
        await axios.post('https://web-api-cw.onrender.com/api/locations', {
          trip: trip.tripId, // or runningNumber: trip.runningNumber,
          busRegistrationNumber: trip.busRegistrationNumber,
          routeNumber: trip.routeNumber,
          stopName: stop.stopName,
          actualArrival: currentSimTime,
          latitude: stop.latitude,
          longitude: stop.longitude
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Trip ${trip.tripId}: Arrived at ${stop.stopName} (Simulated time: ${currentSimTime})`);
      } catch (err) {
        console.error(`Trip ${trip.tripId}: Error at ${stop.stopName}:`, err.response?.data || err.message);
      }
      currentStopIndex++;
    }
    await new Promise(res => setTimeout(res, UPDATE_INTERVAL_SEC * 1000));
  }
}

async function runSimulation() {
  for (const trip of trips) {
    await simulateTrip(trip);
  }
}

runSimulation();