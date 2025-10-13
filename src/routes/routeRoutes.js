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

// Routes with specific patterns should come FIRST
router.get('/number/:routeNumber', protect, getRouteByNumber);           // Get by route number
router.get('/:routeNumber/stops', protect, getRouteStops); 

// All routes use protect middleware
// POST / uses authorize with admin role, calls createRoute
router.post('/', protect, authorize('admin'), createRoute);

// GET / calls getAllRoutes (accessible to all authenticated users)
router.get('/', protect, getAllRoutes);

// GET /:id calls getRouteById
router.get('/:id', protect, getRouteById);



// PUT /:id uses authorize with admin, calls updateRoute
router.put('/:id', protect, authorize('admin'), updateRoute);

// DELETE /:id uses authorize with admin, calls deleteRoute
router.delete('/:id', protect, authorize('admin'), deleteRoute);

// Export router
module.exports = router;