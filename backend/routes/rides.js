const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const ridesController = require('../controllers/ridesController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/rides
 * @desc    Create a new ride (Driver only)
 * @access  Private (Driver)
 */
router.post(
  '/',
  authenticate,
  authorize('driver', 'both'),
  [
    body('pickup_latitude').toFloat().isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').toFloat().isFloat({ min: -180, max: 180 }),
    body('pickup_address').trim().notEmpty(),
    body('dropoff_latitude').toFloat().isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').toFloat().isFloat({ min: -180, max: 180 }),
    body('dropoff_address').trim().notEmpty(),
    body('schedule_days').isArray().notEmpty(),
    body('schedule_time').trim().notEmpty(),
    body('price').toFloat().isFloat({ min: 0 }),
    body('available_seats').toInt().isInt({ min: 1, max: 8 })
  ],
  async (req, res, next) => {
    try {
      await ridesController.createRide(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/rides
 * @desc    Get user's rides (filtered by role)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  query('role').optional().isIn(['driver', 'passenger']),
  ridesController.getMyRides
);

/**
 * @route   GET /api/rides/active
 * @desc    Get all active rides (for map display)
 * @access  Private
 */
router.get('/active', authenticate, ridesController.getActiveRides);

/**
 * @route   GET /api/rides/:id
 * @desc    Get ride details
 * @access  Private
 */
router.get('/:id', authenticate, ridesController.getRideDetails);

/**
 * @route   PUT /api/rides/:id
 * @desc    Update a ride (Driver only)
 * @access  Private (Driver)
 */
router.put(
  '/:id',
  authenticate,
  authorize('driver', 'both'),
  ridesController.updateRide
);

/**
 * @route   DELETE /api/rides/:id
 * @desc    Delete a ride (Driver only)
 * @access  Private (Driver)
 */
router.delete('/:id', authenticate, authorize('driver', 'both'), ridesController.deleteRide);

/**
 * @route   POST /api/rides/search
 * @desc    Search for matching rides (Passenger)
 * @access  Private
 */
router.post(
  '/search',
  authenticate,
  [
    body('pickup_latitude').toFloat().isFloat({ min: -90, max: 90 }).withMessage('Pickup latitude must be a valid number between -90 and 90'),
    body('pickup_longitude').toFloat().isFloat({ min: -180, max: 180 }).withMessage('Pickup longitude must be a valid number between -180 and 180'),
    body('dropoff_latitude').toFloat().isFloat({ min: -90, max: 90 }).withMessage('Dropoff latitude must be a valid number between -90 and 90'),
    body('dropoff_longitude').toFloat().isFloat({ min: -180, max: 180 }).withMessage('Dropoff longitude must be a valid number between -180 and 180'),
    body('schedule_days').isArray({ min: 1 }).withMessage('Schedule days must be a non-empty array'),
    body('schedule_time').trim().notEmpty().withMessage('Schedule time is required')
  ],
  async (req, res, next) => {
    try {
      await ridesController.searchRides(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/rides/:id/request
 * @desc    Request a ride (Passenger)
 * @access  Private
 */
router.post(
  '/:id/request',
  authenticate,
  [
    body('pickup_latitude').optional().isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').optional().isFloat({ min: -180, max: 180 }),
    body('pickup_address').optional().trim(),
    body('dropoff_latitude').optional().isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').optional().isFloat({ min: -180, max: 180 }),
    body('dropoff_address').optional().trim()
  ],
  ridesController.requestRide
);

/**
 * @route   POST /api/rides/:id/accept
 * @desc    Accept a ride request (Driver)
 * @access  Private (Driver)
 */
router.post(
  '/:id/accept',
  authenticate,
  authorize('driver', 'both'),
  [
    body('request_id')
      .notEmpty().withMessage('Request ID is required')
      .customSanitizer((value) => {
        // Convert to string first, then parse to handle both string and number
        return String(value);
      })
      .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
          throw new Error('Request ID must be a valid positive integer');
        }
        return true;
      })
  ],
  ridesController.acceptRequest
);

/**
 * @route   POST /api/rides/:id/reject
 * @desc    Reject a ride request (Driver)
 * @access  Private (Driver)
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('driver', 'both'),
  [
    body('request_id')
      .notEmpty().withMessage('Request ID is required')
      .customSanitizer((value) => {
        // Convert to string first, then parse to handle both string and number
        return String(value);
      })
      .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
          throw new Error('Request ID must be a valid positive integer');
        }
        return true;
      })
  ],
  ridesController.rejectRequest
);

/**
 * @route   POST /api/rides/:id/cancel
 * @desc    Cancel an accepted ride request (Driver)
 * @access  Private (Driver)
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize('driver', 'both'),
  [
    body('request_id')
      .notEmpty().withMessage('Request ID is required')
      .customSanitizer((value) => {
        return String(value);
      })
      .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
          throw new Error('Request ID must be a valid positive integer');
        }
        return true;
      })
  ],
  ridesController.cancelRequest
);

module.exports = router;

