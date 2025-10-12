// Route controller for bus routes management
// Import Route model from ../models/Route
const Route = require('../models/route');

// Function createRoute: async function with req and res, extracts routeNumber, name, origin, destination, distance, estimatedDuration, stops from req.body, creates route using Route.create, returns 201 with success and route data, use try-catch with 500 status
const createRoute = async (req, res) => {
    try {
        const { routeNumber, name, origin, destination, totalDistance, estimatedDuration, stops, operatorId } = req.body;
        
        // Validate required fields
        if (!routeNumber || !name || !origin || !destination || !stops || !stops.length) {
            return res.status(400).json({
                success: false,
                message: 'Route number, name, origin, destination, and stops are required'
            });
        }

        // Validate estimatedDuration format
        if (!estimatedDuration || typeof estimatedDuration.hours !== 'number' || typeof estimatedDuration.minutes !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Estimated duration must have hours and minutes as numbers'
            });
        }

          // Validate estimatedDuration format
        if (!estimatedDuration || typeof estimatedDuration.hours !== 'number' || typeof estimatedDuration.minutes !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Estimated duration must have hours and minutes as numbers'
            });
        }

        // Validate stops (no order field needed, array index determines sequence)
        for (let i = 0; i < stops.length; i++) {
            if (!stops[i].locationName || !stops[i].locationName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: `Location name is required for stop ${i + 1}`
                });
            }

            if (!stops[i].estimatedArrivalTime) {
                return res.status(400).json({
                    success: false,
                    message: `Estimated arrival time is required for stop ${i + 1}`
                });
            }
        }

        // Check if route already exists
        const existingRoute = await Route.findOne({ routeNumber: routeNumber.toUpperCase() });
        if (existingRoute) {
            return res.status(409).json({
                success: false,
                message: 'Route with this number already exists'
            });
        }

        const route = await Route.create({
            routeNumber: routeNumber.toUpperCase(),
            name,
            origin,
            destination,
            totalDistance,
            estimatedDuration,
            operatorId,
            stops: stops
        });

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: { route }
        });
    } catch (error) {

        console.error('Create route error:', error);
        
        // Handle duplicate route number
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Route with this route number already exists'
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

// Function getAllRoutes: async function with req and res, extracts query params origin and destination for filtering, builds filter object checking isActive true, if origin provided add to filter, if destination provided add to filter, finds routes using Route.find with filter, sorts by routeNumber ascending, returns 200 with success, count, and routes array, use try-catch
const getAllRoutes = async (req, res) => {
    try {
        const { origin, destination, operatorId, isActive } = req.query;
        
        // Build filter object
        const filter = {};

        filter.isActive = isActive !== 'false';
        
        if (origin) {
            filter.startLocation = { $regex: origin, $options: 'i' };
        }
        
        if (destination) {
            filter.endLocation = { $regex: destination, $options: 'i' };
        }

         if (operatorId) {
            filter.operatorId = operatorId;
        }
    
        const routes = await Route.find(filter)
        .populate('operatorId', 'name permitNumber contactNumber email')
        .sort({ routeNumber: 1 })
        .select('-stops');

        res.status(200).json({
            success: true,
            count: routes.length,
            data: {
                routes
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Function getRouteById: async function with req and res, gets id from req.params.id, finds route using findById and populates stops, if not found return 404, returns 200 with route data, use try-catch
const getRouteById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const route = await Route.findById(id)
        .populate('operatorId', 'name permitNumber contactNumber email');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                route
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching route',
            error: error.message
        });
    }
};

const getRouteByNumber = async (req, res) => {
    try {
        const { routeNumber } = req.params;

        const route = await Route.findOne({ 
            routeNumber: routeNumber.toUpperCase(),
            isActive: true 
        }).populate('operatorId', 'name permitNumber contactNumber email');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { route }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching route',
            error: error.message
        });
    }
};

// Function updateRoute: async function with req and res, gets id from params, updates using findByIdAndUpdate with req.body, new true, runValidators true, if not found return 404, returns 200 with updated route, use try-catch
const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

         // If updating stops, validate them
        if (updateData.stops) {
            for (let i = 0; i < updateData.stops.length; i++) {
                if (!updateData.stops[i].locationName || !updateData.stops[i].locationName.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: `Location name is required for stop ${i + 1}`
                    });
                }

                if (!updateData.stops[i].estimatedArrivalTime) {
                    return res.status(400).json({
                        success: false,
                        message: `Estimated arrival time is required for stop ${i + 1}`
                    });
                }
            }
        }

        // If updating estimatedDuration, validate format
        if (updateData.estimatedDuration) {
            if (typeof updateData.estimatedDuration.hours !== 'number' || typeof updateData.estimatedDuration.minutes !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Estimated duration must have hours and minutes as numbers'
                });
            }
        }
        
        const route = await Route.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate('operatorId', 'name permitNumber contactNumber email');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Route updated successfully',
            data: {
                route
            }
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
            message: 'Error updating route',
            error: error.message
        });
    }
};

// Function deleteRoute: async function with req and res, gets id from params, soft deletes by setting isActive false, if not found return 404, returns 200 with success message, use try-catch
const deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;
        
        const route = await Route.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Route deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting route',
            error: error.message
        });
    }
};

const getRouteStops = async (req, res) => {
    try {
        const { routeNumber } = req.params;

        const route = await Route.findOne({ 
            routeNumber: routeNumber.toUpperCase(),
            isActive: true 
        }).select('routeNumber name stops origin destination');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                routeNumber: route.routeNumber,
                routeName: route.name,
                origin: route.origin,
                destination: route.destination,
                stops: route.stops.map((stop, index) => ({
                    sequence: index + 1, // Array index + 1 for display
                    locationName: stop.locationName,
                    estimatedArrivalTime: stop.estimatedArrivalTime,
                    estimatedDepartureTime: stop.estimatedDepartureTime,
                    travelTimeToNext: stop.travelTimeToNext,
                    //distanceToNext: stop.distanceToNext
                })),
                totalStops: route.stops.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching route stops',
            error: error.message
        });
    }
};

const searchRoutes = async (req, res) => {
    try {
        const { q, routeType, operatorId } = req.query;

        let filter = { isActive: true };

        if (q) {
            filter.$or = [
                { routeNumber: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { origin: { $regex: q, $options: 'i' } },
                { destination: { $regex: q, $options: 'i' } }
            ];
        }

        if (routeType) {
            filter.routeType = routeType;
        }

        if (operatorId) {
            filter.operatorId = operatorId;
        }

        const routes = await Route.find(filter)
            .populate('operatorId', 'name permitNumber')
            .sort({ routeNumber: 1 })
            .select('-stops')
            .limit(20); // Limit results for performance

        res.status(200).json({
            success: true,
            count: routes.length,
            data: { routes }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching routes',
            error: error.message
        });
    }
};



// Export all functions
module.exports = {
    createRoute,
    getAllRoutes,
    getRouteById,
    getRouteByNumber,
    updateRoute,
    deleteRoute,
    getRouteStops,
    searchRoutes
};