/**
 * Route Matching Service
 * Implements algorithm to match passenger routes with driver routes
 * (Same logic as frontend, but for server-side matching)
 */

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
 * Match passenger route with driver routes
 */
const findMatchingRides = (passengerRoute, driverRoutes) => {
  const matches = [];

  driverRoutes.forEach((driverRoute) => {
    let matchScore = 0;
    const reasons = [];

    // Check if passenger pickup is on driver route
    const pickupOnRoute = isPointOnRoute(
      passengerRoute.pickupLocation,
      driverRoute.pickupLocation,
      driverRoute.dropoffLocation
    );

    // Check if passenger dropoff is on driver route
    const dropoffOnRoute = isPointOnRoute(
      passengerRoute.dropoffLocation,
      driverRoute.pickupLocation,
      driverRoute.dropoffLocation
    );

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
    }
    if (dropoffOnRoute) {
      matchScore += 30;
      reasons.push('Dropoff on route');
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
        reasons
      });
    }
  });

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

