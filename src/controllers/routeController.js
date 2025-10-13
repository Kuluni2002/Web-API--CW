// Route controller for bus routes management
// Import Route model from ../models/Route
const Route = require('../models/route');

// Function createRoute: async function with req and res, extracts routeNumber, name, origin, destination, distance, estimatedDuration, stops from req.body, creates route using Route.create, returns 201 with success and route data, use try-catch with 500 status
const createRoute = async (req, res) => {
    try {
        
        
        // Load and check route model
        const Route = require('../models/route');
        console.log('🔍 Route model loaded from:', require.resolve('../models/route'));
        console.log('🔍 Route required paths:', Route.schema.requiredPaths());
        
        const { routeNumber, name, origin, destination, totalDistance, estimatedDuration, stops } = req.body;

        // Test 1: Create route object
        console.log('🔍 Creating route object...');
        const routeData = {
            routeNumber,
            name,
            origin,
            destination,
            totalDistance,
            estimatedDuration,
            stops
        };
        
        const route = new Route(routeData);
        console.log('✅ Route object created');
        
        // Test 2: Manual validation
        console.log('🔍 Running manual validation...');
        const validationError = route.validateSync();
        if (validationError) {
            console.log('❌ Validation errors found:');
            Object.keys(validationError.errors).forEach(key => {
                console.log(`   - Field: ${key}`);
                console.log(`   - Message: ${validationError.errors[key].message}`);
                console.log(`   - Value: ${validationError.errors[key].value}`);
                console.log(`   - Path: ${validationError.errors[key].path}`);
            });
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationError.errors
            });
        }
        
        console.log('✅ Manual validation passed');
        
        // Test 3: Save to database
        console.log('🔍 Saving to database...');
        const savedRoute = await route.save();
        console.log('✅ Route saved successfully:', savedRoute._id);

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: { route: savedRoute }
        });

    } catch (error) {
        console.log('\n❌ === ERROR DETAILS ===');
        console.log('❌ Error name:', error.name);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error code:', error.code);
        
        if (error.errors) {
            console.log('❌ Error details:');
            Object.keys(error.errors).forEach(key => {
                console.log(`   - ${key}: ${error.errors[key].message}`);
            });
        }
        
        console.log('❌ Full error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
const getAllRoutes = async (req, res) => {
    try {
        const { origin, destination } = req.query;
        
        // Build filter object
        const filter = {isActive: true};

       
        
        if (origin) {
            filter.origin = { $regex: origin, $options: 'i' };
        }
        
        if (destination) {
            filter.destination = { $regex: destination, $options: 'i' };
        }

        
    
        const routes = await Route.find(filter)
        
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
        });

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
        );

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
                    //estimatedDepartureTime: stop.estimatedDepartureTime,
                    //travelTimeToNext: stop.travelTimeToNext,
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





// Export all functions
module.exports = {
    createRoute,
    getAllRoutes,
    getRouteById,
    getRouteByNumber,
    updateRoute,
    deleteRoute,
    getRouteStops
};