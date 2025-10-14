const Location = require('../models/location');
const Trip = require('../models/trip');
const Route = require('../models/route');

// Helper function to convert time string to minutes
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

// OPERATOR: Record location update
const recordLocation = async (req, res) => {
    try {
        const { busRegistrationNumber, stopName, actualArrival, notes } = req.body;

        console.log(' Recording location:', { busRegistrationNumber, stopName, actualArrival });

        // Validate required fields
        if (!busRegistrationNumber || !stopName) {
            return res.status(400).json({
                success: false,
                message: 'Bus registration number and stop name are required'
            });
        }

        // 1. Find active trip for this bus
        const trip = await Trip.findOne({
            busRegistrationNumber: busRegistrationNumber.toUpperCase(),
            status: { $in: ['scheduled', 'in-progress'] }
        });//.populate('routeDetails', 'routeNumber origin destination stops');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found for this bus',
                busRegistrationNumber: busRegistrationNumber.toUpperCase()
            });
        }

        console.log(' Found trip:', trip.runningNumber);

       // const route = trip.routeDetails;
       //const route = await Route.findOne({ routeNumber: trip.routeNumber });

        // 2. Find the stop in route (flexible matching)
        /*const stopInfo = route.stops.find(s => 
            s.locationName.toLowerCase().includes(stopName.toLowerCase()) ||
            stopName.toLowerCase().includes(s.locationName.toLowerCase())
        );*/

        
        //const stopIndex = route.stops.findIndex(s => 
      const stopIndex = trip.stops.findIndex(s =>      
    s.locationName.toLowerCase().includes(stopName.toLowerCase()) ||
    stopName.toLowerCase().includes(s.locationName.toLowerCase())
);
const stopInfo = trip.stops[stopIndex];

        // if (!stopInfo) {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Stop "${stopName}" is not on route ${trip.routeNumber}`,
        //         //validStops: route.stops.map(s => s.locationName)
        //     });
        // }

         if (!stopInfo) {
            return res.status(400).json({
                success: false,
                message: `Stop "${stopName}" is not in this trip's stops`,
                validStops: trip.stops.map(s => s.locationName)
            });
        }

        console.log(' Found stop:', stopInfo.locationName, 'Sequence:', stopIndex + 1);

        // 3. Get scheduled time from route stop or use trip departure for first stop
        const scheduledArrival = stopInfo.estimatedArrivalTime || trip.scheduledDeparture;

        // 4. Calculate delay
        const actualTime = actualArrival || getCurrentTime();
        const scheduledMinutes = timeToMinutes(scheduledArrival);
        const actualMinutes = timeToMinutes(actualTime);
        const delayMinutes = actualMinutes - scheduledMinutes;

        console.log('Time calculation:', {
            scheduled: scheduledArrival,
            actual: actualTime,
            delay: delayMinutes
        });

        // 5. Determine status
        let status;
        if (delayMinutes > 10) {
            status = 'delayed';
        } else if (delayMinutes < -5) {
            status = 'early';
        } else {
            status = 'on-time';
        }

        // 6. Update previous location's departure time if exists
        const previousLocation = await Location.findOne({ 
            trip: trip._id 
        }).sort({ timestamp: -1 });

        if (previousLocation && !previousLocation.actualDeparture) {
            previousLocation.actualDeparture = actualTime;
            previousLocation.status = 'departed';
            await previousLocation.save();
            console.log('Updated previous location departure');
        }

        // 7. Create new location record
        const location = await Location.create({
            trip: trip._id,
            busRegistrationNumber: trip.busRegistrationNumber,
            routeNumber: trip.routeNumber,
            stopName: stopInfo.locationName,
             stopSequence: stopIndex + 1,
            //stopSequence: stopInfo.order,
            scheduledArrival: scheduledArrival,
            actualArrival: actualTime,
            delayMinutes: delayMinutes,
            status: status,
            notes: notes || '',
            timestamp: new Date()
        });

        console.log('Location recorded:', location._id);

        // 8. Update trip status
        if (trip.status === 'scheduled') {
            trip.status = 'in-progress';
            trip.actualDeparture = actualTime;
            console.log('Trip started');
        }

        // // Check if last stop
        // if (stopInfo.order === route.stops.length) {
        //     trip.status = 'completed';
        //     trip.actualArrival = actualTime;
        //     console.log('Trip completed');
        // }

        // Check if last stop
    if (stopIndex + 1 === trip.stops.length) {
        trip.status = 'completed';
        trip.actualArrival = actualTime;
        console.log('Trip completed');
    }

        await trip.save();

        res.status(201).json({
            success: true,
            message: 'Location updated successfully',
            data: {
                location: {
                    busRegistrationNumber: location.busRegistrationNumber,
                    routeNumber: location.routeNumber,
                    currentStop: location.stopName,
                    actualArrival: location.actualArrival,
                    scheduledArrival: location.scheduledArrival,
                    delay: location.delayMinutes,
                    status: location.status,
                    notes: location.notes
                },
                trip: {
                    runningNumber: trip.runningNumber,
                    status: trip.status
                }
            }
        });

    } catch (error) {
        console.error('Record location error:', error);
        
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

// USER: Get current bus location by registration number
const getBusTrackingInfo = async (req, res) => {
    try {
        const { busRegistrationNumber } = req.params;

        console.log('Searching bus:', busRegistrationNumber);

        // 1. Find latest location for this bus
        const latestLocation = await Location.findOne({
            busRegistrationNumber: busRegistrationNumber.toUpperCase()
        })
        .sort({ timestamp: -1 })
        .limit(1);

        if (!latestLocation) {
            return res.status(404).json({
                success: false,
                message: 'No location data found for this bus',
                busRegistrationNumber: busRegistrationNumber.toUpperCase(),
                busStatus: 'Inactive'
            });
        }

        console.log('Found location at:', latestLocation.stopName);

        // 2. Get trip and route details
        const trip = await Trip.findById(latestLocation.trip);
            //.populate('routeDetails', 'routeNumber origin destination stops');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Associated trip not found'
            });
        }

       // const route = trip.routeDetails;
       const route = await Route.findOne({ routeNumber: trip.routeNumber });

        // 3. Find next stop
        const currentStopIndex = route.stops.findIndex(
            s => s.order === latestLocation.stopSequence
        );
        const nextStop = route.stops[currentStopIndex + 1];

        console.log('Next stop:', nextStop ? nextStop.locationName : 'Final destination');

        // 4. Calculate estimated arrival to next stop
        let estimatedArrival = 'N/A';
        if (nextStop) {
            const currentStop = route.stops[currentStopIndex];
            const travelMinutes = currentStop.travelTimeToNext || 20; // Default 20 mins
            const totalMinutes = travelMinutes + latestLocation.delayMinutes;

            if (totalMinutes < 5) {
                estimatedArrival = 'Arriving soon';
            } else if (totalMinutes < 60) {
                estimatedArrival = `${totalMinutes} minutes`;
            } else {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                estimatedArrival = mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
            }
        }

        // 5. Determine bus status
        const now = new Date();
        const ageMinutes = Math.floor((now - latestLocation.timestamp) / 60000);
        let busStatus;

        if (trip.status === 'completed') {
            busStatus = 'Completed';
        } else if (ageMinutes > 30) {
            busStatus = 'Delayed'; // No update for 30+ minutes
        } else {
            busStatus = 'Active';
        }

        console.log('Status:', busStatus, 'Last update:', ageMinutes, 'mins ago');

        // 6. Format response
        res.json({
            success: true,
            data: {
                routeNumber: route.routeNumber,
                busRegistrationNumber: busRegistrationNumber.toUpperCase(),
                lastStopLocation: latestLocation.stopName,
                lastSeenTime: latestLocation.actualArrival,
                timeAgo: latestLocation.timeAgo,
                nextStopLocation: nextStop ? nextStop.locationName : 'Final destination reached',
                estimatedArrival: estimatedArrival,
                busStatus: busStatus,
                delay: latestLocation.delayMinutes > 0 
                    ? `${latestLocation.delayMinutes} min delay` 
                    : latestLocation.delayMinutes < 0 
                        ? `${Math.abs(latestLocation.delayMinutes)} min early` 
                        : 'On time',
                routeName: `${route.origin} - ${route.destination}`,
                remarks: latestLocation.notes
            }
        });

    } catch (error) {
        console.error('Error fetching bus tracking:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus tracking info',
            error: error.message
        });
    }
};

// Get location history for a trip
const getLocationHistory = async (req, res) => {
    try {
        const { tripId } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const locations = await Location.find({ trip: tripId })
            .sort({ timestamp: 1 }) // Chronological order
            .limit(limit);

        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No location updates found for this trip'
            });
        }

        const trip = await Trip.findById(tripId);
           // .populate('routeDetails', 'routeNumber origin destination');

        res.status(200).json({
            success: true,
            data: {
                trip: trip ? {
                    runningNumber: trip.runningNumber,
                    busRegistrationNumber: trip.busRegistrationNumber,
                    route: trip.routeDetails
                } : null,
                locations: locations.map(loc => ({
                    stopName: loc.stopName,
                    stopSequence: loc.stopSequence,
                    scheduledArrival: loc.scheduledArrival,
                    actualArrival: loc.actualArrival,
                    actualDeparture: loc.actualDeparture,
                    delay: loc.delayMinutes,
                    status: loc.status,
                    notes: loc.notes,
                    timestamp: loc.timestamp,
                    timeAgo: loc.timeAgo
                })),
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

// Get all live locations (for map/dashboard view)
const getLiveLocations = async (req, res) => {
    try {
        const { routeNumber } = req.query;
        
        let filter = { status: 'in-progress' };
        
        if (routeNumber) {
            filter.routeNumber = routeNumber.toUpperCase();
        }

        const trips = await Trip.find(filter)
            .populate('busDetails', 'registrationNumber type capacity');
          //  .populate('routeDetails', 'routeNumber origin destination');

        const liveLocations = [];

        for (const trip of trips) {
            const latestLocation = await Location.findOne({ trip: trip._id })
                .sort({ timestamp: -1 });

            if (latestLocation && latestLocation.isRecent) {
                liveLocations.push({
                    trip: {
                        id: trip._id,
                        runningNumber: trip.runningNumber,
                        busRegistrationNumber: trip.busRegistrationNumber,
                        bus: trip.busDetails,
                        route: trip.routeDetails,
                        serviceType: trip.serviceType
                    },
                    location: {
                        stopName: latestLocation.stopName,
                        actualArrival: latestLocation.actualArrival,
                        delay: latestLocation.delayMinutes,
                        status: latestLocation.status,
                        timeAgo: latestLocation.timeAgo,
                        notes: latestLocation.notes
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

// Get active buses on a specific route
const getBusesOnRoute = async (req, res) => {
    try {
        const { routeNumber } = req.params;

        console.log('🔍 Searching buses on route:', routeNumber);

        const activeTrips = await Trip.find({
            routeNumber: routeNumber.toUpperCase(),
            status: 'in-progress'
        });//.populate('routeDetails', 'routeNumber origin destination stops');

        if (activeTrips.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active buses on this route currently',
                data: {
                    routeNumber: routeNumber.toUpperCase(),
                    activeBuses: [],
                    totalActiveBuses: 0
                }
            });
        }

        const activeBuses = [];

        for (const trip of activeTrips) {
            const location = await Location.findOne({ trip: trip._id })
                .sort({ timestamp: -1 });

            if (location && location.isRecent) {
                const route = trip.routeDetails;
                const currentStopIndex = route.stops.findIndex(
                    s => s.order === location.stopSequence
                );
                const nextStop = route.stops[currentStopIndex + 1];

                activeBuses.push({
                    busRegistrationNumber: trip.busRegistrationNumber,
                    runningNumber: trip.runningNumber,
                    serviceType: trip.serviceType,
                    currentStop: location.stopName,
                    lastUpdated: location.timeAgo,
                    nextStop: nextStop ? nextStop.locationName : route.destination,
                    delay: location.delayMinutes,
                    status: location.status,
                    notes: location.notes
                });
            }
        }

        console.log(`Found ${activeBuses.length} active buses`);

        res.status(200).json({
            success: true,
            data: {
                route: {
                    routeNumber: routeNumber.toUpperCase(),
                    name: activeTrips[0]?.routeDetails?.origin + ' - ' + activeTrips[0]?.routeDetails?.destination
                },
                activeBuses,
                totalActiveBuses: activeBuses.length
            }
        });

    } catch (error) {
        console.error('Error fetching buses on route:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses on route',
            error: error.message
        });
    }
};

// Delete location history (admin only)
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
        const { busRegistrationNumber, routeNumber } = req.params;
        
        // Get current trip for this bus on this route
        const currentTrip = await Trip.findOne({
            busRegistrationNumber: busRegistrationNumber.toUpperCase(),
            routeNumber: routeNumber.toUpperCase(),
            status: 'in-progress'
        });

        if (!currentTrip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found for this bus on this route'
            });
        }

        // Get latest location update
        const latestLocation = await Location.findOne({
            trip: currentTrip._id,
            busRegistrationNumber: busRegistrationNumber.toUpperCase()
        }).sort({ timestamp: -1 });

        if (!latestLocation) {
            return res.status(200).json({
                success: true,
                data: {
                    busRegistrationNumber: busRegistrationNumber.toUpperCase(),
                    routeNumber: routeNumber.toUpperCase(),
                    status: 'No location updates yet',
                    trip: currentTrip
                }
            });
        }

        // Calculate next stops with adjusted times
        const currentStopIndex = latestLocation.stopSequence - 1;
        const delayMinutes = latestLocation.delayMinutes || 0;
        
        const nextStops = currentTrip.stops.slice(currentStopIndex + 1).map(stop => {
            const originalTime = stop.estimatedArrivalTime;
            const adjustedTime = addMinutesToTime(originalTime, delayMinutes);
            
            return {
                locationName: stop.locationName,
                estimatedArrival: originalTime,
                adjustedEstimate: adjustedTime
            };
        });

        res.status(200).json({
            success: true,
            data: {
                busRegistrationNumber: busRegistrationNumber.toUpperCase(),
                routeNumber: routeNumber.toUpperCase(),
                currentLocation: {
                    stopName: latestLocation.stopName,
                    stopSequence: latestLocation.stopSequence,
                    scheduledArrival: latestLocation.scheduledArrival,
                    actualArrival: latestLocation.actualArrival,
                    delayMinutes: latestLocation.delayMinutes,
                    status: latestLocation.status,
                    timestamp: latestLocation.timestamp,
                    notes: latestLocation.notes
                },
                nextStops,
                tripDetails: {
                    runningNumber: currentTrip.runningNumber,
                    scheduledDeparture: currentTrip.scheduledDeparture,
                    scheduledArrival: currentTrip.scheduledArrival
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bus location',
            error: error.message
        });
    }
};

// Helper function to add minutes to time string
const addMinutesToTime = (timeString, minutesToAdd) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
};

// Export all functions
module.exports = {
    recordLocation,
    getBusTrackingInfo,
    getLocationHistory,
    getLiveLocations,
    getBusesOnRoute,
    deleteLocationHistory,
    getBusLocationOnRoute
};