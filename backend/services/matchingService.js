/**
 * Route Matching Service
 * Implements algorithm to match passenger routes with driver routes
 * Uses real route calculation from Google Maps Directions API for accurate matching
 */
const routeService = require('./routeService');
const polyline = require('@mapbox/polyline');

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
 * Check if pickup comes before dropoff along the driver's route
 * Uses route polyline to determine point positions
 * @param {Object} pickupPoint - Passenger pickup location
 * @param {Object} dropoffPoint - Passenger dropoff location
 * @param {Object} routeStart - Driver route start
 * @param {Object} routeEnd - Driver route end
 * @returns {Promise<Object>} - {isValidOrder, pickupPosition, dropoffPosition, pickupDistance, dropoffDistance}
 */
const checkRouteOrder = async (pickupPoint, dropoffPoint, routeStart, routeEnd) => {
  try {
    // Get the driver's route
    const driverRoute = await routeService.getRoute(routeStart, routeEnd);
    const decoded = polyline.decode(driverRoute.polyline);

    // Find closest points on route for pickup and dropoff
    let pickupMinDistance = Infinity;
    let dropoffMinDistance = Infinity;
    let pickupIndex = -1;
    let dropoffIndex = -1;

    for (let i = 0; i < decoded.length; i++) {
      const routePoint = { latitude: decoded[i][0], longitude: decoded[i][1] };
      
      // Calculate distance from pickup to this route point
      const pickupDist = calculateDistance(
        pickupPoint.latitude,
        pickupPoint.longitude,
        routePoint.latitude,
        routePoint.longitude
      );
      
      // Calculate distance from dropoff to this route point
      const dropoffDist = calculateDistance(
        dropoffPoint.latitude,
        dropoffPoint.longitude,
        routePoint.latitude,
        routePoint.longitude
      );

      if (pickupDist < pickupMinDistance) {
        pickupMinDistance = pickupDist;
        pickupIndex = i;
      }

      if (dropoffDist < dropoffMinDistance) {
        dropoffMinDistance = dropoffDist;
        dropoffIndex = i;
      }
    }

    // Check if pickup comes before dropoff along the route
    const isValidOrder = pickupIndex < dropoffIndex;
    
    // Calculate distances using routeService for accuracy
    const pickupCheck = await routeService.isPointOnRoute(
      pickupPoint,
      routeStart,
      routeEnd,
      5 // 5km threshold for order checking
    );
    
    const dropoffCheck = await routeService.isPointOnRoute(
      dropoffPoint,
      routeStart,
      routeEnd,
      5
    );

    return {
      isValidOrder,
      pickupPosition: pickupIndex,
      dropoffPosition: dropoffIndex,
      pickupDistance: pickupCheck.distance,
      dropoffDistance: dropoffCheck.distance,
      pickupOnRoute: pickupCheck.isOnRoute,
      dropoffOnRoute: dropoffCheck.isOnRoute,
    };
  } catch (error) {
    console.error('Error checking route order:', error);
    // Fallback: use simple distance check
    const pickupDist = calculateDistance(
      pickupPoint.latitude,
      pickupPoint.longitude,
      routeStart.latitude,
      routeStart.longitude
    );
    const dropoffDist = calculateDistance(
      dropoffPoint.latitude,
      dropoffPoint.longitude,
      routeStart.latitude,
      routeStart.longitude
    );
    
    // Simple heuristic: if dropoff is further from start than pickup, assume valid order
    return {
      isValidOrder: dropoffDist > pickupDist,
      pickupPosition: -1,
      dropoffPosition: -1,
      pickupDistance: pickupDist,
      dropoffDistance: dropoffDist,
      pickupOnRoute: false,
      dropoffOnRoute: false,
    };
  }
};

/**
 * Match passenger route with driver routes using real route calculation
 * Enhanced version that checks route order and calculates recommended routes
 */
const findMatchingRides = async (passengerRoute, driverRoutes) => {
  try {
    const matches = [];
    const USE_REAL_ROUTES = process.env.USE_REAL_ROUTES !== 'false'; // Default to true if not set

    // Validate inputs
    if (!passengerRoute) {
      throw new Error('passengerRoute is required');
    }
    if (!passengerRoute.pickupLocation || !passengerRoute.dropoffLocation) {
      throw new Error('passengerRoute must have pickupLocation and dropoffLocation');
    }

    // Handle empty driver routes
    if (!driverRoutes || driverRoutes.length === 0) {
      console.log('No driver routes to match against');
      return matches;
    }

    console.log(`Starting matching for ${driverRoutes.length} driver routes, USE_REAL_ROUTES=${USE_REAL_ROUTES}`);

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
      let isValidOrder = false;
      let recommendedRoute = null;
      let detourDistance = 0;
      let detourDuration = 0;
      let originalRouteDistance = 0;
      let originalRouteDuration = 0;

      if (USE_REAL_ROUTES) {
        // Get driver's original route for comparison
        const originalRoute = await routeService.getRoute(
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );
        originalRouteDistance = originalRoute.distance;
        originalRouteDuration = originalRoute.duration;

        // Check route order and point positions
        const orderCheck = await checkRouteOrder(
          passengerRoute.pickupLocation,
          passengerRoute.dropoffLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );

        isValidOrder = orderCheck.isValidOrder;
        pickupOnRoute = orderCheck.pickupOnRoute;
        dropoffOnRoute = orderCheck.dropoffOnRoute;
        pickupDistance = orderCheck.pickupDistance;
        dropoffDistance = orderCheck.dropoffDistance;

        // Only calculate recommended route if order is valid or both points are on route
        if (isValidOrder || (pickupOnRoute && dropoffOnRoute)) {
          try {
            // Calculate route: Driver Origin → Passenger Pickup → Passenger Dropoff → Driver Destination
            recommendedRoute = await routeService.getRouteWithWaypoints(
              driverRoute.pickupLocation,
              [passengerRoute.pickupLocation, passengerRoute.dropoffLocation],
              driverRoute.dropoffLocation
            );

            // Calculate detour (extra distance/time)
            detourDistance = recommendedRoute.distance - originalRouteDistance;
            detourDuration = recommendedRoute.duration - originalRouteDuration;
          } catch (routeError) {
            console.error(`Error calculating recommended route for driver ${driverRoute.id}:`, routeError);
            // Continue without recommended route
          }
        }
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
        
        // Simple order check: dropoff should be further from start
        const pickupFromStart = calculateDistance(
          passengerRoute.pickupLocation.latitude,
          passengerRoute.pickupLocation.longitude,
          driverRoute.pickupLocation.latitude,
          driverRoute.pickupLocation.longitude
        );
        const dropoffFromStart = calculateDistance(
          passengerRoute.dropoffLocation.latitude,
          passengerRoute.dropoffLocation.longitude,
          driverRoute.pickupLocation.latitude,
          driverRoute.pickupLocation.longitude
        );
        isValidOrder = dropoffFromStart > pickupFromStart;
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

      // Calculate match score with improved logic
      if (pickupOnRoute && dropoffOnRoute && isValidOrder) {
        matchScore += 40; // Perfect match: both on route and correct order
        reasons.push('Perfect route alignment');
      } else if (pickupOnRoute && dropoffOnRoute) {
        matchScore += 30; // Both on route but order might be wrong
        reasons.push('Both points on route');
        if (!isValidOrder) {
          reasons.push('⚠️ Route order may be incorrect');
        }
      } else if (pickupOnRoute) {
        matchScore += 20;
        reasons.push('Pickup on route');
        if (dropoffDistance < 5) {
          matchScore += 10;
          reasons.push(`Dropoff near route (${dropoffDistance.toFixed(1)}km)`);
        }
      } else if (dropoffOnRoute) {
        matchScore += 20;
        reasons.push('Dropoff on route');
        if (pickupDistance < 5) {
          matchScore += 10;
          reasons.push(`Pickup near route (${pickupDistance.toFixed(1)}km)`);
        }
      } else {
        // Both points near route
        if (pickupDistance < 5 && dropoffDistance < 5) {
          matchScore += 20;
          reasons.push(`Both points near route (pickup: ${pickupDistance.toFixed(1)}km, dropoff: ${dropoffDistance.toFixed(1)}km)`);
        } else if (pickupDistance < 5) {
          matchScore += 10;
          reasons.push(`Pickup near route (${pickupDistance.toFixed(1)}km)`);
        } else if (dropoffDistance < 5) {
          matchScore += 10;
          reasons.push(`Dropoff near route (${dropoffDistance.toFixed(1)}km)`);
        }
      }

      // Penalize invalid order
      if (!isValidOrder && (pickupOnRoute || dropoffOnRoute)) {
        matchScore -= 15;
        reasons.push('⚠️ Route order may require backtracking');
      }

      // Time matching
      if (timeMatch) {
        matchScore += 25;
        reasons.push('Time matches');
      } else {
        // Partial time match (within 1 hour)
        const timeDiff = Math.abs(
          parseTime(passengerRoute.schedule.time) - parseTime(driverRoute.schedule.time)
        );
        if (timeDiff <= 60) {
          matchScore += 10;
          reasons.push('Time close');
        }
      }

      // Day matching
      if (dayMatch) {
        matchScore += 15;
        reasons.push('Days match');
      }

      // Detour penalty (smaller detour = better match)
      if (detourDistance > 0) {
        if (detourDistance < 2) {
          matchScore += 5; // Small detour is good
          reasons.push(`Minimal detour (+${detourDistance.toFixed(1)}km)`);
        } else if (detourDistance < 5) {
          // Neutral
        } else {
          matchScore -= 5; // Large detour penalty
          reasons.push(`Large detour (+${detourDistance.toFixed(1)}km)`);
        }
      }

      // Only include if there's a meaningful match
      if (matchScore >= 30) {
        const match = {
          ...driverRoute,
          matchScore,
          reasons,
          pickupDistance: pickupDistance < Infinity ? pickupDistance : null,
          dropoffDistance: dropoffDistance < Infinity ? dropoffDistance : null,
          isValidOrder,
        };

        // Add route information if available
        if (recommendedRoute) {
          // Enhance legs with descriptive information
          const enhancedLegs = (recommendedRoute.legs || []).map((leg, index) => {
            let fromLabel, toLabel;
            if (index === 0) {
              fromLabel = 'Driver Origin';
              toLabel = 'Passenger Pickup';
            } else if (index === 1) {
              fromLabel = 'Passenger Pickup';
              toLabel = 'Passenger Dropoff';
            } else {
              fromLabel = 'Passenger Dropoff';
              toLabel = 'Driver Destination';
            }
            
            return {
              ...leg,
              from: fromLabel,
              to: toLabel,
              distance: leg.distance,
              duration: leg.duration,
              startLocation: leg.startLocation,
              endLocation: leg.endLocation,
            };
          });

          match.recommendedRoute = {
            distance: recommendedRoute.distance,
            duration: recommendedRoute.duration,
            distanceText: `${recommendedRoute.distance.toFixed(1)} km`,
            durationText: `${Math.round(recommendedRoute.duration)} min`,
            polyline: recommendedRoute.polyline,
            legs: enhancedLegs,
          };
          match.detourDistance = Math.round(detourDistance * 10) / 10; // Round to 1 decimal
          match.detourDuration = Math.round(detourDuration);
          match.originalRoute = {
            distance: originalRouteDistance,
            duration: originalRouteDuration,
            distanceText: `${originalRouteDistance.toFixed(1)} km`,
            durationText: `${Math.round(originalRouteDuration)} min`,
          };
        }

        matches.push(match);
      }
    } catch (error) {
      console.error(`Error matching route for driver ${driverRoute.id}:`, error.message);
      console.error(`Error stack for driver ${driverRoute.id}:`, error.stack);
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
        console.error('Fallback matching also failed:', fallbackError.message);
        console.error('Fallback error stack:', fallbackError.stack);
        // Skip this route and continue
      }
    }
  }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error in findMatchingRides:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw error; // Re-throw to be caught by controller
  }
};

/**
 * Helper function to parse time string to minutes
 */
const parseTime = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  return totalMinutes;
};

module.exports = {
  findMatchingRides,
  calculateDistance,
  isPointOnRoute,
  isTimeMatch,
  isDayMatch
};

