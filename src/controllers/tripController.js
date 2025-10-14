const Trip = require('../models/trip');
const Route = require('../models/route');

// Create a new trip
const createTrip = async (req, res) => {
    try {
        const { 
            runningNumber, 
            busRegistrationNumber, 
            routeNumber, 
            scheduledDeparture, 
            scheduledArrival, 
            stops,
            serviceType 
        } = req.body;

        // Validate that route exists
        const route = await Route.findOne({ routeNumber: routeNumber.toUpperCase() });
        if (!route) {
            return res.status(400).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Validate stops match route stops
        if (!stops || stops.length !== route.stops.length) {
            return res.status(400).json({
                success: false,
                message: 'Stops must match the route stops'
            });
        }

        const trip = await Trip.create({
            runningNumber,
            busRegistrationNumber,
            routeNumber,
            scheduledDeparture,
            scheduledArrival,
            stops,
            serviceType
        });

        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            data: { trip }
        });
    } catch (error) {
        console.error('Create trip error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Trip with this running number already exists'
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all trips with filtering
const getAllTrips = async (req, res) => {
    try {
        const { routeNumber, busRegistrationNumber, status, date } = req.query;
        
        const filter = {};
        
        if (routeNumber) filter.routeNumber = routeNumber.toUpperCase();
        if (busRegistrationNumber) filter.busRegistrationNumber = busRegistrationNumber.toUpperCase();
        if (status) filter.status = status;
        
        const trips = await Trip.find(filter)
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            data: {
                trips,
                count: trips.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trips',
            error: error.message
        });
    }
};

// Get trip by ID
const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { trip }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trip',
            error: error.message
        });
    }
};

// Update trip
const updateTrip = async (req, res) => {
    try {
        const trip = await Trip.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully',
            data: { trip }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating trip',
            error: error.message
        });
    }
};

// Update trip status
const updateTripStatus = async (req, res) => {
    try {
        const { status, actualDeparture, actualArrival } = req.body;
        
        const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const updateData = { status };

        if (status === 'in-progress') {
            updateData.actualDeparture = actualDeparture || new Date().toTimeString().slice(0, 5);
        }

        if (status === 'completed') {
            updateData.actualArrival = actualArrival || new Date().toTimeString().slice(0, 5);
        }

        const trip = await Trip.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Trip status updated successfully',
            data: { trip }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating trip status',
            error: error.message
        });
    }
};

// Delete (cancel) trip
const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Trip cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling trip',
            error: error.message
        });
    }
};

// Get active trips
const getActiveTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ status: 'in-progress' })
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            data: {
                trips,
                count: trips.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching active trips',
            error: error.message
        });
    }
};

// Get trips by route
const getTripsByRoute = async (req, res) => {
    try {
        const { routeNumber } = req.params;
        const { date } = req.query;
        
        const filter = { routeNumber: routeNumber.toUpperCase() };

        const trips = await Trip.find(filter)
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            data: {
                trips,
                count: trips.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trips by route',
            error: error.message
        });
    }
};

// Get trips by bus
const getTripsByBus = async (req, res) => {
    try {
        const { busRegistrationNumber } = req.params;
        const { date } = req.query;
        
        const filter = { busRegistrationNumber: busRegistrationNumber.toUpperCase() };

        const trips = await Trip.find(filter)
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            data: {
                trips,
                count: trips.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trips by bus',
            error: error.message
        });
    }
};

module.exports = {
    createTrip,
    getAllTrips,
    getTripById,
    updateTrip,
    updateTripStatus,
    deleteTrip,
    getActiveTrips,
    getTripsByRoute,
    getTripsByBus
};