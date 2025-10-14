// Authentication middleware for protecting routes and role-based authorization
// Import jsonwebtoken and User model from ../models/User
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Operator = require('../models/operator');

// Function protect: async middleware function, accepts req, res, next, declares token variable, checks if req.headers.authorization exists and starts with 'Bearer', extracts token by splitting authorization header and taking second part, if no token return 401 with message 'Not authorized, no token', verifies token using jwt.verify with process.env.JWT_SECRET, gets decoded id, finds user by decoded.id using User.findById and select('-password'), attaches user to req.user, if no user found return 401 with 'User not found', calls next(), use try-catch to return 401 with 'Not authorized, invalid token' on error
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if authorization header exists and starts with 'Bearer'
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Extract token by splitting authorization header and taking second part
            token = req.headers.authorization.split(' ')[1];
        }

        // If no token return 401 with message 'Not authorized, no token'
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        // Verify token using jwt.verify with process.env.JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by decoded.id using User.findById and select('-password')
        let user = await User.findById(decoded.id).select('-password');

        // If no user found return 401 with 'User not found'
         if (!user) {
            // Try to find user in Operator collection
            user = await Operator.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
        }

        // Attach user to req.user
        req.user = user;

        // Call next()
        next();
    } catch (error) {
        // Use try-catch to return 401 with 'Not authorized, invalid token' on error
        return res.status(401).json({
            success: false,
            message: 'Not authorized, invalid token'
        });
    }
};

// Function authorize: accepts variable number of roles using rest parameter, returns middleware function that checks if req.user.role is included in roles array, if not return 403 with message indicating user role is not authorized, otherwise call next()
const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if req.user.role is included in roles array
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this resource`
            });
        }

        // Otherwise call next()
        next();
    };
};

// Export protect and authorize functions
module.exports = {
    protect,
    authorize
};