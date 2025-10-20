// Trip routes for trip scheduling and management
// Import express and create router
const express = require('express');
const router = express.Router();

// Import all controller functions from ../controllers/tripController
const {
    createTrip,
    getAllTrips,
    getTripById,
    updateTrip,
    updateTripStatus,
    deleteTrip,
    getActiveTrips,
    getTripsByRoute,
    getTripsByBus
} = require('../controllers/tripController');

// Import protect and authorize from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - runningNumber
 *               - busRegistrationNumber
 *               - routeNumber
 *               - scheduledDeparture
 *               - scheduledArrival
 *               - stops
 *               - serviceType
 *             properties:
 *               runningNumber:
 *                 type: string
 *                 example: CKN1
 *               busRegistrationNumber:
 *                 type: string
 *                 example: NB-8546
 *               routeNumber:
 *                 type: string
 *                 example: 57
 *               scheduledDeparture:
 *                 type: string
 *                 example: 08:00
 *               scheduledArrival:
 *                 type: string
 *                 example: 10:30
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     locationName:
 *                       type: string
 *                       example: Colombo
 *                     estimatedArrivalTime:
 *                       type: string
 *                       example: 08:00
 *               serviceType:
 *                 type: string
 *                 example: N
 *     responses:
 *       201:
 *         description: Trip created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized, no token
 *       403:
 *         description: User role not authorized
 */
router.post('/', protect, authorize('admin'), createTrip);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trips
 *       401:
 *         description: Not authorized, no token
 */
router.get('/', protect, getAllTrips);

/**
 * @swagger
 * /api/trips/active:
 *   get:
 *     summary: Get all active trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active trips
 *       401:
 *         description: Not authorized, no token
 */
router.get('/active', protect, getActiveTrips);

/**
 * @swagger
 * /api/trips/route/{routeNumber}:
 *   get:
 *     summary: Get trips by route number
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: 57
 *     responses:
 *       200:
 *         description: List of trips for the route
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: Route not found
 */
router.get('/route/:routeNumber', protect, getTripsByRoute);

/**
 * @swagger
 * /api/trips/bus/{busRegistrationNumber}:
 *   get:
 *     summary: Get trips by bus registration number
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busRegistrationNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: NB-8546
 *     responses:
 *       200:
 *         description: List of trips for the bus
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: Bus not found
 */
router.get('/bus/:busRegistrationNumber', protect, getTripsByBus);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get trip by ID
 *     tags: [Trips]
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
 *         description: Trip details
 *       404:
 *         description: Trip not found
 */
router.get('/:id', protect, getTripById);

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Update trip details
 *     tags: [Trips]
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
 *         description: Trip updated
 *       404:
 *         description: Trip not found
 */
router.put('/:id', protect, authorize('admin'), updateTrip);

/**
 * @swagger
 * /api/trips/{id}/status:
 *   put:
 *     summary: Update trip status
 *     tags: [Trips]
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
 *               status:
 *                 type: string
 *                 example: completed
 *     responses:
 *       200:
 *         description: Trip status updated
 *       404:
 *         description: Trip not found
 */
router.put('/:id/status', protect, authorize('operator'), updateTripStatus);

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete trip
 *     tags: [Trips]
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
 *         description: Trip deleted
 *       404:
 *         description: Trip not found
 */
router.delete('/:id', protect, authorize('admin'), deleteTrip);

// Export router
module.exports = router;