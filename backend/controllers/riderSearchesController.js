const { validationResult } = require('express-validator');
const db = require('../config/database');

/**
 * @desc    Save a rider search for future matching
 * @route   POST /api/rider-searches
 * @access  Private
 */
const saveRiderSearch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      console.error('Request body:', JSON.stringify(req.body, null, 2));
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
      schedule_time
    } = req.body;

    // Check if user already has an active search with same criteria
    const [existingSearches] = await db.execute(
      `SELECT id FROM rider_searches 
       WHERE passenger_id = ? 
       AND status = 'active'
       AND ABS(pickup_latitude - ?) < 0.0001
       AND ABS(pickup_longitude - ?) < 0.0001
       AND ABS(dropoff_latitude - ?) < 0.0001
       AND ABS(dropoff_longitude - ?) < 0.0001
       AND schedule_time = ?`,
      [
        req.user.id,
        parseFloat(pickup_latitude),
        parseFloat(pickup_longitude),
        parseFloat(dropoff_latitude),
        parseFloat(dropoff_longitude),
        schedule_time
      ]
    );

    if (existingSearches && existingSearches.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active search with the same criteria'
      });
    }

    // Insert new search
    const [result] = await db.execute(
      `INSERT INTO rider_searches (
        passenger_id, pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        schedule_days, schedule_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        req.user.id,
        parseFloat(pickup_latitude),
        parseFloat(pickup_longitude),
        pickup_address,
        parseFloat(dropoff_latitude),
        parseFloat(dropoff_longitude),
        dropoff_address,
        JSON.stringify(schedule_days),
        schedule_time
      ]
    );

    // Get created search
    const [searches] = await db.execute(
      `SELECT * FROM rider_searches WHERE id = ?`,
      [result.insertId]
    );

    const search = searches[0];
    if (search.schedule_days && typeof search.schedule_days === 'string') {
      try {
        search.schedule_days = JSON.parse(search.schedule_days);
      } catch (e) {
        search.schedule_days = [];
      }
    }

    res.status(201).json({
      success: true,
      message: 'Search saved successfully',
      data: { search }
    });
  } catch (error) {
    console.error('Save rider search error:', error);
    next(error);
  }
};

/**
 * @desc    Get user's saved searches
 * @route   GET /api/rider-searches
 * @access  Private
 */
const getMySavedSearches = async (req, res, next) => {
  try {
    const [searches] = await db.execute(
      `SELECT * FROM rider_searches 
       WHERE passenger_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Parse schedule_days for each search
    const parsedSearches = searches.map(search => {
      if (search.schedule_days && typeof search.schedule_days === 'string') {
        try {
          search.schedule_days = JSON.parse(search.schedule_days);
        } catch (e) {
          search.schedule_days = [];
        }
      }
      return search;
    });

    // Get match counts for each search
    const searchesWithMatches = await Promise.all(
      parsedSearches.map(async (search) => {
        const [matchCounts] = await db.execute(
          `SELECT 
            COUNT(CASE WHEN status = 'new' THEN 1 END) as new_matches,
            COUNT(*) as total_matches
           FROM rider_search_matches 
           WHERE rider_search_id = ?`,
          [search.id]
        );

        return {
          ...search,
          new_matches: matchCounts[0]?.new_matches || 0,
          total_matches: matchCounts[0]?.total_matches || 0
        };
      })
    );

    res.json({
      success: true,
      data: { searches: searchesWithMatches }
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    next(error);
  }
};

/**
 * @desc    Cancel a saved search
 * @route   DELETE /api/rider-searches/:id
 * @access  Private
 */
const cancelSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify search belongs to user
    const [searches] = await db.execute(
      `SELECT * FROM rider_searches WHERE id = ? AND passenger_id = ?`,
      [id, req.user.id]
    );

    if (!searches || searches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    // Update status to cancelled
    await db.execute(
      `UPDATE rider_searches SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Search cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel saved search error:', error);
    next(error);
  }
};

/**
 * @desc    Get new matches for saved searches
 * @route   GET /api/rider-searches/matches/new
 * @access  Private
 */
const getNewMatches = async (req, res, next) => {
  try {
    // Get all new matches for user's active searches
    const [matches] = await db.execute(
      `SELECT 
        rsm.id as match_id,
        rsm.match_score,
        rsm.status,
        rsm.created_at as match_created_at,
        rs.id as search_id,
        rs.pickup_latitude as search_pickup_latitude,
        rs.pickup_longitude as search_pickup_longitude,
        rs.pickup_address as search_pickup,
        rs.dropoff_latitude as search_dropoff_latitude,
        rs.dropoff_longitude as search_dropoff_longitude,
        rs.dropoff_address as search_dropoff,
        r.id as ride_id,
        r.pickup_latitude,
        r.pickup_longitude,
        r.pickup_address,
        r.dropoff_latitude,
        r.dropoff_longitude,
        r.dropoff_address,
        r.schedule_days,
        r.schedule_time,
        r.price,
        r.available_seats,
        u.name as driver_name,
        u.rating as driver_rating
       FROM rider_search_matches rsm
       JOIN rider_searches rs ON rsm.rider_search_id = rs.id
       JOIN rides r ON rsm.ride_id = r.id
       JOIN users u ON r.driver_id = u.id
       WHERE rs.passenger_id = ? 
       AND rs.status = 'active'
       AND rsm.status = 'new'
       AND r.status = 'active'
       ORDER BY rsm.match_score DESC, rsm.created_at DESC`,
      [req.user.id]
    );

    // Parse schedule_days for each match
    const parsedMatches = matches.map(match => {
      if (match.schedule_days && typeof match.schedule_days === 'string') {
        try {
          match.schedule_days = JSON.parse(match.schedule_days);
        } catch (e) {
          match.schedule_days = [];
        }
      }
      match.pickup_latitude = parseFloat(match.pickup_latitude);
      match.pickup_longitude = parseFloat(match.pickup_longitude);
      match.dropoff_latitude = parseFloat(match.dropoff_latitude);
      match.dropoff_longitude = parseFloat(match.dropoff_longitude);
      match.price = parseFloat(match.price);
      // Parse passenger search coordinates
      match.search_pickup_latitude = parseFloat(match.search_pickup_latitude);
      match.search_pickup_longitude = parseFloat(match.search_pickup_longitude);
      match.search_dropoff_latitude = parseFloat(match.search_dropoff_latitude);
      match.search_dropoff_longitude = parseFloat(match.search_dropoff_longitude);
      return match;
    });

    res.json({
      success: true,
      data: { matches: parsedMatches }
    });
  } catch (error) {
    console.error('Get new matches error:', error);
    next(error);
  }
};

/**
 * @desc    Mark a match as viewed
 * @route   PUT /api/rider-searches/matches/:id/viewed
 * @access  Private
 */
const markMatchViewed = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify match belongs to user
    const [matches] = await db.execute(
      `SELECT rsm.* FROM rider_search_matches rsm
       JOIN rider_searches rs ON rsm.rider_search_id = rs.id
       WHERE rsm.id = ? AND rs.passenger_id = ?`,
      [id, req.user.id]
    );

    if (!matches || matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Update status to viewed
    await db.execute(
      `UPDATE rider_search_matches SET status = 'viewed' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Match marked as viewed'
    });
  } catch (error) {
    console.error('Mark match viewed error:', error);
    next(error);
  }
};

/**
 * @desc    Dismiss a match
 * @route   PUT /api/rider-searches/matches/:id/dismiss
 * @access  Private
 */
const dismissMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify match belongs to user
    const [matches] = await db.execute(
      `SELECT rsm.* FROM rider_search_matches rsm
       JOIN rider_searches rs ON rsm.rider_search_id = rs.id
       WHERE rsm.id = ? AND rs.passenger_id = ?`,
      [id, req.user.id]
    );

    if (!matches || matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Update status to dismissed
    await db.execute(
      `UPDATE rider_search_matches SET status = 'dismissed' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Match dismissed'
    });
  } catch (error) {
    console.error('Dismiss match error:', error);
    next(error);
  }
};

module.exports = {
  saveRiderSearch,
  getMySavedSearches,
  cancelSavedSearch,
  getNewMatches,
  markMatchViewed,
  dismissMatch
};

