const { validationResult } = require('express-validator');
const db = require('../config/database');
const { findMatchingRides } = require('../services/matchingService');

/**
 * @desc    Create a driver request (looking for riders)
 * @route   POST /api/driver-requests
 * @access  Private (Driver)
 */
const createDriverRequest = async (req, res, next) => {
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
      available_seats,
      notes
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO driver_requests (
        driver_id, pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        schedule_days, schedule_time, price, available_seats, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        parseFloat(pickup_latitude),
        parseFloat(pickup_longitude),
        pickup_address,
        parseFloat(dropoff_latitude),
        parseFloat(dropoff_longitude),
        dropoff_address,
        JSON.stringify(schedule_days),
        schedule_time,
        parseFloat(price),
        parseInt(available_seats),
        notes || null
      ]
    );

    // Get created request with driver info
    const [requests] = await db.execute(
      `SELECT dr.*, u.name as driver_name, u.rating as driver_rating
       FROM driver_requests dr
       JOIN users u ON dr.driver_id = u.id
       WHERE dr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Driver request created successfully',
      data: { request: requests[0] }
    });
  } catch (error) {
    console.error('Create driver request error:', error);
    next(error);
  }
};

/**
 * @desc    Get driver's requests
 * @route   GET /api/driver-requests
 * @access  Private (Driver)
 */
const getMyDriverRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await db.execute(
      `SELECT dr.*, u.name as driver_name, u.rating as driver_rating,
       COUNT(drr.id) as response_count
       FROM driver_requests dr
       JOIN users u ON dr.driver_id = u.id
       LEFT JOIN driver_request_responses drr ON dr.id = drr.driver_request_id AND drr.status = 'pending'
       WHERE dr.driver_id = ?
       GROUP BY dr.id
       ORDER BY dr.created_at DESC`,
      [userId]
    );

    // Get responses for each request
    for (let request of requests) {
      const [responses] = await db.execute(
        `SELECT drr.*, 
         u.name as passenger_name, 
         u.rating as passenger_rating,
         u.phone as passenger_phone,
         u.email as passenger_email
         FROM driver_request_responses drr
         JOIN users u ON drr.passenger_id = u.id
         WHERE drr.driver_request_id = ?
         ORDER BY drr.created_at DESC`,
        [request.id]
      );
      request.responses = responses;
      request.pending_responses = responses.filter(r => r.status === 'pending');
      request.accepted_responses = responses.filter(r => r.status === 'accepted');
    }

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Get my driver requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching driver requests'
    });
  }
};

/**
 * @desc    Search for driver requests (for passengers)
 * @route   POST /api/driver-requests/search
 * @access  Private
 */
const searchDriverRequests = async (req, res, next) => {
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

    // Get all active driver requests
    const [allRequests] = await db.execute(
      `SELECT dr.*, u.name as driver_name, u.rating as driver_rating
       FROM driver_requests dr
       JOIN users u ON dr.driver_id = u.id
       WHERE dr.status = 'active'`,
      []
    );

    if (allRequests.length === 0) {
      return res.json({
        success: true,
        data: { matches: [] }
      });
    }

    // Use matching service to find compatible requests
    const passengerRoute = {
      pickupLocation: {
        latitude: parseFloat(pickup_latitude),
        longitude: parseFloat(pickup_longitude)
      },
      dropoffLocation: {
        latitude: parseFloat(dropoff_latitude),
        longitude: parseFloat(dropoff_longitude)
      },
      scheduleDays: Array.isArray(schedule_days) ? schedule_days : JSON.parse(schedule_days),
      scheduleTime: schedule_time
    };

    const driverRoutes = allRequests.map(req => ({
      id: req.id,
      pickupLocation: {
        latitude: parseFloat(req.pickup_latitude),
        longitude: parseFloat(req.pickup_longitude)
      },
      dropoffLocation: {
        latitude: parseFloat(req.dropoff_latitude),
        longitude: parseFloat(req.dropoff_longitude)
      },
      scheduleDays: Array.isArray(req.schedule_days) ? req.schedule_days : JSON.parse(req.schedule_days),
      scheduleTime: req.schedule_time,
      availableSeats: req.available_seats,
      price: req.price,
      driver_name: req.driver_name,
      driver_rating: req.driver_rating
    }));

    const matches = await findMatchingRides(passengerRoute, driverRoutes);

    // Filter and format results
    const MIN_MATCH_SCORE = 40;
    const MAX_RESULTS = 10;
    const MIN_RESULTS = 3;

    let filteredMatches = matches
      .filter(match => match.matchScore >= MIN_MATCH_SCORE)
      .slice(0, MAX_RESULTS);

    // Ensure at least MIN_RESULTS if available
    if (filteredMatches.length < MIN_RESULTS && matches.length > 0) {
      filteredMatches = matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, MIN_RESULTS);
    }

    res.json({
      success: true,
      data: { matches: filteredMatches }
    });
  } catch (error) {
    console.error('Search driver requests error:', error);
    next(error);
  }
};

/**
 * @desc    Respond to a driver request (passenger)
 * @route   POST /api/driver-requests/:id/respond
 * @access  Private
 */
const respondToDriverRequest = async (req, res) => {
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
    const userId = req.user.id;

    // Check if driver request exists
    const [requests] = await db.execute('SELECT * FROM driver_requests WHERE id = ?', [id]);
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver request not found'
      });
    }

    const driverRequest = requests[0];

    // Check if user is trying to respond to their own request
    if (driverRequest.driver_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot respond to your own request'
      });
    }

    // Check if request is active
    if (driverRequest.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This driver request is no longer active'
      });
    }

    // Check if user already has a pending response
    const [existingResponses] = await db.execute(
      'SELECT * FROM driver_request_responses WHERE driver_request_id = ? AND passenger_id = ? AND status = "pending"',
      [id, userId]
    );

    if (existingResponses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending response for this request'
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

    // Create response
    const [result] = await db.execute(
      `INSERT INTO driver_request_responses (
        driver_request_id, passenger_id,
        pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        pickup_latitude ? parseFloat(pickup_latitude) : null,
        pickup_longitude ? parseFloat(pickup_longitude) : null,
        pickup_address || null,
        dropoff_latitude ? parseFloat(dropoff_latitude) : null,
        dropoff_longitude ? parseFloat(dropoff_longitude) : null,
        dropoff_address || null
      ]
    );

    // Get created response with passenger info
    const [responses] = await db.execute(
      `SELECT drr.*, 
       u.name as passenger_name, 
       u.rating as passenger_rating,
       u.phone as passenger_phone,
       u.email as passenger_email
       FROM driver_request_responses drr
       JOIN users u ON drr.passenger_id = u.id
       WHERE drr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Response sent successfully',
      data: { response: responses[0] }
    });
  } catch (error) {
    console.error('Respond to driver request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error responding to driver request'
    });
  }
};

/**
 * @desc    Accept a response to driver request
 * @route   POST /api/driver-requests/:id/accept-response
 * @access  Private (Driver)
 */
const acceptResponse = async (req, res) => {
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
    const { response_id } = req.body;
    const userId = req.user.id;

    // Check if driver request exists and belongs to user
    const [requests] = await db.execute(
      'SELECT * FROM driver_requests WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver request not found or you do not have permission'
      });
    }

    const responseIdInt = parseInt(response_id, 10);
    if (isNaN(responseIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Response ID must be a valid integer'
      });
    }

    // Check if response exists
    const [responses] = await db.execute(
      'SELECT * FROM driver_request_responses WHERE id = ? AND driver_request_id = ?',
      [responseIdInt, id]
    );

    if (responses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    const response = responses[0];

    if (response.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Response is not pending'
      });
    }

    // Update response status
    await db.execute(
      'UPDATE driver_request_responses SET status = "accepted" WHERE id = ?',
      [responseIdInt]
    );

    // Decrease available seats
    await db.execute(
      'UPDATE driver_requests SET available_seats = available_seats - 1 WHERE id = ?',
      [id]
    );

    // If all seats filled, mark request as fulfilled
    const [updatedRequest] = await db.execute(
      'SELECT * FROM driver_requests WHERE id = ?',
      [id]
    );
    if (updatedRequest[0].available_seats <= 0) {
      await db.execute(
        'UPDATE driver_requests SET status = "fulfilled" WHERE id = ?',
        [id]
      );
    }

    // Get updated response
    const [updatedResponses] = await db.execute(
      `SELECT drr.*, 
       u.name as passenger_name, 
       u.rating as passenger_rating,
       u.phone as passenger_phone,
       u.email as passenger_email
       FROM driver_request_responses drr
       JOIN users u ON drr.passenger_id = u.id
       WHERE drr.id = ?`,
      [responseIdInt]
    );

    res.json({
      success: true,
      message: 'Response accepted successfully',
      data: { response: updatedResponses[0] }
    });
  } catch (error) {
    console.error('Accept response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting response'
    });
  }
};

/**
 * @desc    Reject a response to driver request
 * @route   POST /api/driver-requests/:id/reject-response
 * @access  Private (Driver)
 */
const rejectResponse = async (req, res) => {
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
    const { response_id } = req.body;
    const userId = req.user.id;

    // Check if driver request exists and belongs to user
    const [requests] = await db.execute(
      'SELECT * FROM driver_requests WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver request not found or you do not have permission'
      });
    }

    const responseIdInt = parseInt(response_id, 10);
    if (isNaN(responseIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Response ID must be a valid integer'
      });
    }

    // Update response status
    await db.execute(
      'UPDATE driver_request_responses SET status = "rejected" WHERE id = ?',
      [responseIdInt]
    );

    res.json({
      success: true,
      message: 'Response rejected successfully'
    });
  } catch (error) {
    console.error('Reject response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting response'
    });
  }
};

/**
 * @desc    Cancel a driver request
 * @route   DELETE /api/driver-requests/:id
 * @access  Private (Driver)
 */
const cancelDriverRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if request exists and belongs to user
    const [requests] = await db.execute(
      'SELECT * FROM driver_requests WHERE id = ? AND driver_id = ?',
      [id, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver request not found or you do not have permission'
      });
    }

    // Update status to cancelled
    await db.execute(
      'UPDATE driver_requests SET status = "cancelled" WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Driver request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel driver request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling driver request'
    });
  }
};

module.exports = {
  createDriverRequest,
  getMyDriverRequests,
  searchDriverRequests,
  respondToDriverRequest,
  acceptResponse,
  rejectResponse,
  cancelDriverRequest
};

