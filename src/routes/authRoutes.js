// Authentication routes for NTC Bus API
// Import express and create router using express.Router()
const express = require('express');
const router = express.Router();

// Import register, login, getMe from ../controllers/authController
const { register, login, getMe } = require('../controllers/authController');

// Import protect middleware from ../middleware/auth
const { protect } = require('../middleware/auth');

// Define POST route /register that calls register controller
router.post('/register', register);

// Define POST route /login that calls login controller
router.post('/login', login);

// Define GET route /me that uses protect middleware and calls getMe controller
router.get('/me', protect, getMe);

// Export router as default
module.exports = router;