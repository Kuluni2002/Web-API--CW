// Route routes for bus route management
// Import express and create router
const express = require('express');
const router = express.Router();

// Import all controller functions from ../controllers/routeController
const {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute,
    getRouteByNumber,
    getRouteStops
} = require('../controllers/routeController');

// Import protect and authorize from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

router.use((req, res, next) => {
    console.log('ROUTES middleware - Method:', req.method, 'Path:', req.path);
    console.log('Full URL:', req.originalUrl);
    next();
});

// Add this test route (NO authentication required)
router.post('/test-no-auth', async (req, res) => {
    try {
        console.log('Test route called with body:', req.body);
        
        const Route = require('../models/route');
        const testRoute = await Route.create({
            routeNumber: "TEST123",
            name: "Test Route",
            origin: "Test Origin",
            destination: "Test Destination", 
            totalDistance: 10,
            estimatedDuration: {
                hours: 0,
                minutes: 30
            },
            stops: [
                {
                    locationName: "Stop A",
                    estimatedArrivalTime: "06:00"
                },
                {
                    locationName: "Stop B", 
                    estimatedArrivalTime: "06:30"
                }
            ]
        });
        
        console.log('Route created successfully:', testRoute._id);
        res.status(201).json({
            success: true,
            message: 'Test route created',
            data: testRoute
        });
        
    } catch (error) {
        console.log('Test route error:', error.message);
        console.log('Full error:', error);
        res.status(500).json({
            success: false,
            message: 'Test route failed',
            error: error.message
        });
    }
});


router.get('/number/:routeNumber', protect, getRouteByNumber);     

/**
 * @swagger
 * /api/routes/{routeNumber}/stops:
 *   get:
 *     summary: Get stops by route number
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of stops
 *       404:
 *         description: Route not found
 */
router.get('/:routeNumber/stops', protect, getRouteStops); 

// All routes use protect middleware
/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeNumber
 *               - name
 *               - origin
 *               - destination
 *               - totalDistance
 *               - estimatedDuration
 *               - stops
 *             properties:
 *               routeNumber:
 *                 type: string
 *                 example: 01
 *               name:
 *                 type: string
 *                 example: Colombo - Kandy
 *               origin:
 *                 type: string
 *                 example: Colombo
 *               destination:
 *                 type: string
 *                 example: Kandy
 *               totalDistance:
 *                 type: number
 *                 example: 116
 *               estimatedDuration:
 *                 type: object
 *                 properties:
 *                   hours:
 *                     type: integer
 *                     example: 4
 *                   minutes:
 *                     type: integer
 *                     example: 10
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
 *                       example: 10:15
 *     responses:
 *       201:
 *         description: Route created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized, no token
 *       403:
 *         description: User role not authorized
 */
router.post('/', protect, authorize('admin'), createRoute);

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of routes
 *       401:
 *         description: Not authorized, no token
 */
router.get('/', protect, getAllRoutes);

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
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
 *         description: Route details
 *       404:
 *         description: Route not found
 */
router.get('/:id', protect, getRouteById);



/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Update route details
 *     tags: [Routes]
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
 *         description: Route updated
 *       404:
 *         description: Route not found
 */
router.put('/:id', protect, authorize('admin'), updateRoute);

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Delete route
 *     tags: [Routes]
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
 *         description: Route deleted
 *       404:
 *         description: Route not found
 */
router.delete('/:id', protect, authorize('admin'), deleteRoute);

// Export router
module.exports = router;