/**
 * Rider Search Matching Service
 * Checks saved rider searches when a new ride is created
 * Creates matches for riders who have saved searches matching the new ride
 */
const db = require('../config/database');
const { findMatchingRides } = require('./matchingService');

const MIN_MATCH_SCORE = 40; // Same threshold as regular search

/**
 * Check all active rider searches against a newly created ride
 * Creates rider_search_matches entries for matches
 * @param {number} rideId - The ID of the newly created ride
 */
const checkRiderSearchesForNewRide = async (rideId) => {
  try {
    console.log(`Checking rider searches for new ride ID: ${rideId}`);

    // Get the newly created ride with driver info
    const [rides] = await db.execute(
      `SELECT r.*, u.name as driver_name, u.rating as driver_rating
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       WHERE r.id = ? AND r.status = 'active'`,
      [rideId]
    );

    if (!rides || rides.length === 0) {
      console.log(`Ride ${rideId} not found or not active, skipping rider search check`);
      return;
    }

    const ride = rides[0];

    // Parse schedule_days
    let scheduleDays = [];
    if (ride.schedule_days) {
      if (typeof ride.schedule_days === 'string') {
        try {
          scheduleDays = JSON.parse(ride.schedule_days);
        } catch (e) {
          console.error('Error parsing schedule_days for ride:', e);
          scheduleDays = [];
        }
      } else {
        scheduleDays = ride.schedule_days;
      }
    }

    // Get all active rider searches
    const [riderSearches] = await db.execute(
      `SELECT * FROM rider_searches WHERE status = 'active'`
    );

    if (!riderSearches || riderSearches.length === 0) {
      console.log('No active rider searches to check');
      return;
    }

    console.log(`Found ${riderSearches.length} active rider searches to check`);

    // Prepare driver route for matching
    const driverRoute = {
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
        days: scheduleDays,
        time: ride.schedule_time
      },
      price: parseFloat(ride.price),
      available_seats: ride.available_seats
    };

    // Check each rider search
    for (const search of riderSearches) {
      try {
        // Parse search schedule_days
        let searchScheduleDays = [];
        if (search.schedule_days) {
          if (typeof search.schedule_days === 'string') {
            try {
              searchScheduleDays = JSON.parse(search.schedule_days);
            } catch (e) {
              console.error('Error parsing schedule_days for search:', e);
              continue; // Skip this search if we can't parse it
            }
          } else {
            searchScheduleDays = search.schedule_days;
          }
        }

        // Check if schedule days overlap
        const daysOverlap = searchScheduleDays.some(day => scheduleDays.includes(day));
        if (!daysOverlap) {
          console.log(`Search ${search.id}: No day overlap, skipping`);
          continue;
        }

        // Prepare passenger route for matching
        const passengerRoute = {
          pickupLocation: {
            latitude: parseFloat(search.pickup_latitude),
            longitude: parseFloat(search.pickup_longitude)
          },
          dropoffLocation: {
            latitude: parseFloat(search.dropoff_latitude),
            longitude: parseFloat(search.dropoff_longitude)
          },
          schedule: {
            days: searchScheduleDays,
            time: search.schedule_time
          }
        };

        // Use existing matching service
        const matches = await findMatchingRides(passengerRoute, [driverRoute]);

        if (matches && matches.length > 0) {
          const match = matches[0]; // Should only be one match since we're checking one driver route

          // Only create match if score meets threshold
          if (match.matchScore >= MIN_MATCH_SCORE) {
            // Check if match already exists (prevent duplicates)
            const [existingMatches] = await db.execute(
              `SELECT id FROM rider_search_matches 
               WHERE rider_search_id = ? AND ride_id = ?`,
              [search.id, rideId]
            );

            if (existingMatches && existingMatches.length > 0) {
              console.log(`Match already exists for search ${search.id} and ride ${rideId}`);
              continue;
            }

            // Create match entry
            await db.execute(
              `INSERT INTO rider_search_matches 
               (rider_search_id, ride_id, match_score, status) 
               VALUES (?, ?, ?, 'new')`,
              [search.id, rideId, match.matchScore]
            );

            console.log(`Created match for rider search ${search.id} and ride ${rideId} (score: ${match.matchScore})`);
          } else {
            console.log(`Search ${search.id}: Match score ${match.matchScore} below threshold ${MIN_MATCH_SCORE}`);
          }
        } else {
          console.log(`Search ${search.id}: No matches found`);
        }
      } catch (searchError) {
        console.error(`Error checking rider search ${search.id}:`, searchError);
        // Continue with next search
      }
    }

    console.log(`Finished checking rider searches for ride ${rideId}`);
  } catch (error) {
    console.error('Error in checkRiderSearchesForNewRide:', error);
    // Don't throw - we don't want to fail ride creation if matching fails
  }
};

module.exports = {
  checkRiderSearchesForNewRide
};

