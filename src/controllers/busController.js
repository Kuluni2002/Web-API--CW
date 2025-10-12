const Bus = require('../models/bus');
const Operator = require('../models/operator');
const Route = require('../models/route');

// @desc    Create a new bus
// @route   POST /api/buses
// @access  Admin only
const createBus = async (req, res) => {
    try {
        const { 
            registrationNumber, 
            permitNumber, 
            operator, 
            routeNumber,
            type, 
            capacity, 
            serviceType,
            validityDate 
        } = req.body;

        // Validate required fields
        if (!registrationNumber || !permitNumber || !operator || !routeNumber || !capacity || !validityDate) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: registrationNumber, permitNumber, operator, routeNumber, capacity, validityDate'
            });
        }

        // Validate operator exists
        const operatorExists = await Operator.findById(operator);
        if (!operatorExists) {
            return res.status(400).json({
                success: false,
                message: 'Operator does not exist'
            });
        }

        // Validate route exists
        const route = await Route.findOne({ routeNumber });
        if (!route) {
            return res.status(400).json({
                success: false,
                message: 'Route number does not exist'
            });
        }

        // Check if registration number already exists
        const existingBus = await Bus.findOne({ 
            registrationNumber: registrationNumber.toUpperCase() 
        });
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'Bus with this registration number already exists'
            });
        }

        // Check if permit number already exists
        const existingPermit = await Bus.findOne({ 
            permitNumber: permitNumber.trim() 
        });
        if (existingPermit) {
            return res.status(400).json({
                success: false,
                message: 'Bus with this permit number already exists'
            });
        }

        // Create bus
        const bus = await Bus.create({
            registrationNumber: registrationNumber.toUpperCase(),
            permitNumber: permitNumber.trim(),
            operator: operator,
            routeNumber: routeNumber.trim(),
            type: type || 'Normal',
            capacity: parseInt(capacity),
            serviceType: serviceType || 'N',
            validityDate: new Date(validityDate),
            status: 'active'
        });

        // Populate and return
        const populatedBus = await Bus.findById(bus._id)
            .populate('operatorDetails', 'name email contactNumber')
            .populate('routeDetails', 'routeNumber origin destination totalDistance');

        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            data: { bus: populatedBus }
        });

    } catch (error) {
        console.error('Create bus error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`,
                error: 'Duplicate field value'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating bus',
            error: error.message
        });
    }
};

// @desc    Get all buses with filtering and pagination
// @route   GET /api/buses
// @access  Admin, Operator (own buses only)
const getAllBuses = async (req, res) => {
    try {
        const { 
            page = 1,
            limit = 10,
            status, 
            type, 
            operator, 
            routeNumber,
            serviceType,
            permitStatus,
            search
        } = req.query;

        // Build filter
        let filter = {};
        
        // If user is operator, only show their buses
        if (req.user.role === 'operator') {
            filter.operator = req.user.id;
        } else if (operator) {
            filter.operator = operator;
        }

        if (status) filter.status = status;
        if (type) filter.type = type;
        if (routeNumber) filter.routeNumber = routeNumber;
        if (serviceType) filter.serviceType = serviceType;

        // Search functionality
        if (search) {
            filter.$or = [
                { registrationNumber: new RegExp(search, 'i') },
                { permitNumber: new RegExp(search, 'i') }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let buses = await Bus.find(filter)
            .populate('operatorDetails', 'name email contactNumber')
            .populate('routeDetails', 'routeNumber origin destination totalDistance estimatedDuration')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Filter by permit status if requested
        if (permitStatus) {
            buses = buses.filter(bus => bus.permitStatus === permitStatus);
        }

        // Get total count for pagination
        const total = await Bus.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: buses.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: { buses }
        });

    } catch (error) {
        console.error('Get buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses',
            error: error.message
        });
    }
};

// @desc    Get bus by ID
// @route   GET /api/buses/:id
// @access  Admin, Operator (own buses only)
const getBusById = async (req, res) => {
    try {
        const { id } = req.params;

        let filter = { _id: id };
        
        // If user is operator, only allow access to their buses
        if (req.user.role === 'operator') {
            filter.operator = req.user.id;
        }

        const bus = await Bus.findOne(filter)
            .populate('operatorDetails', 'name email contactNumber')
            .populate('routeDetails', 'routeNumber origin destination totalDistance estimatedDuration stops');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found or access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: { bus }
        });

    } catch (error) {
        console.error('Get bus by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus',
            error: error.message
        });
    }
};

// @desc    Get bus by registration number
// @route   GET /api/buses/registration/:registrationNumber
// @access  Public
const getBusByRegistration = async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        const bus = await Bus.findOne({ 
            registrationNumber: registrationNumber.toUpperCase() 
        })
        .populate('operatorDetails', 'name email contactNumber')
        .populate('routeDetails', 'routeNumber origin destination');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { bus }
        });

    } catch (error) {
        console.error('Get bus by registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus',
            error: error.message
        });
    }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Admin, Operator (own buses only)
const updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let filter = { _id: id };
        
        // If user is operator, only allow updates to their buses
        if (req.user.role === 'operator') {
            filter.operator = req.user.id;
        }

        // Check if bus exists and user has permission
        const existingBus = await Bus.findOne(filter);
        if (!existingBus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found or access denied'
            });
        }

        // Normalize fields
        if (updates.registrationNumber) {
            updates.registrationNumber = updates.registrationNumber.toUpperCase();
            
            // Check if new registration number already exists (exclude current bus)
            const existingReg = await Bus.findOne({
                _id: { $ne: id },
                registrationNumber: updates.registrationNumber
            });
            if (existingReg) {
                return res.status(400).json({
                    success: false,
                    message: 'Registration number already exists'
                });
            }
        }

        if (updates.permitNumber) {
            updates.permitNumber = updates.permitNumber.trim();
            
            // Check if new permit number already exists (exclude current bus)
            const existingPermit = await Bus.findOne({
                _id: { $ne: id },
                permitNumber: updates.permitNumber
            });
            if (existingPermit) {
                return res.status(400).json({
                    success: false,
                    message: 'Permit number already exists'
                });
            }
        }

        if (updates.routeNumber) {
            updates.routeNumber = updates.routeNumber.trim();
            
            // Validate route exists if being updated
            const route = await Route.findOne({ routeNumber: updates.routeNumber });
            if (!route) {
                return res.status(400).json({
                    success: false,
                    message: 'Route number does not exist'
                });
            }
        }

        const bus = await Bus.findOneAndUpdate(
            filter,
            updates,
            { new: true, runValidators: true }
        )
        .populate('operatorDetails', 'name email contactNumber')
        .populate('routeDetails', 'routeNumber origin destination');

        res.status(200).json({
            success: true,
            message: 'Bus updated successfully',
            data: { bus }
        });

    } catch (error) {
        console.error('Update bus error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating bus',
            error: error.message
        });
    }
};

// @desc    Delete bus (soft delete by changing status)
// @route   DELETE /api/buses/:id
// @access  Admin only
const deleteBus = async (req, res) => {
    try {
        const { id } = req.params;

        const bus = await Bus.findByIdAndUpdate(
            id,
            { status: 'retired' },
            { new: true }
        );

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bus retired successfully'
        });

    } catch (error) {
        console.error('Delete bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retiring bus',
            error: error.message
        });
    }
};

// @desc    Get buses by operator
// @route   GET /api/buses/operator/:operatorId
// @access  Admin, Operator (own buses only)
const getBusesByOperator = async (req, res) => {
    try {
        const { operatorId } = req.params;

        // If user is operator, only allow access to their own buses
        if (req.user.role === 'operator' && req.user.id !== operatorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const buses = await Bus.find({ operator: operatorId })
            .populate('operatorDetails', 'name email contactNumber')
            .populate('routeDetails', 'routeNumber origin destination');

        res.status(200).json({
            success: true,
            count: buses.length,
            data: { buses }
        });

    } catch (error) {
        console.error('Get buses by operator error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses by operator',
            error: error.message
        });
    }
};

// @desc    Get buses by route
// @route   GET /api/buses/route/:routeNumber
// @access  Public
const getBusesByRoute = async (req, res) => {
    try {
        const { routeNumber } = req.params;
        const { status = 'active' } = req.query;

        const buses = await Bus.find({ 
            routeNumber: routeNumber, 
            status: status 
        })
        .populate('operatorDetails', 'name email contactNumber')
        .populate('routeDetails', 'routeNumber origin destination');

        res.status(200).json({
            success: true,
            count: buses.length,
            data: { buses }
        });

    } catch (error) {
        console.error('Get buses by route error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses by route',
            error: error.message
        });
    }
};

// @desc    Get expiring permits
// @route   GET /api/buses/expiring-permits
// @access  Admin only
const getExpiringPermits = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        const buses = await Bus.find({
            validityDate: { $lte: futureDate },
            status: 'active'
        })
        .populate('operatorDetails', 'name email contactNumber')
        .populate('routeDetails', 'routeNumber origin destination')
        .sort({ validityDate: 1 });

        res.status(200).json({
            success: true,
            count: buses.length,
            message: `Buses with permits expiring in next ${days} days`,
            data: { buses }
        });

    } catch (error) {
        console.error('Get expiring permits error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expiring permits',
            error: error.message
        });
    }
};


module.exports = {
    createBus,
    getAllBuses,
    getBusById,
    getBusByRegistration,
    updateBus,
    deleteBus,
    getBusesByOperator,
    getBusesByRoute,
    getExpiringPermits
};