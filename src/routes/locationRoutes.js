// Location routes for GPS tracking
// Import express and create router
const express = require('express');
const router = express.Router();

// Import all controller functions from ../controllers/locationController
const {
    recordLocation,
    getLocationHistory,
    getLatestLocation,
    getLiveLocations,
    deleteLocationHistory,
    getBusLocationOnRoute   
} = require('../controllers/locationController');

// Import protect and authorize from ../middleware/auth
const { protect, authorize } = require('../middleware/auth');

// All routes use protect middleware
// POST / uses authorize with operator role, calls recordLocation
router.post('/', protect, authorize('operator'), recordLocation);

router.get('/bus/:busId/route/:routeId', protect, getBusLocationOnRoute);

// GET /trip/:tripId/history calls getLocationHistory
router.get('/trip/:tripId/history', protect, getLocationHistory);

// GET /trip/:tripId/latest calls getLatestLocation
router.get('/trip/:tripId/latest', protect, getLatestLocation);

// GET /live calls getLiveLocations (accessible to all authenticated users)
router.get('/live', protect, getLiveLocations);

// DELETE /trip/:tripId uses authorize with admin, calls deleteLocationHistory
router.delete('/trip/:tripId', protect, authorize('admin'), deleteLocationHistory);

// Export router
module.exports = router;