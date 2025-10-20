// Bus routes for bus fleet management
// Import express and create router
const express = require('express');
const router = express.Router();

// Import all controller functions from ../controllers/busController
const {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    deleteBus,
    getBusesByOperator
} = require('../controllers/busController');

// Import protect and authorize from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/buses:
 *   post:
 *     summary: Create a new bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - permitNumber
 *               - operator
 *               - routeNumber
 *               - type
 *               - capacity
 *               - validityDate
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 example: NB-8546
 *               permitNumber:
 *                 type: string
 *                 example: P1001
 *               operator:
 *                 type: string
 *                 example: 68e40e7c493aa86101ad2b59
 *               routeNumber:
 *                 type: string
 *                 example: 57
 *               type:
 *                 type: string
 *                 enum: [Normal, Semi Luxury, Luxury]
 *                 example: Normal
 *               capacity:
 *                 type: integer
 *                 example: 50
 *               validityDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-31
 *     responses:
 *       201:
 *         description: Bus created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized, no token
 *       403:
 *         description: User role not authorized
 */
router.post('/', protect, authorize('admin'), createBus);

/**
 * @swagger
 * /api/buses:
 *   get:
 *     summary: Get all buses
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of buses
 *       401:
 *         description: Not authorized, no token
 */
router.get('/', protect, getAllBuses);

/**
 * @swagger
 * /api/buses/operator/{operatorId}:
 *   get:
 *     summary: Get buses by operator
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operatorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of buses for operator
 *       401:
 *         description: Not authorized, no token
 *       403:
 *         description: Access denied
 */
router.get('/operator/:operatorId', protect, getBusesByOperator);

/**
 * @swagger
 * /api/buses/{id}:
 *   get:
 *     summary: Get bus by ID
 *     tags: [Buses]
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
 *         description: Bus details
 *       404:
 *         description: Bus not found
 */
router.get('/:id', protect, getBusById);

/**
 * @swagger
 * /api/buses/{id}:
 *   put:
 *     summary: Update bus details
 *     tags: [Buses]
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
 *     responses:
 *       200:
 *         description: Bus updated
 *       404:
 *         description: Bus not found
 */
router.put('/:id', protect, authorize('admin'), updateBus);

/**
 * @swagger
 * /api/buses/{id}:
 *   delete:
 *     summary: Delete bus
 *     tags: [Buses]
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
 *         description: Bus retired successfully
 *       404:
 *         description: Bus not found
 */
router.delete('/:id', protect, authorize('admin'), deleteBus);

// Export router
module.exports = router;