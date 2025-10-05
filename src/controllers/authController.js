// Authentication controller for NTC Bus Tracking API
// Import User model from ../models/User and jsonwebtoken
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Function generateToken: accepts userId, returns JWT signed with process.env.JWT_SECRET, expires in 7 days
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// Function register: async function, accepts req and res, extracts username, email, password, role from req.body, checks if user already exists using findOne with $or for email and username, if exists return 400 error with message 'User already exists', creates new user with User.create, generates token using generateToken, returns 201 status with success true, message 'User registered successfully', data object containing user (id, username, email, role) and token, use try-catch for error handling with 500 status
const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password,
            role
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
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

// Function login: async function, accepts req and res, extracts email and password from req.body, validates both are provided else return 400, finds user by email using findOne, if not found return 401 with message 'Invalid credentials', compares password using await user.comparePassword method, if not match return 401 with 'Invalid credentials', generates token, returns 200 with success true, message 'Login successful', data containing user info and token, use try-catch with 500 status
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate both email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
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

// Function getMe: async function, accepts req and res, finds user by req.user.id using findById and select('-password') to exclude password, returns 200 with success true and user data, use try-catch with 500 status
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        res.status(200).json({
            success: true,
            data: {
                user
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

// Export register, login, and getMe functions
module.exports = {
    register,
    login,
    getMe
};