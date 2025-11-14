/**
 * Route Matching Service
 * Implements algorithm to match passenger routes with driver routes
 * Uses real route calculation from Google Maps Directions API for accurate matching
 */
const routeService = require('./routeService');

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate distance from a point to a line segment
 */
const distanceToLineSegment = (point, lineStart, lineEnd) => {
  const A = point.latitude - lineStart.latitude;
  const B = point.longitude - lineStart.longitude;
  const C = lineEnd.latitude - lineStart.latitude;
  const D = lineEnd.longitude - lineStart.longitude;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.latitude;
    yy = lineStart.longitude;
  } else if (param > 1) {
    xx = lineEnd.latitude;
    yy = lineEnd.longitude;
  } else {
    xx = lineStart.latitude + param * C;
    yy = lineStart.longitude + param * D;
  }

  const dx = point.latitude - xx;
  const dy = point.longitude - yy;
  return Math.sqrt(dx * dx + dy * dy) * 111; // Convert to km (rough approximation)
};

/**
 * Check if a point is on/near a route
 */
const isPointOnRoute = (point, routeStart, routeEnd, threshold = 2) => {
  const distance = distanceToLineSegment(point, routeStart, routeEnd);
  return distance <= threshold;
};

/**
 * Check if time windows overlap
 */
const isTimeMatch = (time1, time2, window = 30) => {
  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  const minutes1 = parseTime(time1);
  const minutes2 = parseTime(time2);
  return Math.abs(minutes1 - minutes2) <= window;
};

/**
 * Check if days overlap
 */
const isDayMatch = (days1, days2) => {
  return days1.some((day) => days2.includes(day));
};

/**
 * Match passenger route with driver routes using real route calculation
 * Uses a hybrid approach: quick filtering first, then real route checks for accuracy
 */
const findMatchingRides = async (passengerRoute, driverRoutes) => {
  const matches = [];
  const USE_REAL_ROUTES = process.env.USE_REAL_ROUTES !== 'false'; // Default to true if not set

  // First pass: Quick filtering using simple distance (fast)
  // This filters out obviously bad matches before expensive API calls
  const quickFiltered = driverRoutes.filter((driverRoute) => {
    // Quick check: if pickup/dropoff are very far from driver route, skip
    const pickupDistance = calculateDistance(
      passengerRoute.pickupLocation.latitude,
      passengerRoute.pickupLocation.longitude,
      driverRoute.pickupLocation.latitude,
      driverRoute.pickupLocation.longitude
    );
    const dropoffDistance = calculateDistance(
      passengerRoute.dropoffLocation.latitude,
      passengerRoute.dropoffLocation.longitude,
      driverRoute.dropoffLocation.latitude,
      driverRoute.dropoffLocation.longitude
    );

    // If both points are more than 10km from driver route endpoints, likely not a match
    return pickupDistance < 10 || dropoffDistance < 10;
  });

  // Second pass: Use real route calculation for accurate matching
  for (const driverRoute of quickFiltered) {
    try {
      let matchScore = 0;
      const reasons = [];
      let pickupOnRoute = false;
      let dropoffOnRoute = false;
      let pickupDistance = Infinity;
      let dropoffDistance = Infinity;

      if (USE_REAL_ROUTES) {
        // Use real route calculation for accurate matching
        const pickupCheck = await routeService.isPointOnRoute(
          passengerRoute.pickupLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation,
          2 // 2km threshold
        );

        const dropoffCheck = await routeService.isPointOnRoute(
          passengerRoute.dropoffLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation,
          2
        );

        pickupOnRoute = pickupCheck.isOnRoute;
        dropoffOnRoute = dropoffCheck.isOnRoute;
        pickupDistance = pickupCheck.distance;
        dropoffDistance = dropoffCheck.distance;
      } else {
        // Fallback to simple calculation if real routes disabled
        pickupOnRoute = isPointOnRoute(
          passengerRoute.pickupLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation,
          2
        );
        dropoffOnRoute = isPointOnRoute(
          passengerRoute.dropoffLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation,
          2
        );
        pickupDistance = distanceToLineSegment(
          passengerRoute.pickupLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );
        dropoffDistance = distanceToLineSegment(
          passengerRoute.dropoffLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );
      }

      // Check time match
      const timeMatch = isTimeMatch(
        passengerRoute.schedule.time,
        driverRoute.schedule.time
      );

      // Check day match
      const dayMatch = isDayMatch(
        passengerRoute.schedule.days,
        driverRoute.schedule.days
      );

      // Calculate match score
      if (pickupOnRoute) {
        matchScore += 30;
        reasons.push('Pickup on route');
      } else if (pickupDistance < 5) {
        // Close but not exactly on route
        matchScore += 15;
        reasons.push(`Pickup near route (${pickupDistance.toFixed(1)}km)`);
      }

      if (dropoffOnRoute) {
        matchScore += 30;
        reasons.push('Dropoff on route');
      } else if (dropoffDistance < 5) {
        // Close but not exactly on route
        matchScore += 15;
        reasons.push(`Dropoff near route (${dropoffDistance.toFixed(1)}km)`);
      }

      if (timeMatch) {
        matchScore += 25;
        reasons.push('Time matches');
      }

      if (dayMatch) {
        matchScore += 15;
        reasons.push('Days match');
      }

      // Only include if there's a meaningful match
      if (matchScore >= 30) {
        matches.push({
          ...driverRoute,
          matchScore,
          reasons,
          pickupDistance: pickupDistance < Infinity ? pickupDistance : null,
          dropoffDistance: dropoffDistance < Infinity ? dropoffDistance : null,
        });
      }
    } catch (error) {
      console.error(`Error matching route for driver ${driverRoute.id}:`, error);
      // Continue with next route if one fails
      // Fallback to simple calculation
      try {
        const simplePickupOnRoute = isPointOnRoute(
          passengerRoute.pickupLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );
        const simpleDropoffOnRoute = isPointOnRoute(
          passengerRoute.dropoffLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );
        const timeMatch = isTimeMatch(
          passengerRoute.schedule.time,
          driverRoute.schedule.time
        );
        const dayMatch = isDayMatch(
          passengerRoute.schedule.days,
          driverRoute.schedule.days
        );

        let matchScore = 0;
        const reasons = [];
        if (simplePickupOnRoute) {
          matchScore += 30;
          reasons.push('Pickup on route (approx)');
        }
        if (simpleDropoffOnRoute) {
          matchScore += 30;
          reasons.push('Dropoff on route (approx)');
        }
        if (timeMatch) {
          matchScore += 25;
          reasons.push('Time matches');
        }
        if (dayMatch) {
          matchScore += 15;
          reasons.push('Days match');
        }

        if (matchScore >= 30) {
          matches.push({
            ...driverRoute,
            matchScore,
            reasons,
          });
        }
      } catch (fallbackError) {
        console.error('Fallback matching also failed:', fallbackError);
      }
    }
  }

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = {
  findMatchingRides,
  calculateDistance,
  isPointOnRoute,
  isTimeMatch,
  isDayMatch
};

