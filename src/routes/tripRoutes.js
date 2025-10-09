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

// All routes use protect middleware
// POST / uses authorize with operator role, calls createTrip
router.post('/', protect, authorize('operator'), createTrip);

// GET / calls getAllTrips (accessible to all authenticated users)
router.get('/', protect, getAllTrips);

// GET /active calls getActiveTrips
router.get('/active', protect, getActiveTrips);

// GET /route/:routeId calls getTripsByRoute
router.get('/route/:routeId', protect, getTripsByRoute);

// GET /bus/:busId calls getTripsByBus
router.get('/bus/:busId', protect, getTripsByBus);

// GET /:id calls getTripById
router.get('/:id', protect, getTripById);

// PUT /:id uses authorize with operator, calls updateTrip
router.put('/:id', protect, authorize('operator'), updateTrip);

// PUT /:id/status uses authorize with operator, calls updateTripStatus
router.put('/:id/status', protect, authorize('operator'), updateTripStatus);

// DELETE /:id uses authorize with operator, calls deleteTrip
router.delete('/:id', protect, authorize('operator'), deleteTrip);

// Export router
module.exports = router;