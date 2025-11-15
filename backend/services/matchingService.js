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
const isTimeMatch = (time1, time2, window = 60) => {
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
        // Use lenient threshold for better matching (1km)
        const ON_ROUTE_THRESHOLD = 1.0; // 1km - lenient for better matches
        const pickupCheck = await routeService.isPointOnRoute(
          pickupPoint,
          routeStart,
          routeEnd,
          ON_ROUTE_THRESHOLD
        );
        
        const dropoffCheck = await routeService.isPointOnRoute(
          dropoffPoint,
          routeStart,
          routeEnd,
          ON_ROUTE_THRESHOLD
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

    // Lenient: if either point is within 20km of driver route, consider it
    // This allows for routes where passenger might be picked up along the way
    return pickupDistance < 20 || dropoffDistance < 20;
  });
  
  console.log(`Quick filter: ${driverRoutes.length} routes -> ${quickFiltered.length} potential matches`);

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
      let originalRouteData = null; // Store original route data for frontend display

      if (USE_REAL_ROUTES) {
        // Get driver's original route for comparison
        const originalRoute = await routeService.getRoute(
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation
        );
        originalRouteDistance = originalRoute.distance;
        originalRouteDuration = originalRoute.duration;
        // Store original route data for frontend display
        originalRouteData = {
          distance: originalRoute.distance,
          duration: originalRoute.duration,
          distanceText: originalRoute.distanceText,
          durationText: originalRoute.durationText,
          polyline: originalRoute.polyline, // Include polyline for map display
        };

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
        // Use lenient threshold for better matching (1km)
        const ON_ROUTE_THRESHOLD = 1.0; // 1km - lenient for better matches
        pickupOnRoute = isPointOnRoute(
          passengerRoute.pickupLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation,
          ON_ROUTE_THRESHOLD
        );
        dropoffOnRoute = isPointOnRoute(
          passengerRoute.dropoffLocation,
          driverRoute.pickupLocation,
          driverRoute.dropoffLocation,
          ON_ROUTE_THRESHOLD
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

      // Calculate match score with lenient logic for better matching
      // Thresholds for city distances (in km) - lenient for more matches
      const ON_ROUTE_THRESHOLD = 1.0; // 1km - on route (lenient)
      const NEAR_ROUTE_THRESHOLD = 2.0; // 2km - near route, acceptable
      const CLOSE_TO_ROUTE_THRESHOLD = 3.5; // 3.5km - close to route, with small penalty
      
      // Only consider "on route" if actually within lenient threshold
      const strictPickupOnRoute = pickupOnRoute && pickupDistance <= ON_ROUTE_THRESHOLD;
      const strictDropoffOnRoute = dropoffOnRoute && dropoffDistance <= ON_ROUTE_THRESHOLD;
      
      // Check for EXACT or VERY close matches (within 100m = 0.1km)
      const EXACT_MATCH_THRESHOLD = 0.1; // 100 meters - essentially the same location
      const isExactPickup = pickupDistance <= EXACT_MATCH_THRESHOLD;
      const isExactDropoff = dropoffDistance <= EXACT_MATCH_THRESHOLD;
      
      if (strictPickupOnRoute && strictDropoffOnRoute && isValidOrder) {
        // Perfect match: both on route and correct order
        matchScore += 60; // Significantly increased from 35
        reasons.push('Perfect route alignment');
        
        // Bonus for exact matches
        if (isExactPickup && isExactDropoff) {
          matchScore += 20; // Huge bonus for exact match
          reasons.push('🎯 EXACT MATCH - Same pickup and dropoff locations!');
        } else if (isExactPickup) {
          matchScore += 10;
          reasons.push('🎯 Exact pickup location match');
        } else if (isExactDropoff) {
          matchScore += 10;
          reasons.push('🎯 Exact dropoff location match');
        }
      } else if (strictPickupOnRoute && strictDropoffOnRoute) {
        matchScore += 40; // Increased from 25
        reasons.push('Both points on route');
        if (!isValidOrder) {
          matchScore -= 3; // Reduced penalty
          reasons.push('⚠️ Route order may be incorrect');
        }
        
        // Bonus for exact matches even if order is questionable
        if (isExactPickup && isExactDropoff) {
          matchScore += 15;
          reasons.push('🎯 EXACT MATCH - Same locations!');
        }
      } else if (strictPickupOnRoute) {
        // Pickup is on route, check dropoff distance
        matchScore += 20; // Increased from 15
        reasons.push('Pickup on route');
        if (isExactPickup) {
          matchScore += 10; // Bonus for exact pickup
          reasons.push('🎯 Exact pickup location');
        }
        if (dropoffDistance <= NEAR_ROUTE_THRESHOLD) {
          matchScore += 12; // Increased from 8
          reasons.push(`Dropoff near route (${dropoffDistance.toFixed(2)}km)`);
        } else if (dropoffDistance <= CLOSE_TO_ROUTE_THRESHOLD) {
          matchScore += 5; // Increased from 2
          reasons.push(`Dropoff somewhat close (${dropoffDistance.toFixed(2)}km)`);
        } else {
          matchScore -= 3; // Reduced from -5
          reasons.push(`Dropoff far from route (${dropoffDistance.toFixed(2)}km)`);
        }
      } else if (strictDropoffOnRoute) {
        // Dropoff is on route, check pickup distance
        matchScore += 20; // Increased from 15
        reasons.push('Dropoff on route');
        if (isExactDropoff) {
          matchScore += 10; // Bonus for exact dropoff
          reasons.push('🎯 Exact dropoff location');
        }
        if (pickupDistance <= NEAR_ROUTE_THRESHOLD) {
          matchScore += 12; // Increased from 8
          reasons.push(`Pickup near route (${pickupDistance.toFixed(2)}km)`);
        } else if (pickupDistance <= CLOSE_TO_ROUTE_THRESHOLD) {
          matchScore += 5; // Increased from 2
          reasons.push(`Pickup somewhat close (${pickupDistance.toFixed(2)}km)`);
        } else {
          matchScore -= 3; // Reduced from -5
          reasons.push(`Pickup far from route (${pickupDistance.toFixed(2)}km)`);
        }
      } else {
        // Neither point is strictly on route - score based on distances
        if (pickupDistance <= NEAR_ROUTE_THRESHOLD && dropoffDistance <= NEAR_ROUTE_THRESHOLD) {
          matchScore += 20; // Increased from 15
          reasons.push(`Both points near route (pickup: ${pickupDistance.toFixed(2)}km, dropoff: ${dropoffDistance.toFixed(2)}km)`);
        } else if (pickupDistance <= NEAR_ROUTE_THRESHOLD) {
          if (dropoffDistance <= CLOSE_TO_ROUTE_THRESHOLD) {
            matchScore += 12; // Increased from 8
            reasons.push(`Pickup near route (${pickupDistance.toFixed(2)}km), dropoff close (${dropoffDistance.toFixed(2)}km)`);
          } else {
            matchScore -= 2; // Reduced from -3
            reasons.push(`Pickup near route (${pickupDistance.toFixed(2)}km), but dropoff far (${dropoffDistance.toFixed(2)}km)`);
          }
        } else if (dropoffDistance <= NEAR_ROUTE_THRESHOLD) {
          if (pickupDistance <= CLOSE_TO_ROUTE_THRESHOLD) {
            matchScore += 12; // Increased from 8
            reasons.push(`Dropoff near route (${dropoffDistance.toFixed(2)}km), pickup close (${pickupDistance.toFixed(2)}km)`);
          } else {
            matchScore -= 2; // Reduced from -3
            reasons.push(`Dropoff near route (${dropoffDistance.toFixed(2)}km), but pickup far (${pickupDistance.toFixed(2)}km)`);
          }
        } else if (pickupDistance <= CLOSE_TO_ROUTE_THRESHOLD && dropoffDistance <= CLOSE_TO_ROUTE_THRESHOLD) {
          matchScore += 10; // Increased from 5
          reasons.push(`Both points somewhat close (pickup: ${pickupDistance.toFixed(2)}km, dropoff: ${dropoffDistance.toFixed(2)}km)`);
        } else {
          // Too far from route - small penalty
          matchScore -= 5; // Reduced from -10
          reasons.push(`Points far from route (pickup: ${pickupDistance.toFixed(2)}km, dropoff: ${dropoffDistance.toFixed(2)}km)`);
        }
      }

      // Penalize invalid order (but not too harshly)
      if (!isValidOrder && (strictPickupOnRoute || strictDropoffOnRoute)) {
        matchScore -= 10; // Reduced from -30
        reasons.push('⚠️ Route order may require backtracking');
      } else if (!isValidOrder && (pickupDistance <= 1.0 || dropoffDistance <= 1.0)) {
        matchScore -= 5; // Reduced from -20
        reasons.push('⚠️ Route order may be suboptimal');
      } else if (!isValidOrder) {
        matchScore -= 3; // Reduced from -10
        reasons.push('⚠️ Route order may be suboptimal');
      }

      // Time matching - allow larger differences (up to 60 min) with lenient penalties
      let timeDifference = 0; // Store time difference for frontend display
      if (timeMatch) {
        matchScore += 25; // Increased from 15 for perfect time match
        reasons.push('Time matches perfectly');
        timeDifference = 0;
      } else {
        // Calculate time difference in minutes
        timeDifference = Math.abs(
          parseTime(passengerRoute.schedule.time) - parseTime(driverRoute.schedule.time)
        );
        
        if (timeDifference <= 15) {
          // Very close (within 15 min) - good bonus
          matchScore += 10;
          reasons.push(`Time very close (${Math.round(timeDifference)} min difference)`);
        } else if (timeDifference <= 30) {
          // Close (within 30 min) - small bonus
          matchScore += 6;
          reasons.push(`Time close (${Math.round(timeDifference)} min difference)`);
        } else if (timeDifference <= 60) {
          // Acceptable (within 60 min) - neutral, don't penalize
          matchScore += 2;
          reasons.push(`Time acceptable (${Math.round(timeDifference)} min difference)`);
        } else if (timeDifference <= 90) {
          // 60-90 min - small penalty
          matchScore -= 5;
          reasons.push(`Time off (${Math.round(timeDifference)} min difference)`);
        } else {
          // >90 min - larger penalty but not too harsh
          matchScore -= 15;
          reasons.push(`Time far (${Math.round(timeDifference)} min difference)`);
        }
      }

      // Day matching - must match
      if (dayMatch) {
        matchScore += 15; // Increased from 10
        reasons.push('Days match');
      } else {
        matchScore -= 5; // Reduced penalty from -10
        reasons.push('Days do not match');
      }

      // Detour penalty - very lenient, especially for small detours
      if (detourDistance <= 0.1) {
        // No detour or negligible detour - bonus!
        matchScore += 10;
        reasons.push('✨ No detour - perfect route!');
      } else if (detourDistance < 0.5) {
        matchScore += 5; // Tiny detour - bonus!
        reasons.push(`Minimal detour (+${detourDistance.toFixed(2)}km)`);
      } else if (detourDistance < 1) {
        matchScore += 3; // Small detour is acceptable
        reasons.push(`Small detour (+${detourDistance.toFixed(2)}km)`);
      } else if (detourDistance < 2) {
        matchScore += 1; // Small detour - no penalty
        reasons.push(`Moderate detour (+${detourDistance.toFixed(2)}km)`);
      } else if (detourDistance < 3) {
        matchScore -= 2; // Moderate detour - tiny penalty
        reasons.push(`Larger detour (+${detourDistance.toFixed(2)}km)`);
      } else if (detourDistance < 5) {
        matchScore -= 5; // Large detour - small penalty
        reasons.push(`Large detour (+${detourDistance.toFixed(2)}km)`);
      } else {
        matchScore -= 10; // Very large detour - moderate penalty
        reasons.push(`Very large detour (+${detourDistance.toFixed(2)}km)`);
      }

      // Only include if there's a meaningful match - threshold set to 50 for quality matches
      if (matchScore >= 50) {
        const match = {
          ...driverRoute,
          matchScore,
          reasons,
          pickupDistance: pickupDistance < Infinity ? pickupDistance : null,
          dropoffDistance: dropoffDistance < Infinity ? dropoffDistance : null,
          isValidOrder,
          timeDifference: timeDifference, // Include time difference for frontend display
          driverTime: driverRoute.schedule.time, // Include driver's time for display
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
        }
        
        // Always include original route if available (even if no recommended route)
        if (originalRouteData) {
          match.originalRoute = originalRouteData;
        } else if (originalRouteDistance > 0) {
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

        if (matchScore >= 50) {
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

