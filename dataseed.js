const mongoose = require('mongoose');
require('dotenv').config();

const Route = require('./src/models/route');
const Bus = require('./src/models/bus');
const Trip = require('./src/models/trip');
const Operator = require('./src/models/operator');

function addMinutesToTime(timeStr, minutesToAdd) {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutesToAdd;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Optionally clear old data (remove these lines if you want to keep existing data)
    await Route.deleteMany({});
    await Bus.deleteMany({});
    await Trip.deleteMany({});
    await Operator.deleteMany({});

    // Create one operator (no permitNumber)
    const operator = await Operator.create({
        name: 'Demo Operator',
        contactNumber: '0771234567',
        email: 'demo@ntc.lk',
        password: 'demo1234'
    });

    // 5 routes (stops: only locationName)
    const routeData = [
        {
            routeNumber: '01',
            name: 'Colombo - Kandy',
            origin: 'Colombo',
            destination: 'Kandy',
            totalDistance: 116,
            estimatedDuration: { hours: 4, minutes: 10 },
            stops: [
                { locationName: 'Colombo' },
                { locationName: 'Nittambuwa' },
                { locationName: 'Kegalle' },
                { locationName: 'Kandy' }
            ]
        },
        {
            routeNumber: '02',
            name: 'Colombo - Galle',
            origin: 'Colombo',
            destination: 'Galle',
            totalDistance: 116,
            estimatedDuration: { hours: 3, minutes: 30 },
            stops: [
                { locationName: 'Colombo' },
                { locationName: 'Panadura' },
                { locationName: 'Kalutara' },
                { locationName: 'Ambalangoda' },
                { locationName: 'Galle' }
            ]
        },
        {
            routeNumber: '17',
            name: 'Kandy - Panadura',
            origin: 'Kandy',
            destination: 'Panadura',
            totalDistance: 147,
            estimatedDuration: { hours: 4, minutes: 45 },
            stops: [
                { locationName: 'Kandy' },
                { locationName: 'Peradeniya' },
                { locationName: 'Kadugannawa' },
                { locationName: 'Ambepussa' },
                { locationName: 'Kaduwela' },
                { locationName: 'Malabe' },
                { locationName: 'Panadura' }
            ]
        },
        {
            routeNumber: '19',
            name: 'Colombo - Gampola',
            origin: 'Colombo',
            destination: 'Gampola',
            totalDistance: 123,
            estimatedDuration: { hours: 3, minutes: 45 },
            stops: [
                { locationName: 'Colombo' },
                { locationName: 'Nittambuwa' },
                { locationName: 'Kegalle' },
                { locationName: 'Mawanella' },
                { locationName: 'Gampola' }
            ]
        },
        {
            routeNumber: '22',
            name: 'Kandy - Ampara',
            origin: 'Kandy',
            destination: 'Ampara',
            totalDistance: 197,
            estimatedDuration: { hours: 5, minutes: 0 },
            stops: [
                { locationName: 'Kandy' },
                { locationName: 'Mahiyangana' },
                { locationName: 'Padiyathalawa' },
                { locationName: 'Ampara' }
            ]
        }
    ];
    const routes = await Route.insertMany(routeData);

    // 25 buses (with permitNumber)
    const buses = [];
    for (let i = 0; i < 25; i++) {
        const route = routes[i % 5];
        buses.push({
            registrationNumber: `NB-${8500 + i}`,
            permitNumber: `P${1000 + i}`,
            operator: operator._id,
            routeNumber: route.routeNumber,
            type: ['Normal', 'Luxury', 'Semi Luxury'][i % 3],
            capacity: 50,
            validityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
        });
    }
    await Bus.insertMany(buses);

    // 175 trips (25 buses × 7 days)
    const trips = [];
   for (let day = 0; day < 7; day++) {
    for (let i = 0; i < 25; i++) {
        const route = routes[i % 5];
        const busReg = `NB-${8500 + i}`;
        const prefix = route.origin.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 10);
        const runningNumber = `${prefix}${day * 25 + i + 1}`;
        const depHour = 6 + (i % 5);
        const scheduledDeparture = `${String(depHour).padStart(2, '0')}:00`;

        // Calculate total trip duration in minutes
        const totalMinutes = route.estimatedDuration.hours * 60 + route.estimatedDuration.minutes;

        // Calculate interval between stops
        const numStops = route.stops.length;
        const interval = numStops > 1 ? Math.floor(totalMinutes / (numStops - 1)) : 0;

        // Generate estimated arrival times for each stop
        const stops = route.stops.map((stop, idx) => ({
            locationName: stop.locationName,
            estimatedArrivalTime: addMinutesToTime(scheduledDeparture, interval * idx)
        }));

        // Scheduled arrival is arrival at last stop
        const scheduledArrival = stops[stops.length - 1].estimatedArrivalTime;

        trips.push({
            runningNumber,
            busRegistrationNumber: busReg,
            routeNumber: route.routeNumber,
            scheduledDeparture,
            scheduledArrival,
            stops,
            serviceType: ['normal', 'luxury', 'semi-luxury'][i % 3]
        });
    }
}
    await Trip.insertMany(trips);

    console.log('Seed data created!');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});