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

// All routes use protect middleware
// POST / uses authorize with admin roles, calls createBus
router.post('/', protect, authorize('admin'), createBus);

// GET / calls getAllBuses
router.get('/', protect, getAllBuses);

// GET /operator/:operatorId calls getBusesByOperator
router.get('/operator/:operatorId', protect, getBusesByOperator);

// GET /:id calls getBusById
router.get('/:id', protect, getBusById);

// PUT /:id uses authorize with admin roles, calls updateBus
router.put('/:id', protect, authorize('admin'), updateBus);

// DELETE /:id uses authorize with admin, calls deleteBus
router.delete('/:id', protect, authorize('admin'), deleteBus);

// Export router
module.exports = router;