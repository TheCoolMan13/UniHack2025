const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const routeController = require('../controllers/routeController');

/**
 * @route   POST /api/routes/calculate
 * @desc    Calculate route between two points
 * @access  Private
 */
router.post('/calculate', authenticate, routeController.calculateRoute);

/**
 * @route   POST /api/routes/calculate-with-waypoints
 * @desc    Calculate route with waypoints
 * @access  Private
 */
router.post('/calculate-with-waypoints', authenticate, routeController.calculateRouteWithWaypoints);

/**
 * @route   POST /api/routes/overlap
 * @desc    Calculate route overlap between two routes
 * @access  Private
 */
router.post('/overlap', authenticate, routeController.calculateOverlap);

/**
 * @route   POST /api/routes/check-point
 * @desc    Check if a point is on/near a route
 * @access  Private
 */
router.post('/check-point', authenticate, routeController.checkPointOnRoute);

module.exports = router;

