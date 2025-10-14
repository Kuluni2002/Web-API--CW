const mongoose = require('mongoose');
const fs = require('fs');
const Trip = require('./src/models/trip');
require('dotenv').config();

// Lookup table for stop coordinates (add all stops you use)
const stopCoordinates = {
    'Colombo':      { latitude: 6.9271, longitude: 79.8612 },
    'Nittambuwa':   { latitude: 7.1449, longitude: 80.1016 },
    'Kegalle':      { latitude: 7.2513, longitude: 80.3464 },
    'Kandy':        { latitude: 7.2906, longitude: 80.6337 },
    'Panadura':     { latitude: 6.7136, longitude: 79.9020 },
    'Kalutara':     { latitude: 6.5836, longitude: 79.9607 },
    'Ambalangoda':  { latitude: 6.2359, longitude: 80.0537 },
    'Galle':        { latitude: 6.0535, longitude: 80.2210 },
    'Peradeniya':   { latitude: 7.2715, longitude: 80.5950 },
    'Kadugannawa':  { latitude: 7.2542, longitude: 80.5286 },
    'Ambepussa':    { latitude: 7.2507, longitude: 80.1996 },
    'Kaduwela':     { latitude: 6.9333, longitude: 79.9672 },
    'Malabe':       { latitude: 6.9147, longitude: 79.9725 },
    'Mawanella':    { latitude: 7.2667, longitude: 80.4667 },
    'Gampola':      { latitude: 7.1643, longitude: 80.5696 },
    'Mahiyangana':  { latitude: 7.2287, longitude: 81.0036 },
    'Padiyathalawa':{ latitude: 7.3667, longitude: 81.1167 },
    'Ampara':       { latitude: 7.2919, longitude: 81.6746 }
    // Add more if needed
};

async function exportTrips() {
    await mongoose.connect(process.env.MONGODB_URI);

    const trips = await Trip.find().lean();

    const tripsJson = trips.map(trip => ({
        tripId: trip._id,
        busRegistrationNumber: trip.busRegistrationNumber,
        routeNumber: trip.routeNumber,
        stops: trip.stops.map(stop => ({
            stopName: stop.locationName,
            scheduledArrival: stop.estimatedArrivalTime,
            latitude: stopCoordinates[stop.locationName]?.latitude || 0,
            longitude: stopCoordinates[stop.locationName]?.longitude || 0
            
            
        }))
    }));

    fs.writeFileSync('trips.json', JSON.stringify(tripsJson, null, 2));
    console.log('trips.json generated!');
    await mongoose.disconnect();
}

exportTrips().catch(console.error);