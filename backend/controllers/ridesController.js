const { validationResult } = require('express-validator');
const db = require('../config/database');
const { findMatchingRides } = require('../services/matchingService');

/**
 * @desc    Create a new ride
 * @route   POST /api/rides
 * @access  Private (Driver)
 */
const createRide = async (req, res) => {
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
      pickup_address,
      dropoff_latitude,
      dropoff_longitude,
      dropoff_address,
      schedule_days,
      schedule_time,
      price,
      available_seats
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO rides (
        driver_id, pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        schedule_days, schedule_time, price, available_seats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        pickup_latitude,
        pickup_longitude,
        pickup_address,
        dropoff_latitude,
        dropoff_longitude,
        dropoff_address,
        JSON.stringify(schedule_days),
        schedule_time,
        price,
        available_seats
      ]
    );

    // Get created ride with driver info
    const [rides] = await db.execute(
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating 
       FROM rides r 
       JOIN users u ON r.driver_id = u.id 
       WHERE r.id = ?`,
      [result.insertId]
    );

    const ride = rides[0];
    ride.schedule_days = JSON.parse(ride.schedule_days);

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: { ride }
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating ride'
    });
  }
};

/**
 * @desc    Get user's rides
 * @route   GET /api/rides?role=driver|passenger
 * @access  Private
 */
const getMyRides = async (req, res) => {
  try {
    const { role } = req.query;
    const userId = req.user.id;

    let rides;

    if (role === 'driver' || (!role && (req.user.role === 'driver' || req.user.role === 'both'))) {
      // Get rides posted by user as driver
      [rides] = await db.execute(
        `SELECT r.*, u.name as driver_name, u.rating as driver_rating,
         COUNT(rr.id) as request_count
         FROM rides r
         JOIN users u ON r.driver_id = u.id
         LEFT JOIN ride_requests rr ON r.id = rr.ride_id AND rr.status = 'pending'
         WHERE r.driver_id = ?
         GROUP BY r.id
         ORDER BY r.created_at DESC`,
        [userId]
      );
    } else {
      // Get ride requests made by user as passenger
      [rides] = await db.execute(
        `SELECT r.*, u.name as driver_name, u.rating as driver_rating,
         rr.id as request_id, rr.status as request_status
         FROM ride_requests rr
         JOIN rides r ON rr.ride_id = r.id
         JOIN users u ON r.driver_id = u.id
         WHERE rr.passenger_id = ?
         ORDER BY rr.created_at DESC`,
        [userId]
      );
    }

    // Parse JSON fields
    rides.forEach(ride => {
      if (ride.schedule_days) {
        ride.schedule_days = JSON.parse(ride.schedule_days);
      }
    });

    res.json({
      success: true,
      data: { rides }
    });
  } catch (error) {
    console.error('Get my rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching rides'
    });
  }
};

/**
 * @desc    Get ride details
 * @route   GET /api/rides/:id
 * @access  Private
 */
const getRideDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [rides] = await db.execute(
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating, u.phone as driver_phone
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (rides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const ride = rides[0];
    ride.schedule_days = JSON.parse(ride.schedule_days);

    // Get ride requests if user is the driver
    if (ride.driver_id === req.user.id) {
      const [requests] = await db.execute(
        `SELECT rr.*, u.name as passenger_name, u.rating as passenger_rating
         FROM ride_requests rr
         JOIN users u ON rr.passenger_id = u.id
         WHERE rr.ride_id = ?
         ORDER BY rr.created_at DESC`,
        [id]
      );
      ride.requests = requests;
    }

    res.json({
      success: true,
      data: { ride }
    });
  } catch (error) {
    console.error('Get ride details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ride details'
    });
  }
};

/**
 * @desc    Update a ride
 * @route   PUT /api/rides/:id
 * @access  Private (Driver)
 */
const updateRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if ride exists and belongs to user
    const [existingRides] = await db.execute(
      'SELECT * FROM rides WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (existingRides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or you do not have permission to update it'
      });
    }

    const {
      pickup_latitude,
      pickup_longitude,
      pickup_address,
      dropoff_latitude,
      dropoff_longitude,
      dropoff_address,
      schedule_days,
      schedule_time,
      price,
      available_seats,
      status
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (pickup_latitude !== undefined) {
      updates.push('pickup_latitude = ?');
      values.push(pickup_latitude);
    }
    if (pickup_longitude !== undefined) {
      updates.push('pickup_longitude = ?');
      values.push(pickup_longitude);
    }
    if (pickup_address !== undefined) {
      updates.push('pickup_address = ?');
      values.push(pickup_address);
    }
    if (dropoff_latitude !== undefined) {
      updates.push('dropoff_latitude = ?');
      values.push(dropoff_latitude);
    }
    if (dropoff_longitude !== undefined) {
      updates.push('dropoff_longitude = ?');
      values.push(dropoff_longitude);
    }
    if (dropoff_address !== undefined) {
      updates.push('dropoff_address = ?');
      values.push(dropoff_address);
    }
    if (schedule_days !== undefined) {
      updates.push('schedule_days = ?');
      values.push(JSON.stringify(schedule_days));
    }
    if (schedule_time !== undefined) {
      updates.push('schedule_time = ?');
      values.push(schedule_time);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (available_seats !== undefined) {
      updates.push('available_seats = ?');
      values.push(available_seats);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    await db.execute(
      `UPDATE rides SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated ride
    const [rides] = await db.execute(
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating 
       FROM rides r 
       JOIN users u ON r.driver_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    const ride = rides[0];
    ride.schedule_days = JSON.parse(ride.schedule_days);

    res.json({
      success: true,
      message: 'Ride updated successfully',
      data: { ride }
    });
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating ride'
    });
  }
};

/**
 * @desc    Delete a ride
 * @route   DELETE /api/rides/:id
 * @access  Private (Driver)
 */
const deleteRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if ride exists and belongs to user
    const [rides] = await db.execute(
      'SELECT * FROM rides WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (rides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or you do not have permission to delete it'
      });
    }

    await db.execute('DELETE FROM rides WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Ride deleted successfully'
    });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting ride'
    });
  }
};

/**
 * @desc    Get all active rides (for map display)
 * @route   GET /api/rides/active
 * @access  Private
 */
const getActiveRides = async (req, res) => {
  try {
    // Get all active rides
    const [allRides] = await db.execute(
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       WHERE r.status = 'active' AND r.available_seats > 0
       ORDER BY r.created_at DESC`
    );

    // Parse schedule_days for each ride
    const rides = allRides.map(ride => ({
      ...ride,
      schedule_days: JSON.parse(ride.schedule_days),
      pickup_latitude: parseFloat(ride.pickup_latitude),
      pickup_longitude: parseFloat(ride.pickup_longitude),
      dropoff_latitude: parseFloat(ride.dropoff_latitude),
      dropoff_longitude: parseFloat(ride.dropoff_longitude),
      price: parseFloat(ride.price)
    }));

    res.json({
      success: true,
      data: { rides }
    });
  } catch (error) {
    console.error('Get active rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching active rides'
    });
  }
};

/**
 * @desc    Search for matching rides
 * @route   POST /api/rides/search
 * @access  Private
 */
const searchRides = async (req, res) => {
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

    // Use matching service to find matches
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
    console.error('Search rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching rides'
    });
  }
};

/**
 * @desc    Request a ride
 * @route   POST /api/rides/:id/request
 * @access  Private
 */
const requestRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if ride exists
    const [rides] = await db.execute('SELECT * FROM rides WHERE id = ?', [id]);
    if (rides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const ride = rides[0];

    // Check if user is trying to request their own ride
    if (ride.driver_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request your own ride'
      });
    }

    // Check if ride has available seats
    if (ride.available_seats <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available seats on this ride'
      });
    }

    // Check if user already has a pending request for this ride
    const [existingRequests] = await db.execute(
      'SELECT * FROM ride_requests WHERE ride_id = ? AND passenger_id = ? AND status = "pending"',
      [id, userId]
    );

    if (existingRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this ride'
      });
    }

    const {
      pickup_latitude,
      pickup_longitude,
      pickup_address,
      dropoff_latitude,
      dropoff_longitude,
      dropoff_address
    } = req.body;

    // Create ride request
    const [result] = await db.execute(
      `INSERT INTO ride_requests (
        ride_id, passenger_id,
        pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        pickup_latitude || ride.pickup_latitude,
        pickup_longitude || ride.pickup_longitude,
        pickup_address || ride.pickup_address,
        dropoff_latitude || ride.dropoff_latitude,
        dropoff_longitude || ride.dropoff_longitude,
        dropoff_address || ride.dropoff_address
      ]
    );

    // Get created request with passenger info
    const [requests] = await db.execute(
      `SELECT rr.*, u.name as passenger_name, u.rating as passenger_rating
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE rr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Ride request created successfully',
      data: { request: requests[0] }
    });
  } catch (error) {
    console.error('Request ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating ride request'
    });
  }
};

/**
 * @desc    Accept a ride request
 * @route   POST /api/rides/:id/accept
 * @access  Private (Driver)
 */
const acceptRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { request_id } = req.body;
    const userId = req.user.id;

    // Check if ride exists and belongs to user
    const [rides] = await db.execute(
      'SELECT * FROM rides WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (rides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or you do not have permission'
      });
    }

    // Check if request exists and belongs to this ride
    const [requests] = await db.execute(
      'SELECT * FROM ride_requests WHERE id = ? AND ride_id = ?',
      [request_id, id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ride request is not pending'
      });
    }

    // Update request status
    await db.execute(
      'UPDATE ride_requests SET status = "accepted" WHERE id = ?',
      [request_id]
    );

    // Decrease available seats
    await db.execute(
      'UPDATE rides SET available_seats = available_seats - 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Ride request accepted successfully'
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting request'
    });
  }
};

/**
 * @desc    Reject a ride request
 * @route   POST /api/rides/:id/reject
 * @access  Private (Driver)
 */
const rejectRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { request_id } = req.body;
    const userId = req.user.id;

    // Check if ride exists and belongs to user
    const [rides] = await db.execute(
      'SELECT * FROM rides WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (rides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or you do not have permission'
      });
    }

    // Check if request exists and belongs to this ride
    const [requests] = await db.execute(
      'SELECT * FROM ride_requests WHERE id = ? AND ride_id = ?',
      [request_id, id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    // Update request status
    await db.execute(
      'UPDATE ride_requests SET status = "rejected" WHERE id = ?',
      [request_id]
    );

    res.json({
      success: true,
      message: 'Ride request rejected successfully'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting request'
    });
  }
};

module.exports = {
  createRide,
  getMyRides,
  getActiveRides,
  getRideDetails,
  updateRide,
  deleteRide,
  searchRides,
  requestRide,
  acceptRequest,
  rejectRequest
};

