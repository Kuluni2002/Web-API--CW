// Location routes for GPS tracking
// Import express and create router
const express = require('express');
const router = express.Router();

// Import all controller functions from ../controllers/locationController
const {
    recordLocation,
    getLocationHistory,
    getLiveLocations,
    deleteLocationHistory,
    getBusLocationOnRoute   
} = require('../controllers/locationController');

// Import protect and authorize from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Record location update
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - busRegistrationNumber
 *               - routeNumber
 *               - latitude
 *               - longitude
 *               - timestamp
 *             properties:
 *               busRegistrationNumber:
 *                 type: string
 *                 example: NB-8546
 *               routeNumber:
 *                 type: string
 *                 example: 57
 *               latitude:
 *                 type: number
 *                 example: 7.2906
 *               longitude:
 *                 type: number
 *                 example: 80.6337
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-11T08:00:00.000Z
 *     responses:
 *       201:
 *         description: Location recorded
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized, no token
 *       403:
 *         description: User role not authorized
 */
router.post('/', protect, authorize('operator'), recordLocation);

/**
 * @swagger
 * /api/locations/bus/{busRegistrationNumber}/route/{routeNumber}:
 *   get:
 *     summary: Get bus location on a route
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busRegistrationNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: routeNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bus location details
 *       404:
 *         description: Location not found
 */
router.get('/bus/:busRegistrationNumber/route/:routeNumber', protect, getBusLocationOnRoute);

/**
 * @swagger
 * /api/locations/trip/{tripId}/history:
 *   get:
 *     summary: Get location history of a trip
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location history
 *       404:
 *         description: Trip not found
 */
router.get('/trip/:tripId/history', protect, getLocationHistory);

// GET /trip/:tripId/latest calls getLatestLocation
//router.get('/trip/:tripId/latest', protect, getLatestLocation);

// GET /live calls getLiveLocations (accessible to all authenticated users)
router.get('/live', protect, getLiveLocations);

/**
 * @swagger
 * /api/locations/trip/{tripId}:
 *   delete:
 *     summary: Delete location history of a trip
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location history deleted
 *       404:
 *         description: Trip not found
 */
router.delete('/trip/:tripId', protect, authorize('admin'), deleteLocationHistory);

// Export router
module.exports = router;