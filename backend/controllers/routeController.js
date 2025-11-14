const routeService = require('../services/routeService');

/**
 * @desc    Get route between two points
 * @route   POST /api/routes/calculate
 * @access  Private
 */
const calculateRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required',
      });
    }

    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination must have latitude and longitude',
      });
    }

    const route = await routeService.getRoute(origin, destination);

    res.json({
      success: true,
      data: { route },
    });
  } catch (error) {
    console.error('Calculate route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate route',
    });
  }
};

/**
 * @desc    Get route with waypoints
 * @route   POST /api/routes/calculate-with-waypoints
 * @access  Private
 */
const calculateRouteWithWaypoints = async (req, res) => {
  try {
    const { origin, waypoints, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required',
      });
    }

    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination must have latitude and longitude',
      });
    }

    if (waypoints && !Array.isArray(waypoints)) {
      return res.status(400).json({
        success: false,
        message: 'Waypoints must be an array',
      });
    }

    const route = await routeService.getRouteWithWaypoints(
      origin,
      waypoints || [],
      destination
    );

    res.json({
      success: true,
      data: { route },
    });
  } catch (error) {
    console.error('Calculate route with waypoints error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate route',
    });
  }
};

/**
 * @desc    Calculate route overlap
 * @route   POST /api/routes/overlap
 * @access  Private
 */
const calculateOverlap = async (req, res) => {
  try {
    const { route1, route2 } = req.body;

    if (!route1 || !route2) {
      return res.status(400).json({
        success: false,
        message: 'Both routes are required',
      });
    }

    if (!route1.pickupLocation || !route1.dropoffLocation || 
        !route2.pickupLocation || !route2.dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Both routes must have pickupLocation and dropoffLocation',
      });
    }

    const overlap = await routeService.calculateRouteOverlap(route1, route2);

    res.json({
      success: true,
      data: { overlap },
    });
  } catch (error) {
    console.error('Calculate overlap error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate overlap',
    });
  }
};

/**
 * @desc    Check if point is on route
 * @route   POST /api/routes/check-point
 * @access  Private
 */
const checkPointOnRoute = async (req, res) => {
  try {
    const { point, routeStart, routeEnd, threshold } = req.body;

    if (!point || !routeStart || !routeEnd) {
      return res.status(400).json({
        success: false,
        message: 'Point, routeStart, and routeEnd are required',
      });
    }

    if (!point.latitude || !point.longitude || 
        !routeStart.latitude || !routeStart.longitude ||
        !routeEnd.latitude || !routeEnd.longitude) {
      return res.status(400).json({
        success: false,
        message: 'All points must have latitude and longitude',
      });
    }

    const result = await routeService.isPointOnRoute(
      point,
      routeStart,
      routeEnd,
      threshold || 2
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check point on route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check point on route',
    });
  }
};

module.exports = {
  calculateRoute,
  calculateRouteWithWaypoints,
  calculateOverlap,
  checkPointOnRoute,
};

