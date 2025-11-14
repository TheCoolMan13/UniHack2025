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
    body('pickup_latitude').isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').isFloat({ min: -180, max: 180 }),
    body('pickup_address').trim().notEmpty(),
    body('dropoff_latitude').isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').isFloat({ min: -180, max: 180 }),
    body('dropoff_address').trim().notEmpty(),
    body('schedule_days').isArray().notEmpty(),
    body('schedule_time').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('available_seats').isInt({ min: 1, max: 8 })
  ],
  ridesController.createRide
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
    body('pickup_latitude').isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').isFloat({ min: -180, max: 180 }),
    body('dropoff_latitude').isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').isFloat({ min: -180, max: 180 }),
    body('schedule_days').isArray().notEmpty(),
    body('schedule_time').trim().notEmpty()
  ],
  ridesController.searchRides
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
  [body('request_id').isInt()],
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
  [body('request_id').isInt()],
  ridesController.rejectRequest
);

module.exports = router;

