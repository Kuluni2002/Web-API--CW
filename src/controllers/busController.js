// Bus controller for bus fleet management
// Import Bus, Operator, and Route models
const Bus = require('../models/bus');
const Operator = require('../models/operator');
const Route = require('../models/route');

// Function createBus: async, extracts busNumber, registrationNumber, operator, route, capacity, type, status from req.body, creates bus using Bus.create, returns 201 with bus data, use try-catch
const createBus = async (req, res) => {
    try {
        const { registrationNumber, operator, route, type, status } = req.body;
        
        const bus = await Bus.create({         
            registrationNumber, 
            operator,           
            route,                       
            type,            
            status 
        });

        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            data: {
                bus
            }
        });
    } catch (error) {

        console.error('Create bus error:', error);  // ✅ ADDED LOGGING
        
        // Handle duplicate registration number
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Bus with this registration number already exists'
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

// Function getAllBuses: async, extracts query params operator, route, status for filtering, builds filter object, finds buses using Bus.find with filter, populates operator and route fields with select for name fields only, sorts by busNumber, returns 200 with count and buses array, use try-catch
const getAllBuses = async (req, res) => {
    try {
        const { operator, route, type, status } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (operator) {
            filter.operator = operator;
        }
        
        if (route) {
            filter.route = route;
        }
        
        if (type) {
            filter.type = type;
        }

         if (status) {  
            filter.status = status;
        }

        const buses = await Bus.find(filter)
            .populate('operator', 'name permitNumber')
            //.populate('route', 'name')
            .sort({route: 1, registrationNumber: 1 });

        res.status(200).json({
            success: true,
            count: buses.length,
            data: {
                buses
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error Fetching Buses',
            error: error.message
        });
    }
};

// Function getBusById: async, gets id from params, finds using findById and populates operator and route, if not found return 404, returns 200 with bus data, use try-catch
const getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bus = await Bus.findById(id)
            .populate('operator')
            .populate('route');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                bus
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

// Function updateBus: async, gets id from params, updates using findByIdAndUpdate with req.body, new true, runValidators true, if not found return 404, returns 200 with updated bus, use try-catch
const updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bus = await Bus.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('operator').populate('route');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                bus
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

// Function deleteBus: async, gets id from params, soft deletes by setting status to inactive, if not found return 404, returns 200 with success message, use try-catch
const deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bus = await Bus.findByIdAndDelete(id);

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bus deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Function getBusesByOperator: async, gets operatorId from params, finds buses where operator matches operatorId and status is active, populates route, returns 200 with buses array, use try-catch
const getBusesByOperator = async (req, res) => {
    try {
        const { operatorId } = req.params;
        
        const buses = await Bus.find({ operator: operatorId, status: 'active' })
            //.populate('route');
            .sort({ route: 1, registrationNumber: 1 });

        res.status(200).json({
            success: true,
            count: buses.length,
            data: {
                buses
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

// Export all functions
module.exports = {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    deleteBus,
    getBusesByOperator
};