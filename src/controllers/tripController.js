// Trip controller for bus trip scheduling and management
// Import Trip, Bus, Route, Operator models from ../models
const Trip = require('../models/trip');
const Bus = require('../models/bus');
const Route = require('../models/route');
//const Operator = require('../models/operator');


const timeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper function to get current time in HH:MM format
const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Function createTrip: async, extracts tripNumber, bus, route, scheduledDeparture, scheduledArrival, direction, serviceType, fare, driver from req.body, gets operator from req.user.operatorId or extracts from body, validates scheduledArrival is after scheduledDeparture, creates trip using Trip.create, returns 201 with trip data, use try-catch with 500 status
const createTrip = async (req, res) => {
    try {
        const { 
          runningNumber, 
            busRegistrationNumber, 
            routeNumber, 
            scheduledDeparture, 
            scheduledArrival, 
            serviceType 
        } = req.body;

       // Validate required fields
        if (!runningNumber || !busRegistrationNumber || !routeNumber || !scheduledDeparture || !scheduledArrival) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided: runningNumber, busRegistrationNumber, routeNumber, scheduledDeparture, scheduledArrival'
            });
        }

       // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(scheduledDeparture)) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled departure must be in HH:MM format (e.g., 08:30)'
            });
        }

        if (!timeRegex.test(scheduledArrival)) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled arrival must be in HH:MM format (e.g., 10:30)'
            });
        }

        // Validate arrival is after departure
        const depMinutes = timeToMinutes(scheduledDeparture);
        const arrMinutes = timeToMinutes(scheduledArrival);
        
        if (arrMinutes <= depMinutes) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled arrival must be after scheduled departure'
            });
        }

        const trip = await Trip.create({
            runningNumber: runningNumber.toUpperCase(),
            busRegistrationNumber: busRegistrationNumber.toUpperCase(),
            routeNumber: routeNumber,
            scheduledDeparture: scheduledDeparture,
            scheduledArrival: scheduledArrival,
            serviceType: serviceType || 'normal',
            status: 'scheduled'
        });

        // Populate virtual fields and return
        const populatedTrip = await Trip.findById(trip._id)
            .populate('busDetails', 'registrationNumber type capacity status operator')
            .populate('routeDetails', 'routeNumber origin destination distance');

        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            data: { trip: populatedTrip }
        });
    } catch (error) {
        //console.error('Create trip error:', error);
        
        // Handle duplicate trip number
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Trip with this running number already exists',
                error: 'Duplicate running number'
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
        const { status, busRegistrationNumber, routeNumber, date, startTime, endTime, serviceType } = req.query;
        
        // Build filter object
        const filter = {};

         if (status) {
            filter.status = status;
        }
        
        if (busRegistrationNumber) {
            filter.busRegistrationNumber = busRegistrationNumber.toUpperCase();
        }
        
        if (routeNumber) {
            filter.routeNumber = routeNumber;
        }
        
        if (serviceType) {
            filter.serviceType = serviceType;
        }

       // Filter by time range
        if (startTime && endTime) {
            filter.scheduledDeparture = { $gte: startTime, $lte: endTime };
        } else if (startTime) {
            filter.scheduledDeparture = { $gte: startTime };
        } else if (endTime) {
            filter.scheduledDeparture = { $lte: endTime };
        }
        

        const trips = await Trip.find(filter)
            .populate('busDetails',  'registrationNumber type status')
            .populate('routeDetails', 'routeNumber origin destination')
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
           success: true,
            count: trips.length,
            data: { trips }
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
        const { id } = req.params;
        
        const trip = await Trip.findById(id)
            .populate('busDetails', 'registrationNumber type status')
            .populate('routeDetails', 'routeNumber origin destination distance');

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
        const { id } = req.params;
        const updates = req.body;

        if (updates.busRegistrationNumber) {
            updates.busRegistrationNumber = updates.busRegistrationNumber.toUpperCase();
        }

        if (updates.runningNumber) {
            updates.runningNumber = updates.runningNumber.toUpperCase();
        }

            // Validate time formats if provided
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (updates.scheduledDeparture && !timeRegex.test(updates.scheduledDeparture)) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled departure must be in HH:MM format'
            });
        }

        if (updates.scheduledArrival && !timeRegex.test(updates.scheduledArrival)) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled arrival must be in HH:MM format'
            });
        }

        const trip = await Trip.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        )
        .populate('busDetails', 'registrationNumber type status')
        .populate('routeDetails', 'routeNumber origin destination');

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
// Function updateTripStatus: async, gets id from params, extracts status and actualDeparture or actualArrival from req.body, validates status is valid enum value, if status is in-progress set actualDeparture to now if not provided, if status is completed set actualArrival to now if not provided, updates trip, returns 200 with updated trip, use try-catch
const updateTripStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, actualDeparture, actualArrival } = req.body;
        
        // Validate status is valid enum value (matches your Trip model)
        const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updateData = { status };

        // If status is in-progress, set actualDeparture to current time if not provided
        if (status === 'in-progress') {
            updateData.actualDeparture = actualDeparture || getCurrentTime();
        }

        // If status is completed, set actualArrival to current time if not provided
        if (status === 'completed') {
            updateData.actualArrival = actualArrival || getCurrentTime();
            // Also ensure actualDeparture is set
            if (!actualDeparture) {
                const currentTrip = await Trip.findById(id);
                if (currentTrip && !currentTrip.actualDeparture) {
                    updateData.actualDeparture = currentTrip.scheduledDeparture;
                }
            }
        }

        // Validate time formats if provided
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (actualDeparture && !timeRegex.test(actualDeparture)) {
            return res.status(400).json({
                success: false,
                message: 'Actual departure must be in HH:MM format'
            });
        }

        if (actualArrival && !timeRegex.test(actualArrival)) {
            return res.status(400).json({
                success: false,
                message: 'Actual arrival must be in HH:MM format'
            });
        }

        const trip = await Trip.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        )
        .populate('busDetails', 'registrationNumber type status')
        .populate('routeDetails', 'routeNumber origin destination distance');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Trip status updated to ${status} successfully`,
            data: { trip }
        });
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.message
            });
        }
        
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
       const { id } = req.params;
        
        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check if trip can be cancelled
        if (trip.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed trip'
            });
        }
        
        // Update status to cancelled
        trip.status = 'cancelled';
        await trip.save();

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
        const trips = await Trip.find({ 
            status: { $in: ['scheduled', 'in-progress'] } 
        })
        .populate('busDetails', 'registrationNumber type capacity status')
        .populate('routeDetails', 'routeNumber origin destination distance')
        .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: { trips }
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
        const { routeNumber } = req.params;
        const { startTime, endTime } = req.query;
        const filter = { routeNumber: routeNumber };

        // Build filter with route and optional time range
        if (startTime && endTime) {
            filter.scheduledDeparture = { $gte: startTime, $lte: endTime };
        } else if (startTime) {
            filter.scheduledDeparture = { $gte: startTime };
        } else if (endTime) {
            filter.scheduledDeparture = { $lte: endTime };
        }

        const trips = await Trip.find(filter)
            .populate('busDetails', 'registrationNumber type  status')
            .populate('routeDetails', 'routeNumber origin destination distance')
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: { trips }
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
         const { busRegistrationNumber } = req.params;
        const { date } = req.query;
        const filter = { busRegistrationNumber: busRegistrationNumber.toUpperCase() };

       if (startTime && endTime) {
            filter.scheduledDeparture = { $gte: startTime, $lte: endTime };
        } else if (startTime) {
            filter.scheduledDeparture = { $gte: startTime };
        } else if (endTime) {
            filter.scheduledDeparture = { $lte: endTime };
        }

        const trips = await Trip.find(filter)
            .populate('busDetails', 'registrationNumber type capacity status')
            .populate('routeDetails', 'routeNumber origin destination distance')
            .sort({ scheduledDeparture: 1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: { trips }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trips by bus',
            error: error.message
        });
    }
};

const getTripByRunningNumber = async (req, res) => {
    try {
        const { runningNumber } = req.params;
        
        const trip = await Trip.findOne({ 
            runningNumber: runningNumber.toUpperCase() 
        })
        .populate('busDetails', 'registrationNumber type capacity status operator')
        .populate('routeDetails', 'routeNumber origin destination distance');

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
            message: 'Error fetching trip by running number',
            error: error.message
        });
    }
};

const getAvailableBuses = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;
        
        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Start time and end time are required'
            });
        }

       // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({
                success: false,
                message: 'Time must be in HH:MM format (e.g., 09:00, 13:00)'
            });
        }

       // Use the static method from Trip model
        const availableBuses = await Trip.findAvailableBuses(startTime, endTime);

        res.status(200).json({
            success: true,
            count: availableBuses.length,
            data: { buses: availableBuses }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available buses',
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
    getTripsByBus,
    getTripByRunningNumber,
    getAvailableBuses
};