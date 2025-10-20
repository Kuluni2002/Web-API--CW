// Authentication routes for NTC Bus API
// Import express and create router using express.Router()
const express = require('express');
const router = express.Router();

// Import register, login, getMe from ../controllers/authController
const { register, login, getMe, operatorLogin } = require('../controllers/authController');

// Import protect middleware from ../middleware/auth
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               email:
 *                 type: string
 *                 example: admin@ntc.lk
 *               password:
 *                 type: string
 *                 example: admin123
 *               role:
 *                 type: string
 *                 enum: [admin, operator, commuter]
 *                 example: admin
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login as a user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ntc.lk
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authorized, no token
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/operator/login:
 *   post:
 *     summary: Operator login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: operator@ntc.lk
 *               password:
 *                 type: string
 *                 example: operator123
 *     responses:
 *       200:
 *         description: Operator login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/operator/login', operatorLogin);

// Export router as default
module.exports = router;