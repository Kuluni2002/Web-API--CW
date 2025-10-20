// Operator routes for NTC Bus API
// Import express and create router
const express = require('express');
const router = express.Router();

// Import all functions from ../controllers/operatorController
const {
    createOperator,
    getAllOperators,
    getOperatorById,
    updateOperator,
    deleteOperator
} = require('../controllers/operatorController');

// Import protect and authorize middleware from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/operators:
 *   post:
 *     summary: Create a new operator
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contactNumber
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Demo Operator
 *               contactNumber:
 *                 type: string
 *                 example: 0771234567
 *               email:
 *                 type: string
 *                 example: demo@ntc.lk
 *               password:
 *                 type: string
 *                 example: demo1234
 *     responses:
 *       201:
 *         description: Operator created
 *       400:
 *         description: Operator already exists
 *       401:
 *         description: Not authorized, no token
 *       403:
 *         description: User role not authorized
 */
router.post('/', protect, authorize('admin'), createOperator);

/**
 * @swagger
 * /api/operators:
 *   get:
 *     summary: Get all operators
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of operators
 *       401:
 *         description: Not authorized, no token
 */
router.get('/', protect, getAllOperators);

/**
 * @swagger
 * /api/operators/{id}:
 *   get:
 *     summary: Get operator by ID
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Operator details
 *       404:
 *         description: Operator not found
 */
router.get('/:id', protect, getOperatorById);

/**
 * @swagger
 * /api/operators/{id}:
 *   put:
 *     summary: Update operator details
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Operator updated
 *       404:
 *         description: Operator not found
 */
router.put('/:id', protect, authorize('admin'), updateOperator);

/**
 * @swagger
 * /api/operators/{id}:
 *   delete:
 *     summary: Delete operator
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Operator deleted
 *       404:
 *         description: Operator not found
 */
router.delete('/:id', protect, authorize('admin'), deleteOperator);

// Export router
module.exports = router;