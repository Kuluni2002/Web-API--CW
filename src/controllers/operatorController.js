// Operator controller for NTC Bus API - manages bus company operations
// Import Operator model from ../models/Operator


const Operator = require('../models/operator');

// Function createOperator: async function with req and res, extracts name, contactNumber, email, permitNumber from req.body, creates new operator using Operator.create, returns 201 with success true and operator data, use try-catch with 500 status for errors
const createOperator = async (req, res) => {
    try {
        console.log(' Request body:', req.body);
        
        const { name, contactNumber, email, password } = req.body;
        
        console.log(' Extracted fields:', { name, contactNumber, email, password: '***' });
        
        // Check if operator already exists (manual check)
        const existingOperator = await Operator.findOne({
            $or: [
                { name: name },
                { email: email },
                { contactNumber: contactNumber }
            ]
        });
        
        console.log(' Existing operator check:', existingOperator);
        
        if (existingOperator) {
            console.log(' Found duplicate operator');
            return res.status(400).json({
                success: false,
                message: 'Operator with similar details already exists'
            });
        }
        
        console.log(' No duplicates found, creating operator...');
        
        const operator = await Operator.create({
            name,
            contactNumber,
            email,
            password
        });

        console.log(' Operator created successfully:', operator._id);

        // Return operator without password
        const operatorData = {
            id: operator._id,
            name: operator.name,
            email: operator.email,
            contactNumber: operator.contactNumber,
            createdAt: operator.createdAt
        };

        res.status(201).json({
            success: true,
            data: {
                operator: operatorData
            }
        });
    } catch (error) {
        console.error(' Create operator error:', error);
        console.error('Error code:', error.code);
        console.error('Error name:', error.name);

        // Handle Mongoose duplicate key error (E11000)
        if (error.code === 11000) {
            console.error(' MongoDB duplicate key error detected');
            console.error('Key pattern:', error.keyPattern);
            
            return res.status(409).json({
                success: false,
                message: 'Duplicate entry detected',
                details: error.keyPattern // Add this to see which field
            });
        }

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.message
            });
        }
        
        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Function getAllOperators: async function with req and res, finds all operators using Operator.find with isActive true, sorts by name ascending, returns 200 with success true and array of operators, use try-catch with 500 status
const getAllOperators = async (req, res) => {
    try {
        const operators = await Operator.find().sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: operators.length,
            data: {
                operators
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

// Function getOperatorById: async function with req and res, gets id from req.params.id, finds operator using Operator.findById, if not found return 404 with message 'Operator not found', returns 200 with success true and operator data, use try-catch
const getOperatorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const operator = await Operator.findById(id);

        if (!operator) {
            return res.status(404).json({
                success: false,
                message: 'Operator not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                operator
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

// Function updateOperator: async function with req and res, gets id from req.params.id, updates operator using findByIdAndUpdate with req.body and options new true and runValidators true, if not found return 404, returns 200 with success true and updated operator, use try-catch
const updateOperator = async (req, res) => {
    try {
        const { id } = req.params;
        
        const operator = await Operator.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!operator) {
            return res.status(404).json({
                success: false,
                message: 'Operator not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                operator
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

// Function deleteOperator: async function with req and res, gets id from req.params.id, soft deletes by setting isActive to false using findByIdAndUpdate, if not found return 404, returns 200 with success true and message 'Operator deleted successfully', use try-catch
const deleteOperator = async (req, res) => {
    try {
        const { id } = req.params;
        
        const operator = await Operator.findByIdAndDelete(id);

        if (!operator) {
            return res.status(404).json({
                success: false,
                message: 'Operator not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Operator deleted successfully'
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
    createOperator,
    getAllOperators,
    getOperatorById,
    updateOperator,
    deleteOperator
};