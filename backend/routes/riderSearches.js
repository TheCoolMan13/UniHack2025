const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const riderSearchesController = require('../controllers/riderSearchesController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/rider-searches
 * @desc    Save a rider search for future matching
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('pickup_latitude').toFloat().isFloat({ min: -90, max: 90 }),
    body('pickup_longitude').toFloat().isFloat({ min: -180, max: 180 }),
    body('pickup_address').trim().notEmpty(),
    body('dropoff_latitude').toFloat().isFloat({ min: -90, max: 90 }),
    body('dropoff_longitude').toFloat().isFloat({ min: -180, max: 180 }),
    body('dropoff_address').trim().notEmpty(),
    body('schedule_days').isArray({ min: 1 }),
    body('schedule_time').trim().notEmpty()
  ],
  riderSearchesController.saveRiderSearch
);

/**
 * @route   GET /api/rider-searches
 * @desc    Get user's saved searches
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  riderSearchesController.getMySavedSearches
);

/**
 * @route   DELETE /api/rider-searches/:id
 * @desc    Cancel a saved search
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').toInt().isInt({ min: 1 }).withMessage('Search ID must be a valid integer')
  ],
  riderSearchesController.cancelSavedSearch
);

/**
 * @route   GET /api/rider-searches/matches/new
 * @desc    Get new matches for saved searches
 * @access  Private
 */
router.get(
  '/matches/new',
  authenticate,
  riderSearchesController.getNewMatches
);

/**
 * @route   PUT /api/rider-searches/matches/:id/viewed
 * @desc    Mark a match as viewed
 * @access  Private
 */
router.put(
  '/matches/:id/viewed',
  authenticate,
  [
    param('id').toInt().isInt({ min: 1 }).withMessage('Match ID must be a valid integer')
  ],
  riderSearchesController.markMatchViewed
);

/**
 * @route   PUT /api/rider-searches/matches/:id/dismiss
 * @desc    Dismiss a match
 * @access  Private
 */
router.put(
  '/matches/:id/dismiss',
  authenticate,
  [
    param('id').toInt().isInt({ min: 1 }).withMessage('Match ID must be a valid integer')
  ],
  riderSearchesController.dismissMatch
);

module.exports = router;

