// Location controller for real-time GPS tracking
// Import Location and Trip models from ../models
const Location = require('../models/location');
const Trip = require('../models/trip');

// Function recordLocation: async, extracts trip, latitude, longitude, speed, heading, accuracy from req.body, validates latitude is between -90 and 90, validates longitude is between -180 and 180, creates location using Location.create with timestamp as current time, returns 201 with location data, use try-catch with 500 status
const recordLocation = async (req, res) => {
    try {
        const { trip, latitude, longitude, speed, heading, accuracy } = req.body;

        // Validate latitude is between -90 and 90
        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                success: false,
                message: 'Latitude must be between -90 and 90 degrees'
            });
        }

        // Validate longitude is between -180 and 180
        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Longitude must be between -180 and 180 degrees'
            });
        }

         const tripData = await Trip.findById(trip)
            .populate('bus', 'operator');

        if (!tripData) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check if the bus belongs to the current operator
        if (tripData.bus.operator.toString() !== req.user.operatorId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only record locations for your own buses'
            });
        }


        const location = await Location.create({
            trip,
            coordinates: {
                latitude,
                longitude
            },
            speed,
            heading,
            accuracy,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Location recorded successfully',
            data: { location }
        });
    } catch (error) {
        console.error('Record location error:', error);
        
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

// Function getLocationHistory: async, gets tripId from params, extracts limit from query with default 100, finds locations for trip using Location.find sorted by timestamp descending with limit, returns 200 with count and locations array, use try-catch
const getLocationHistory = async (req, res) => {
    try {
        const { tripId } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const locations = await Location.find({ trip: tripId })
            .sort({ timestamp: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            data: {
                locations,
                count: locations.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching location history',
            error: error.message
        });
    }
};

// Function getLatestLocation: async, gets tripId from params, finds one location for trip using findOne sorted by timestamp descending, if not found return 404 with message 'No location data found', returns 200 with location data, use try-catch
const getLatestLocation = async (req, res) => {
    try {
        const { tripId } = req.params;

        const location = await Location.findOne({ trip: tripId })
            .sort({ timestamp: -1 });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'No location data found'
            });
        }

        res.status(200).json({
            success: true,
            data: { location }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching latest location',
            error: error.message
        });
    }
};

// Function getLiveLocations: async, finds all in-progress trips using Trip.find with status in-progress, for each trip gets latest location, builds array of objects with trip details and latest location, returns 200 with array, use try-catch
const getLiveLocations = async (req, res) => {
    try {
        // Find all in-progress trips
        const trips = await Trip.find({ status: 'in-progress' })
            .populate('bus', 'busNumber registrationNumber')
            .populate('route', 'name routeNumber startLocation endLocation');

        const liveLocations = [];

        // For each trip, get latest location
        for (const trip of trips) {
            const latestLocation = await Location.findOne({ trip: trip._id })
                .sort({ timestamp: -1 });

            // Build array of objects with trip details and latest location
            liveLocations.push({
                trip: {
                    id: trip._id,
                    tripNumber: trip.tripNumber,
                    bus: trip.bus,
                    route: trip.route,
                    scheduledDeparture: trip.scheduledDeparture,
                    scheduledArrival: trip.scheduledArrival,
                    status: trip.status
                },
                location: latestLocation || null,
                lastUpdated: latestLocation?.timestamp || null
            });
        }

        res.status(200).json({
            success: true,
            data: {
                liveLocations,
                count: liveLocations.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching live locations',
            error: error.message
        });
    }
};

// Function deleteLocationHistory: async, gets tripId from params, deletes all locations for trip using Location.deleteMany, returns 200 with success message and deleted count, use try-catch
const deleteLocationHistory = async (req, res) => {
    try {
        const { tripId } = req.params;

        const result = await Location.deleteMany({ trip: tripId });

        res.status(200).json({
            success: true,
            message: 'Location history deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting location history',
            error: error.message
        });
    }
};

const getBusLocationOnRoute = async (req, res) => {
    try {
        const { busId, routeId } = req.params;

        // Find active trip for specific bus on specific route
        const trip = await Trip.findOne({
            bus: busId,
            route: routeId,
            status: 'in-progress'
        })
        .populate('bus', 'busNumber registrationNumber')
        .populate('route', 'name routeNumber startLocation endLocation');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found for this bus on this route'
            });
        }

        // Get latest location for this trip
        const latestLocation = await Location.findOne({ trip: trip._id })
            .sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            data: {
                trip: {
                    id: trip._id,
                    tripNumber: trip.tripNumber,
                    bus: trip.bus,
                    route: trip.route,
                    scheduledDeparture: trip.scheduledDeparture,
                    scheduledArrival: trip.scheduledArrival,
                    status: trip.status
                },
                location: latestLocation || null,
                lastUpdated: latestLocation?.timestamp || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bus location on route',
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    recordLocation,
    getLocationHistory,
    getLatestLocation,
    getLiveLocations,
    deleteLocationHistory,
    getBusLocationOnRoute
};