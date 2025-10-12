
const Location = require('../models/location');
const Trip = require('../models/trip');
const Route = require('../models/route');

// Function recordLocation: async, extracts trip, latitude, longitude, speed, heading, accuracy from req.body, validates latitude is between -90 and 90, validates longitude is between -180 and 180, creates location using Location.create with timestamp as current time, returns 201 with location data, use try-catch with 500 status
const recordLocation = async (req, res) => {
    try {
        const { trip, stopName, notes, status } = req.body;

          if (!stopName) {
            return res.status(400).json({
                success: false,
                message: 'Stop name is required'
            });
        }

        // Validate trip exists
        const tripData = await Trip.findById(trip)
            .populate('bus', 'operator')
            .populate('route', 'routeNumber name stops');

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

          // Validate stop exists on this route using locationName
        const isValidStop = tripData.route.stops.some(stop => 
            stop.locationName.toLowerCase().includes(stopName.toLowerCase()) ||
            stopName.toLowerCase().includes(stop.locationName.toLowerCase())
        );

        if (!isValidStop) {
            return res.status(400).json({
                success: false,
                message: `Stop "${stopName}" is not on route ${tripData.route.routeNumber}`,
                validStops: tripData.route.stops.map(stop => stop.locationName)
            });
        }

        // If previous location exists and new status is 'arrived', update previous departure time
        if (status === 'arrived') {
            const previousLocation = await Location.findOne({ trip: trip })
                .sort({ timestamp: -1 });
            
            if (previousLocation && !previousLocation.actualDeparture) {
                previousLocation.actualDeparture = new Date();
                previousLocation.status = 'departed';
                await previousLocation.save();
            }
        }


          const location = await Location.create({
            trip,
            stopName: stopName.trim(),
            notes: notes || '',
            status: status || 'arrived',
            actualArrival: new Date(),
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Location recorded successfully',
            data: {  location: {
                    _id: location._id,
                    trip: location.trip,
                    stopName: location.stopName,
                    actualArrival: location.actualArrival,
                    notes: location.notes,
                    status: location.status,
                    timestamp: location.timestamp
                } }
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

         // Get trip details
        const tripData = await Trip.findById(tripId)
            .populate('route', 'name routeNumber')
            .populate('bus', 'registrationNumber');

        res.status(200).json({
            success: true,
            data: {
               trip: tripData ? {
                    runningNumber: tripData.runningNumber,
                    busRegistrationNumber: tripData.busRegistrationNumber,
                    route: tripData.route
                } : null,
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

         const tripData = await Trip.findById(tripId)
            .populate('route', 'name routeNumber')
            .populate('bus', 'registrationNumber');

        res.status(200).json({
            success: true,
            data: { 
                location,
                trip: tripData ? {
                    runningNumber: tripData.runningNumber,
                    busRegistrationNumber: tripData.busRegistrationNumber,
                    route: tripData.route
                } : null
            }
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
           const { route, operator } = req.query;
        
        let filter = { status: 'in-progress' };
        
        if (route) {
            filter.routeNumber = route.toUpperCase();
        }

        const trips = await Trip.find(filter)
            .populate('bus', 'busNumber registrationNumber operator')
            .populate('route', 'name routeNumber origin destination');

        const liveLocations = [];

        for (const trip of trips) {
            const latestLocation = await Location.findOne({ trip: trip._id })
                .sort({ timestamp: -1 });

            if (latestLocation && isLocationRecent(latestLocation.timestamp)) {
                liveLocations.push({
                    trip: {
                        id: trip._id,
                        runningNumber: trip.runningNumber,
                        busRegistrationNumber: trip.busRegistrationNumber,
                        bus: trip.bus,
                        route: trip.route,
                        scheduledDeparture: trip.scheduledDeparture,
                        scheduledArrival: trip.scheduledArrival,
                        status: trip.status,
                        serviceType: trip.serviceType
                    },
                    location: {
                        stopName: latestLocation.stopName,
                        actualArrival: latestLocation.actualArrival,
                        timestamp: latestLocation.timestamp,
                        timeAgo: getTimeAgo(latestLocation.timestamp),
                        notes: latestLocation.notes,
                        status: latestLocation.status
                    }
                });
            }
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

const getBusTrackingInfo = async (req, res) => {
    try {
        const { busRegistrationNumber } = req.params;

        // Find current active trip for this bus
        const currentTrip = await Trip.findOne({
            busRegistrationNumber: busRegistrationNumber.toUpperCase(),
            status: 'in-progress'
        }).populate('route', 'name routeNumber origin destination stops estimatedDuration totalDistance');

        if (!currentTrip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found for this bus'
            });
        }

        // Get latest location for current trip
        const latestLocation = await Location.findOne({ trip: currentTrip._id })
            .sort({ timestamp: -1 });

        if (!latestLocation) {
            return res.status(404).json({
                success: false,
                message: 'No location data found for this bus'
            });
        }

        // Get next scheduled stop from route using locationName
        const nextStop = currentTrip.route.getNextStop(latestLocation.stopName);
        
        // Get current stop info
        const currentStop = currentTrip.route.getStopByLocationName(latestLocation.stopName);
        
        // Calculate estimated arrival
        const estimatedArrival = calculateEstimatedArrival(currentStop, nextStop);

        res.status(200).json({
            success: true,
            data: {
                routeNumber: currentTrip.routeNumber,
                busRegistrationNumber: currentTrip.busRegistrationNumber,
                lastStopLocation: latestLocation.stopName,
                lastSeenTime: formatTime(latestLocation.actualArrival),
                timeAgo: getTimeAgo(latestLocation.timestamp),
                nextStopLocation: nextStop ? nextStop.locationName : "Final Destination",
                estimatedArrival: estimatedArrival,
                busStatus: isLocationRecent(latestLocation.timestamp) ? "Active" : "Last seen"
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bus tracking info',
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

const getBusesOnRoute = async (req, res) => {
    try {
        const { routeNumber } = req.params;

        const activeTrips = await Trip.find({
            routeNumber: routeNumber.toUpperCase(),
            status: 'in-progress'
        }).populate('route', 'name origin destination stops');

        if (activeTrips.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active buses on this route currently',
                data: {
                    routeNumber,
                    activeBuses: [],
                    totalActiveBuses: 0
                }
            });
        }

        const activeBuses = [];

        for (const trip of activeTrips) {
            const location = await Location.findOne({ trip: trip._id })
                .sort({ timestamp: -1 });

            if (location && isLocationRecent(location.timestamp)) {
                const nextStop = trip.route.getNextStop(location.stopName);
                const currentStop = trip.route.getStopByLocationName(location.stopName);

                activeBuses.push({
                    busRegistrationNumber: trip.busRegistrationNumber,
                    runningNumber: trip.runningNumber,
                    serviceType: trip.serviceType,
                    currentStop: location.stopName,
                    lastUpdated: getTimeAgo(location.timestamp),
                    nextStop: nextStop ? nextStop.locationName : trip.route.destination,
                    estimatedArrival: calculateEstimatedArrival(currentStop, nextStop),
                    status: location.status,
                    notes: location.notes || ''
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Active buses on route retrieved successfully',
            data: {
                route: {
                    routeNumber,
                    name: activeTrips[0]?.route?.name,
                    origin: activeTrips[0]?.route?.origin,
                    destination: activeTrips[0]?.route?.destination
                },
                activeBuses,
                totalActiveBuses: activeBuses.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching buses on route',
            error: error.message
        });
    }
};

const getTripTracking = async (req, res) => {
    try {
        const { runningNumber } = req.params;

        const trip = await Trip.findOne({
            runningNumber: runningNumber.toUpperCase(),
            status: 'in-progress'
        }).populate('route', 'name routeNumber origin destination stops');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found with this running number'
            });
        }

        // Get all locations for this trip (for route tracking)
        const locations = await Location.find({ trip: trip._id })
            .sort({ timestamp: 1 }) // Chronological order
            .limit(50); // Last 50 points

        const latestLocation = locations[locations.length - 1];
        const nextStop = latestLocation ? trip.route.getNextStop(latestLocation.stopName) : null;

        res.status(200).json({
            success: true,
            data: {
                trip: {
                    runningNumber: trip.runningNumber,
                    busRegistrationNumber: trip.busRegistrationNumber,
                    route: trip.route,
                    serviceType: trip.serviceType,
                    scheduledDeparture: trip.scheduledDeparture,
                    scheduledArrival: trip.scheduledArrival,
                    status: trip.status
                },
                currentLocation: latestLocation ? {
                    stopName: latestLocation.stopName,
                    actualArrival: latestLocation.actualArrival,
                    lastUpdated: getTimeAgo(latestLocation.timestamp),
                    status: latestLocation.status
                } : null,
                nextStop: nextStop ? {
                    locationName: nextStop.locationName,
                    estimatedArrival: nextStop.estimatedArrivalTime,
                    order: nextStop.order
                } : null,
                routeHistory: locations.map(loc => ({
                    stopName: loc.stopName,
                    actualArrival: loc.actualArrival,
                    actualDeparture: loc.actualDeparture,
                    timestamp: loc.timestamp,
                    status: loc.status,
                    notes: loc.notes
                })),
                totalPoints: locations.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trip tracking',
            error: error.message
        });
    }
};

// Get bus location on specific route (ADMIN)
const getBusLocationOnRoute = async (req, res) => {
    try {
        const { busId, routeId } = req.params;

        const trip = await Trip.findOne({
            bus: busId,
            route: routeId,
            status: 'in-progress'
        })
        .populate('bus', 'busNumber registrationNumber')
        .populate('route', 'name routeNumber origin destination');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found for this bus on this route'
            });
        }

        const latestLocation = await Location.findOne({ trip: trip._id })
            .sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            data: {
                trip: {
                    id: trip._id,
                    runningNumber: trip.runningNumber,
                    bus: trip.bus,
                    route: trip.route,
                    scheduledDeparture: trip.scheduledDeparture,
                    scheduledArrival: trip.scheduledArrival,
                    status: trip.status
                },
                location: latestLocation ? {
                    stopName: latestLocation.stopName,
                    actualArrival: latestLocation.actualArrival,
                    timestamp: latestLocation.timestamp,
                    timeAgo: getTimeAgo(latestLocation.timestamp),
                    status: latestLocation.status,
                    notes: latestLocation.notes
                } : null
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


// HELPER FUNCTIONS

// Calculate estimated arrival at next stop
function calculateEstimatedArrival(currentStop, nextStop) {
    if (!nextStop) {
        return "Final destination";
    }
    
    if (!currentStop || !currentStop.travelTimeToNext) {
        return "20-25 minutes"; // Default estimate
    }
    
    const travelMinutes = currentStop.travelTimeToNext;
    const bufferMinutes = 5; // Buffer for boarding/traffic
    const totalMinutes = travelMinutes + bufferMinutes;
    
    return formatDuration(totalMinutes);
}

// Format duration from minutes to readable format
function formatDuration(totalMinutes) {
    if (totalMinutes < 5) {
        return "Arriving soon";
    } else if (totalMinutes < 60) {
        return `${totalMinutes} minutes`;
    } else {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (mins === 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        return `${hours}h ${mins}m`;
    }
}

// Calculate delay compared to schedule
function calculateDelay(actualArrival, scheduledStop) {
    if (!scheduledStop || !scheduledStop.estimatedArrivalTime) {
        return "No schedule data";
    }
    
    // Create today's scheduled time
    const now = new Date();
    const [hours, minutes] = scheduledStop.estimatedArrivalTime.split(':');
    const scheduledTime = new Date();
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If scheduled time is for tomorrow (early morning trips)
    if (scheduledTime < new Date(now.getTime() - 12 * 60 * 60 * 1000)) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delayMs = actualArrival - scheduledTime;
    const delayMinutes = Math.floor(delayMs / 60000);
    
    if (delayMinutes > 5) {
        return `${delayMinutes} minutes late`;
    } else if (delayMinutes < -5) {
        return `${Math.abs(delayMinutes)} minutes early`;
    }
    return "On time";
}

// Format time to readable format
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// Get time ago in human readable format
function getTimeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
}

// Check if location is recent (within 15 minutes by default)
function isLocationRecent(timestamp, maxAgeMinutes = 15) {
    const now = new Date();
    const ageMs = now - timestamp;
    const ageMinutes = ageMs / 60000;
    return ageMinutes <= maxAgeMinutes;
}

const searchTripsForCommuters = async (req, res) => {
    try {
        const { 
            origin, 
            destination, 
            date,
            departureAfter,
            serviceType,
            page = 1,
            limit = 10
        } = req.query;

        if (!origin && !destination) {
            return res.status(400).json({
                success: false,
                message: 'Please provide origin or destination for search'
            });
        }

        // Find matching routes
        let routeFilter = { status: 'active' };
        if (origin) routeFilter.origin = new RegExp(origin, 'i');
        if (destination) routeFilter.destination = new RegExp(destination, 'i');

        const routes = await Route.find(routeFilter);
        const routeNumbers = routes.map(route => route.routeNumber);

        if (routeNumbers.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: { trips: [] },
                message: 'No routes found for the specified locations'
            });
        }

        // Find trips on these routes
        let tripFilter = {
            routeNumber: { $in: routeNumbers },
            status: { $in: ['scheduled', 'in-progress'] }
        };

        // Filter by date if provided
        if (date) {
            const searchDate = new Date(date);
            const startDate = new Date(searchDate.setHours(0, 0, 0, 0));
            const endDate = new Date(searchDate.setHours(23, 59, 59, 999));
            tripFilter.createdAt = { $gte: startDate, $lte: endDate };
        }

        // Filter by departure time if provided
        if (departureAfter) {
            tripFilter.scheduledDeparture = { $gte: departureAfter };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const trips = await Trip.find(tripFilter)
            .populate('route', 'routeNumber origin destination totalDistance estimatedDuration')
            .sort({ scheduledDeparture: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Add live location data to each trip
        const tripsWithLocation = [];
        for (const trip of trips) {
            const latestLocation = await Location.findOne({ trip: trip._id })
                .sort({ timestamp: -1 });

            tripsWithLocation.push({
                ...trip.toObject(),
                currentLocation: latestLocation ? {
                    stopName: latestLocation.stopName,
                    lastUpdated: getTimeAgo(latestLocation.timestamp),
                    status: latestLocation.status
                } : null,
                isLive: latestLocation && isLocationRecent(latestLocation.timestamp)
            });
        }

        const total = await Trip.countDocuments(tripFilter);

        res.status(200).json({
            success: true,
            count: tripsWithLocation.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: { trips: tripsWithLocation }
        });

    } catch (error) {
        console.error('Search trips for commuters error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching trips',
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
    getBusLocationOnRoute,
    getBusTrackingInfo,
    getBusesOnRoute,
    getTripTracking,
    searchTripsForCommuters
};