// Route controller for bus routes management
// Import Route model from ../models/Route
const Route = require('../models/route');

// Function createRoute: async function with req and res, extracts routeNumber, name, origin, destination, distance, estimatedDuration, stops from req.body, creates route using Route.create, returns 201 with success and route data, use try-catch with 500 status
const createRoute = async (req, res) => {
    try {
        const { routeNumber, name, startLocation, endLocation, distance, estimatedDuration, stops } = req.body;
        
        const route = await Route.create({
            routeNumber,
            name,
            startLocation,
            endLocation,
            distance,
            estimatedDuration,
            stops
        });

        res.status(201).json({
            success: true,
            data: {
                route
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

// Function getAllRoutes: async function with req and res, extracts query params origin and destination for filtering, builds filter object checking isActive true, if origin provided add to filter, if destination provided add to filter, finds routes using Route.find with filter, sorts by routeNumber ascending, returns 200 with success, count, and routes array, use try-catch
const getAllRoutes = async (req, res) => {
    try {
        const { origin, destination } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (origin) {
            filter.startLocation = { $regex: origin, $options: 'i' };
        }
        
        if (destination) {
            filter.endLocation = { $regex: destination, $options: 'i' };
        }

        const routes = await Route.find(filter).sort({ routeNumber: 1 });

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
        
        const route = await Route.findById(id);

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
            message: 'Server error',
            error: error.message
        });
    }
};

// Function updateRoute: async function with req and res, gets id from params, updates using findByIdAndUpdate with req.body, new true, runValidators true, if not found return 404, returns 200 with updated route, use try-catch
const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        
        const route = await Route.findByIdAndUpdate(
            id,
            req.body,
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
            data: {
                route
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

// Function deleteRoute: async function with req and res, gets id from params, soft deletes by setting isActive false, if not found return 404, returns 200 with success message, use try-catch
const deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;
        
        const route = await Route.findByIdAndDelete(id);

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
            message: 'Server error',
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute
};