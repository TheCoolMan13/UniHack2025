const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const driverRequestsController = require('../controllers/driverRequestsController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/driver-requests
 * @desc    Create a driver request (looking for riders)
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
    body('available_seats').toInt().isInt({ min: 1, max: 8 }),
    body('notes').optional().trim()
  ],
  driverRequestsController.createDriverRequest
);

/**
 * @route   GET /api/driver-requests
 * @desc    Get driver's requests
 * @access  Private (Driver)
 */
router.get(
  '/',
  authenticate,
  authorize('driver', 'both'),
  driverRequestsController.getMyDriverRequests
);

/**
 * @route   POST /api/driver-requests/search
 * @desc    Search for driver requests (for passengers)
 * @access  Private
 */
router.post(
  '/search',
  authenticate,
  [
    body('pickup_latitude').toFloat().isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').toFloat().isFloat({ min: -180, max: 180 }),
    body('dropoff_latitude').toFloat().isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').toFloat().isFloat({ min: -180, max: 180 }),
    body('schedule_days').isArray({ min: 1 }),
    body('schedule_time').trim().notEmpty()
  ],
  driverRequestsController.searchDriverRequests
);

/**
 * @route   POST /api/driver-requests/:id/respond
 * @desc    Respond to a driver request (passenger)
 * @access  Private
 */
router.post(
  '/:id/respond',
  authenticate,
  [
    body('pickup_latitude').optional().isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').optional().isFloat({ min: -180, max: 180 }),
    body('pickup_address').optional().trim(),
    body('dropoff_latitude').optional().isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').optional().isFloat({ min: -180, max: 180 }),
    body('dropoff_address').optional().trim()
  ],
  driverRequestsController.respondToDriverRequest
);

/**
 * @route   POST /api/driver-requests/:id/accept-response
 * @desc    Accept a response to driver request
 * @access  Private (Driver)
 */
router.post(
  '/:id/accept-response',
  authenticate,
  authorize('driver', 'both'),
  [
    body('response_id')
      .notEmpty().withMessage('Response ID is required')
      .customSanitizer((value) => String(value))
      .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
          throw new Error('Response ID must be a valid positive integer');
        }
        return true;
      })
  ],
  driverRequestsController.acceptResponse
);

/**
 * @route   POST /api/driver-requests/:id/reject-response
 * @desc    Reject a response to driver request
 * @access  Private (Driver)
 */
router.post(
  '/:id/reject-response',
  authenticate,
  authorize('driver', 'both'),
  [
    body('response_id')
      .notEmpty().withMessage('Response ID is required')
      .customSanitizer((value) => String(value))
      .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
          throw new Error('Response ID must be a valid positive integer');
        }
        return true;
      })
  ],
  driverRequestsController.rejectResponse
);

/**
 * @route   DELETE /api/driver-requests/:id
 * @desc    Cancel a driver request
 * @access  Private (Driver)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('driver', 'both'),
  driverRequestsController.cancelDriverRequest
);

module.exports = router;

