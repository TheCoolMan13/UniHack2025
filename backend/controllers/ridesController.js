const { validationResult } = require('express-validator');
const db = require('../config/database');
const { findMatchingRides } = require('../services/matchingService');
const { checkRiderSearchesForNewRide } = require('../services/riderSearchMatchingService');

/**
 * @desc    Create a new ride
 * @route   POST /api/rides
 * @access  Private (Driver)
 */
const createRide = async (req, res, next) => {
  try {
    console.log('Create ride request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
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

    console.log('Inserting ride with data:', {
      driver_id: req.user.id,
      pickup_latitude,
      pickup_longitude,
      dropoff_latitude,
      dropoff_longitude,
      schedule_days: JSON.stringify(schedule_days),
      schedule_time,
      price,
      available_seats
    });

    const [result] = await db.execute(
      `INSERT INTO rides (
        driver_id, pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        schedule_days, schedule_time, price, available_seats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        parseInt(available_seats)
      ]
    );

    console.log('Ride inserted with ID:', result.insertId);

    // Get created ride with driver info
    const [rides] = await db.execute(
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating, u.avatar_url as driver_avatar_url
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    if (!rides || rides.length === 0) {
      throw new Error('Failed to retrieve created ride');
    }

    const ride = rides[0];
    // MySQL JSON columns are already parsed, but sometimes they're strings
    if (ride.schedule_days) {
      if (typeof ride.schedule_days === 'string') {
        try {
          ride.schedule_days = JSON.parse(ride.schedule_days);
        } catch (e) {
          ride.schedule_days = [];
        }
      }
    } else {
      ride.schedule_days = [];
    }
    ride.pickup_latitude = parseFloat(ride.pickup_latitude);
    ride.pickup_longitude = parseFloat(ride.pickup_longitude);
    ride.dropoff_latitude = parseFloat(ride.dropoff_latitude);
    ride.dropoff_longitude = parseFloat(ride.dropoff_longitude);
    ride.price = parseFloat(ride.price);

    console.log('Ride created successfully:', ride.id);

    // Check saved rider searches for matches (async, don't wait)
    checkRiderSearchesForNewRide(ride.id).catch(err => {
      console.error('Error checking rider searches for new ride:', err);
      // Don't fail the request if this fails
    });

    return res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: { ride }
    });
  } catch (error) {
    console.error('='.repeat(60));
    console.error('CREATE RIDE ERROR');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    console.error('='.repeat(60));
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error?.message || 'Server error creating ride',
        error: error?.message,
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: error?.stack,
          code: error?.code 
        })
      });
    } else {
      next(error);
    }
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
      
      // For each ride, get pending and accepted requests with passenger details
      for (let ride of rides) {
        // Get pending requests
        const [pendingRequests] = await db.execute(
          `SELECT rr.*, 
           u.name as passenger_name, 
           u.rating as passenger_rating,
           u.phone as passenger_phone,
           u.email as passenger_email
           FROM ride_requests rr
           JOIN users u ON rr.passenger_id = u.id
           WHERE rr.ride_id = ? AND rr.status = 'pending'
           ORDER BY rr.created_at DESC`,
          [ride.id]
        );
        // Parse coordinates for pending requests
        ride.pending_requests = pendingRequests.map(req => ({
          ...req,
          pickup_latitude: parseFloat(req.pickup_latitude),
          pickup_longitude: parseFloat(req.pickup_longitude),
          dropoff_latitude: parseFloat(req.dropoff_latitude),
          dropoff_longitude: parseFloat(req.dropoff_longitude),
        }));
        
        // Get accepted requests
        const [acceptedRequests] = await db.execute(
          `SELECT rr.*, 
           u.name as passenger_name, 
           u.rating as passenger_rating,
           u.phone as passenger_phone,
           u.email as passenger_email
           FROM ride_requests rr
           JOIN users u ON rr.passenger_id = u.id
           WHERE rr.ride_id = ? AND rr.status = 'accepted'
           ORDER BY rr.created_at DESC`,
          [ride.id]
        );
        // Parse coordinates for accepted requests
        ride.accepted_requests = acceptedRequests.map(req => ({
          ...req,
          pickup_latitude: parseFloat(req.pickup_latitude),
          pickup_longitude: parseFloat(req.pickup_longitude),
          dropoff_latitude: parseFloat(req.dropoff_latitude),
          dropoff_longitude: parseFloat(req.dropoff_longitude),
        }));
      }
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

    // Parse JSON fields (MySQL JSON columns are already parsed, but sometimes they're strings)
    rides.forEach(ride => {
      if (ride.schedule_days) {
        if (typeof ride.schedule_days === 'string') {
          try {
            ride.schedule_days = JSON.parse(ride.schedule_days);
          } catch (e) {
            ride.schedule_days = [];
          }
        }
      } else {
        ride.schedule_days = [];
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
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating, u.phone as driver_phone, u.avatar_url as driver_avatar_url
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
    // MySQL JSON columns are already parsed, but sometimes they're strings
    if (ride.schedule_days) {
      if (typeof ride.schedule_days === 'string') {
        try {
          ride.schedule_days = JSON.parse(ride.schedule_days);
        } catch (e) {
          ride.schedule_days = [];
        }
      }
    } else {
      ride.schedule_days = [];
    }

    // Get ride requests if user is the driver
    if (ride.driver_id === req.user.id) {
      const [requests] = await db.execute(
        `SELECT rr.*, 
         u.name as passenger_name, 
         u.rating as passenger_rating,
         u.phone as passenger_phone,
         u.email as passenger_email,
         u.avatar_url as passenger_avatar_url
         FROM ride_requests rr
         JOIN users u ON rr.passenger_id = u.id
         WHERE rr.ride_id = ?
         ORDER BY 
           CASE rr.status
             WHEN 'pending' THEN 1
             WHEN 'accepted' THEN 2
             WHEN 'rejected' THEN 3
             WHEN 'cancelled' THEN 4
           END,
           rr.created_at DESC`,
        [id]
      );
      ride.requests = requests;
      // Separate pending requests for easier access
      ride.pending_requests = requests.filter(r => r.status === 'pending');
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
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating, u.avatar_url as driver_avatar_url
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
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating, u.avatar_url as driver_avatar_url
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       WHERE r.status = 'active' AND r.available_seats > 0
       ORDER BY r.created_at DESC`
    );

    // Parse schedule_days for each ride
    const rides = allRides.map(ride => ({
      ...ride,
      schedule_days: typeof ride.schedule_days === 'string' ? JSON.parse(ride.schedule_days) : ride.schedule_days,
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
const searchRides = async (req, res, next) => {
  try {
    // Log incoming request for debugging
    console.log('Search rides request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
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

    // Log parsed values
    console.log('Parsed search params:', {
      pickup_latitude,
      pickup_longitude,
      dropoff_latitude,
      dropoff_longitude,
      schedule_days,
      schedule_time
    });

    // Get all active rides
    let allRides;
    try {
      [allRides] = await db.execute(
        `SELECT r.*, u.name as driver_name, u.rating as driver_rating, u.avatar_url as driver_avatar_url
         FROM rides r
         JOIN users u ON r.driver_id = u.id
         WHERE r.status = 'active' AND r.available_seats > 0`
      );
      console.log('Database query successful. Found', allRides?.length || 0, 'rides');
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // If no rides found, return empty results (this is OK, not an error)
    if (!allRides || allRides.length === 0) {
      console.log('No active rides found in database - returning empty matches');
      return res.json({
        success: true,
        data: {
          matches: [],
          count: 0
        }
      });
    }

    // Parse schedule_days for each ride (MySQL JSON columns are already parsed)
    const ridesWithParsedDays = allRides.map(ride => {
      try {
        let scheduleDays = [];
        if (ride.schedule_days) {
          if (typeof ride.schedule_days === 'string') {
            scheduleDays = JSON.parse(ride.schedule_days);
          } else {
            scheduleDays = ride.schedule_days; // Already an object/array
          }
        }
        return {
          ...ride,
          schedule_days: scheduleDays
        };
      } catch (parseError) {
        console.error(`Error parsing schedule_days for ride ${ride.id}:`, parseError);
        return {
          ...ride,
          schedule_days: []
        };
      }
    });

    // Validate required fields
    if (!pickup_latitude || !pickup_longitude || !dropoff_latitude || !dropoff_longitude) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff coordinates are required'
      });
    }

    // Use matching service to find matches
    const passengerRoute = {
      pickupLocation: { latitude: pickup_latitude, longitude: pickup_longitude },
      dropoffLocation: { latitude: dropoff_latitude, longitude: dropoff_longitude },
      schedule: { days: schedule_days || [], time: schedule_time || '' }
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
      available_seats: ride.available_seats,
      // Include address fields for frontend compatibility
      pickup_address: ride.pickup_address,
      dropoff_address: ride.dropoff_address,
      schedule_time: ride.schedule_time,
      schedule_days: ride.schedule_days
    }));

    console.log('Calling enhanced findMatchingRides with', driverRoutes.length, 'driver routes');
    
    let matches;
    try {
      matches = await findMatchingRides(passengerRoute, driverRoutes);
      console.log('Enhanced matching completed. Found', matches.length, 'matches');
      
      // Enhance matches with address fields and ensure all frontend-required fields are present
      const enhancedMatches = matches.map(match => {
        // Find original ride data to get addresses
        const originalRide = ridesWithParsedDays.find(r => r.id === match.id);
        
        // Get driver's time (from match or original ride)
        const driverTime = match.driverTime || match.schedule?.time || originalRide?.schedule_time || '';
        
        return {
          ...match,
          // Ensure address fields are present for frontend
          pickup_address: match.pickup_address || originalRide?.pickup_address || 'N/A',
          dropoff_address: match.dropoff_address || originalRide?.dropoff_address || 'N/A',
          schedule_time: driverTime, // Use driver's time
          driverTime: driverTime, // Explicitly set driverTime for frontend
          schedule_days: match.schedule?.days || originalRide?.schedule_days || [],
          // Enhanced recommendation data (already included from matchingService)
          // matchScore, reasons, recommendedRoute, detourDistance, timeDifference, etc. are already in match
        };
      });
      
      matches = enhancedMatches;
      
      // Filter to only return the best matches
      // 1. Only matches with score >= 50 (quality threshold)
      // 2. Show at least 3 best matches if available, up to 10 max
      const MIN_MATCH_SCORE = 50; // Minimum quality score threshold
      const MIN_RESULTS = 3; // Always show at least 3 matches if available
      const MAX_RESULTS = 10; // Maximum number of results
      
      // Log all matches before filtering for debugging
      console.log(`Found ${matches.length} total matches before filtering:`);
      matches.forEach((match, idx) => {
        console.log(`  Match ${idx + 1}: Score=${match.matchScore}, Reasons=[${match.reasons?.join(', ') || 'N/A'}]`);
      });
      
      // Sort by score (highest first) before filtering
      matches.sort((a, b) => b.matchScore - a.matchScore);
      
      // First, get matches that meet the minimum score
      const qualifiedMatches = matches.filter(match => match.matchScore >= MIN_MATCH_SCORE);
      
      // If we have fewer than MIN_RESULTS qualified matches, also include lower-scored matches
      // to ensure we show at least MIN_RESULTS (if available)
      let bestMatches;
      if (qualifiedMatches.length >= MIN_RESULTS) {
        // We have enough qualified matches, just take top MAX_RESULTS
        bestMatches = qualifiedMatches.slice(0, MAX_RESULTS);
      } else {
        // Not enough qualified matches, include lower-scored ones to reach MIN_RESULTS
        // But still prioritize higher scores
        bestMatches = matches.slice(0, Math.max(MIN_RESULTS, qualifiedMatches.length)).slice(0, MAX_RESULTS);
        console.log(`  Note: Including ${bestMatches.length - qualifiedMatches.length} lower-scored matches to reach minimum of ${MIN_RESULTS}`);
      }
      
      matches = bestMatches;
      
      console.log(`Filtered to ${matches.length} best matches (min score: ${MIN_MATCH_SCORE}, showing at least ${MIN_RESULTS}, max ${MAX_RESULTS})`);
    } catch (matchingError) {
      console.error('Error in findMatchingRides:', matchingError);
      console.error('Matching error message:', matchingError?.message);
      console.error('Matching error stack:', matchingError?.stack);
      // If matching fails, return empty results instead of crashing
      matches = [];
    }

    res.json({
      success: true,
      data: {
        matches: matches || [],
        count: matches ? matches.length : 0
      }
    });
  } catch (error) {
    // Log everything about the error
    console.error('='.repeat(60));
    console.error('SEARCH RIDES ERROR CAUGHT');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('='.repeat(60));
    
    if (!res.headersSent) {
      const errorMessage = error?.message || 'Server error searching rides';
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack })
      });
    } else {
      next(error);
    }
  }
};

/**
 * @desc    Request a ride
 * @route   POST /api/rides/:id/request
 * @access  Private
 */
const requestRide = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Request ride validation errors:', errors.array());
      console.error('Request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

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

    // Validate that passenger locations are provided
    if (!pickup_latitude || !pickup_longitude || !pickup_address ||
        !dropoff_latitude || !dropoff_longitude || !dropoff_address) {
      return res.status(400).json({
        success: false,
        message: 'Passenger pickup and dropoff locations are required'
      });
    }

    // Create ride request with passenger's locations (not driver's)
    const [result] = await db.execute(
      `INSERT INTO ride_requests (
        ride_id, passenger_id,
        pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        parseFloat(pickup_latitude),
        parseFloat(pickup_longitude),
        pickup_address,
        parseFloat(dropoff_latitude),
        parseFloat(dropoff_longitude),
        dropoff_address
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
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Server error creating ride request'
      });
    } else {
      next(error);
    }
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
      console.error('Accept request validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { request_id } = req.body;
    const userId = req.user.id;
    
    // Ensure request_id is an integer
    const requestIdInt = parseInt(request_id, 10);
    if (isNaN(requestIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Request ID must be a valid integer'
      });
    }

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
      [requestIdInt]
    );

    // Decrease available seats
    await db.execute(
      'UPDATE rides SET available_seats = available_seats - 1 WHERE id = ?',
      [id]
    );

    // Get updated request with passenger info for response
    const [updatedRequests] = await db.execute(
      `SELECT rr.*, 
       u.name as passenger_name, 
       u.rating as passenger_rating,
       u.phone as passenger_phone,
       u.email as passenger_email
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE rr.id = ?`,
      [requestIdInt]
    );

    res.json({
      success: true,
      message: 'Ride request accepted successfully',
      data: { request: updatedRequests[0] }
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
      console.error('Reject request validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { request_id } = req.body;
    const userId = req.user.id;
    
    // Ensure request_id is an integer
    const requestIdInt = parseInt(request_id, 10);
    if (isNaN(requestIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Request ID must be a valid integer'
      });
    }

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
      [requestIdInt, id]
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
      [requestIdInt]
    );

    // Get updated request with passenger info for response
    const [updatedRequests] = await db.execute(
      `SELECT rr.*, 
       u.name as passenger_name, 
       u.rating as passenger_rating,
       u.phone as passenger_phone,
       u.email as passenger_email
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE rr.id = ?`,
      [requestIdInt]
    );

    res.json({
      success: true,
      message: 'Ride request rejected successfully',
      data: { request: updatedRequests[0] }
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting request'
    });
  }
};

/**
 * @desc    Cancel an accepted ride request
 * @route   POST /api/rides/:id/cancel
 * @access  Private (Driver)
 */
const cancelRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Cancel request validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { request_id } = req.body;
    const userId = req.user.id;
    
    // Ensure request_id is an integer
    const requestIdInt = parseInt(request_id, 10);
    if (isNaN(requestIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Request ID must be a valid integer'
      });
    }

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
      [requestIdInt, id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    const request = requests[0];

    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel accepted ride requests'
      });
    }

    // Update request status to cancelled
    await db.execute(
      'UPDATE ride_requests SET status = "cancelled" WHERE id = ?',
      [requestIdInt]
    );

    // Increase available seats back
    await db.execute(
      'UPDATE rides SET available_seats = available_seats + 1 WHERE id = ?',
      [id]
    );

    // Get updated request with passenger info for response
    const [updatedRequests] = await db.execute(
      `SELECT rr.*, 
       u.name as passenger_name, 
       u.rating as passenger_rating,
       u.phone as passenger_phone,
       u.email as passenger_email
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE rr.id = ?`,
      [requestIdInt]
    );

    res.json({
      success: true,
      message: 'Ride request cancelled successfully',
      data: { request: updatedRequests[0] }
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling request'
    });
  }
};

/**
 * @desc    Cancel a pending ride request (Passenger)
 * @route   POST /api/rides/requests/:requestId/cancel
 * @access  Private
 */
const cancelMyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    console.log('cancelMyRequest called with requestId:', requestId, 'userId:', userId);
    
    const requestIdInt = parseInt(requestId, 10);
    if (isNaN(requestIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Request ID must be a valid integer'
      });
    }

    // Check if request exists and belongs to user
    const [requests] = await db.execute(
      'SELECT * FROM ride_requests WHERE id = ? AND passenger_id = ?',
      [requestIdInt, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found or you do not have permission'
      });
    }

    const request = requests[0];

    // Only allow cancelling pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending ride requests'
      });
    }

    // Update request status to cancelled
    await db.execute(
      'UPDATE ride_requests SET status = "cancelled" WHERE id = ?',
      [requestIdInt]
    );

    res.json({
      success: true,
      message: 'Ride request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel my request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling request'
    });
  }
};

/**
 * @desc    Delete a cancelled/rejected ride request (Passenger)
 * @route   DELETE /api/rides/requests/:requestId
 * @access  Private
 */
const deleteMyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    console.log('deleteMyRequest called with requestId:', requestId, 'userId:', userId);
    
    const requestIdInt = parseInt(requestId, 10);
    if (isNaN(requestIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Request ID must be a valid integer'
      });
    }

    // Check if request exists and belongs to user
    const [requests] = await db.execute(
      'SELECT * FROM ride_requests WHERE id = ? AND passenger_id = ?',
      [requestIdInt, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found or you do not have permission'
      });
    }

    const request = requests[0];

    // Only allow deleting cancelled or rejected requests
    if (request.status !== 'cancelled' && request.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete cancelled or rejected ride requests'
      });
    }

    // Delete the request
    await db.execute(
      'DELETE FROM ride_requests WHERE id = ?',
      [requestIdInt]
    );

    res.json({
      success: true,
      message: 'Ride request deleted successfully'
    });
  } catch (error) {
    console.error('Delete my request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting request'
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
  rejectRequest,
  cancelRequest,
  cancelMyRequest,
  deleteMyRequest
};

