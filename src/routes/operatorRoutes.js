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

// Define POST route / that uses protect, authorize with admin role only, calls createOperator
router.post('/', protect, authorize('admin'), createOperator);

// Define GET route / that uses protect, calls getAllOperators
router.get('/', protect, getAllOperators);

// Define GET route /:id that uses protect, calls getOperatorById
router.get('/:id', protect, getOperatorById);

// Define PUT route /:id that uses protect, authorize with admin role only, calls updateOperator
router.put('/:id', protect, authorize('admin'), updateOperator);

// Define DELETE route /:id that uses protect, authorize with admin role only, calls deleteOperator
router.delete('/:id', protect, authorize('admin'), deleteOperator);

// Export router
module.exports = router;