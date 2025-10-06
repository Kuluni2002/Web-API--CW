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
    deleteRoute
} = require('../controllers/routeController');

// Import protect and authorize from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

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