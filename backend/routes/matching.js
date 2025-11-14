const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { findMatchingRides } = require('../services/matchingService');
const db = require('../config/database');

/**
 * @route   POST /api/matching/search
 * @desc    Search for matching rides using matching algorithm
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
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        pickup_latitude,
        pickup_longitude,
        dropoff_latitude,
        dropoff_longitude,
        schedule_days,
        schedule_time
      } = req.body;

      // Get all active rides
      const [allRides] = await db.execute(
        `SELECT r.*, u.name as driver_name, u.rating as driver_rating
         FROM rides r
         JOIN users u ON r.driver_id = u.id
         WHERE r.status = 'active' AND r.available_seats > 0`
      );

      // Parse schedule_days for each ride
      const ridesWithParsedDays = allRides.map(ride => ({
        ...ride,
        schedule_days: JSON.parse(ride.schedule_days)
      }));

      // Use matching service
      const passengerRoute = {
        pickupLocation: { latitude: pickup_latitude, longitude: pickup_longitude },
        dropoffLocation: { latitude: dropoff_latitude, longitude: dropoff_longitude },
        schedule: { days: schedule_days, time: schedule_time }
      };

      const driverRoutes = ridesWithParsedDays.map(ride => ({
        id: ride.id,
        driver_id: ride.driver_id,
        driver_name: ride.driver_name,
        driver_rating: ride.driver_rating,
        pickupLocation: {
          latitude: parseFloat(ride.pickup_latitude),
          longitude: parseFloat(ride.pickup_longitude)
        },
        dropoffLocation: {
          latitude: parseFloat(ride.dropoff_latitude),
          longitude: parseFloat(ride.dropoff_longitude)
        },
        schedule: {
          days: ride.schedule_days,
          time: ride.schedule_time
        },
        price: parseFloat(ride.price),
        available_seats: ride.available_seats
      }));

      const matches = await findMatchingRides(passengerRoute, driverRoutes);

      res.json({
        success: true,
        data: {
          matches,
          count: matches.length
        }
      });
    } catch (error) {
      console.error('Matching search error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during matching'
      });
    }
  }
);

module.exports = router;

