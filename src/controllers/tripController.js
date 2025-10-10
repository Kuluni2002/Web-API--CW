// Trip controller for bus trip scheduling and management
// Import Trip, Bus, Route, Operator models from ../models
const Trip = require('../models/trip');
const Bus = require('../models/bus');
const Route = require('../models/route');
const Operator = require('../models/operator');

// Function createTrip: async, extracts tripNumber, bus, route, scheduledDeparture, scheduledArrival, direction, serviceType, fare, driver from req.body, gets operator from req.user.operatorId or extracts from body, validates scheduledArrival is after scheduledDeparture, creates trip using Trip.create, returns 201 with trip data, use try-catch with 500 status
const createTrip = async (req, res) => {
    try {
        const { 
            tripNumber, 
            bus, 
            route, 
            scheduledDeparture, 
            scheduledArrival, 
            direction, 
            serviceType, 
            fare, 
            driver 
        } = req.body;

        // Get operator from user or body
        const operator = req.user?.operatorId || req.body.operator;

        // Validate scheduledArrival is after scheduledDeparture
        if (new Date(scheduledArrival) <= new Date(scheduledDeparture)) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled arrival must be after scheduled departure'
            });
        }

        const trip = await Trip.create({
            tripNumber,
            bus,
            route,
            operator,
            scheduledDeparture,
            scheduledArrival,
            direction,
            serviceType,
            fare,
            driver
        });

        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            data: { trip }
        });
    } catch (error) {
        console.error('Create trip error:', error);
        
        // Handle duplicate trip number
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Trip with this trip number already exists'
            });
        }
        
        // Handle validation errors
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

// Function getAllTrips: async, extracts query params date, route, bus, status for filtering, builds filter object, if date provided convert to date range for that day, finds trips using Trip.find with filter, populates bus with select busNumber registrationNumber, populates route with select name routeNumber, sorts by scheduledDeparture ascending, returns 200 with count and trips array, use try-catch
const getAllTrips = async (req, res) => {
    try {
        const { date, route, bus, status } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (route) filter.route = route;
        if (bus) filter.bus = bus;
        if (status) filter.status = status;
        
        // If date provided, convert to date range for that day
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            filter.scheduledDeparture = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const trips = await Trip.find(filter)
            .populate('bus', 'busNumber registrationNumber')
            .populate('route', 'name routeNumber')
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

// Function getTripById: async, gets id from params, finds using findById and populates bus with operator and route fields, if not found return 404, returns 200 with trip data, use try-catch
const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('bus', 'busNumber registrationNumber operator')
            .populate('route', 'name routeNumber startLocation endLocation');

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

// Function updateTrip: async, gets id from params, updates using findByIdAndUpdate with req.body, new true, runValidators true, if not found return 404, returns 200 with updated trip, use try-catch
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

// Function updateTripStatus: async, gets id from params, extracts status and actualDeparture or actualArrival from req.body, validates status is valid enum value, if status is in-progress set actualDeparture to now if not provided, if status is completed set actualArrival to now if not provided, updates trip, returns 200 with updated trip, use try-catch
const updateTripStatus = async (req, res) => {
    try {
        const { status, actualDeparture, actualArrival } = req.body;
        
        // Validate status is valid enum value
        const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const updateData = { status };

        // If status is in-progress, set actualDeparture to now if not provided
        if (status === 'in-progress') {
            updateData.actualDeparture = actualDeparture || new Date();
        }

        // If status is completed, set actualArrival to now if not provided
        if (status === 'completed') {
            updateData.actualArrival = actualArrival || new Date();
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

// Function deleteTrip: async, gets id from params, updates status to cancelled, if not found return 404, returns 200 with success message, use try-catch
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

// Function getActiveTrips: async, finds trips where status is in-progress, populates bus and route, sorts by scheduledDeparture, returns 200 with trips array, use try-catch
const getActiveTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ status: 'in-progress' })
            .populate('bus', 'busNumber registrationNumber')
            .populate('route', 'name routeNumber startLocation endLocation')
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

// Function getTripsByRoute: async, gets routeId from params, extracts date from query, builds filter with route and optional date, finds trips, populates bus and route, sorts by scheduledDeparture, returns 200 with trips, use try-catch
const getTripsByRoute = async (req, res) => {
    try {
        const { date } = req.query;
        const filter = { route: req.params.routeId };

        // Build filter with route and optional date
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            filter.scheduledDeparture = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const trips = await Trip.find(filter)
            .populate('bus', 'busNumber registrationNumber')
            .populate('route', 'name routeNumber startLocation endLocation')
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

// Function getTripsByBus: async, gets busId from params, extracts date from query, builds filter, finds trips, populates route, sorts by scheduledDeparture, returns 200 with trips, use try-catch
const getTripsByBus = async (req, res) => {
    try {
        const { date } = req.query;
        const filter = { bus: req.params.busId };

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            filter.scheduledDeparture = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const trips = await Trip.find(filter)
            .populate('route', 'name routeNumber startLocation endLocation')
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

// Export all functions
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