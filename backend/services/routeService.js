const { Client } = require('@googlemaps/google-maps-services-js');
const NodeCache = require('node-cache');
const polyline = require('@mapbox/polyline');

const client = new Client({});
// Cache routes for 1 hour (3600 seconds)
const routeCache = new NodeCache({ stdTTL: 3600 });

/**
 * Get driving route between two points
 * @param {Object} origin - {latitude, longitude}
 * @param {Object} destination - {latitude, longitude}
 * @returns {Promise<Object>} - Route data with distance, duration, polyline
 */
const getRoute = async (origin, destination) => {
  const cacheKey = `${origin.latitude},${origin.longitude}_${destination.latitude},${destination.longitude}`;
  
  // Check cache first
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await client.directions({
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: 'driving',
        alternatives: false,
      },
    });

    if (response.data.status !== 'OK' || !response.data.routes.length) {
      throw new Error(`No route found: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const routeData = {
      distance: leg.distance.value / 1000, // Convert to km
      distanceText: leg.distance.text,
      duration: leg.duration.value / 60, // Convert to minutes
      durationText: leg.duration.text,
      polyline: route.overview_polyline.points,
      steps: leg.steps.map(step => ({
        distance: step.distance.value / 1000,
        duration: step.duration.value / 60,
        instruction: step.html_instructions,
        startLocation: {
          latitude: step.start_location.lat,
          longitude: step.start_location.lng,
        },
        endLocation: {
          latitude: step.end_location.lat,
          longitude: step.end_location.lng,
        },
      })),
    };

    // Cache the result
    routeCache.set(cacheKey, routeData);
    
    return routeData;
  } catch (error) {
    console.error('Route calculation error:', error);
    throw new Error(`Failed to calculate route: ${error.message}`);
  }
};

/**
 * Calculate route with waypoints (for passenger pickup/dropoff on driver route)
 * @param {Object} origin - Driver pickup
 * @param {Array} waypoints - Array of {latitude, longitude}
 * @param {Object} destination - Driver dropoff
 * @returns {Promise<Object>}
 */
const getRouteWithWaypoints = async (origin, waypoints, destination) => {
  if (!waypoints || waypoints.length === 0) {
    return getRoute(origin, destination);
  }

  const waypointsStr = waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
  const cacheKey = `waypoints_${origin.latitude},${origin.longitude}_${waypointsStr}_${destination.latitude},${destination.longitude}`;
  
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await client.directions({
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        waypoints: waypoints.map(wp => `${wp.latitude},${wp.longitude}`),
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: 'driving',
        optimizeWaypoints: true, // Optimize waypoint order
      },
    });

    if (response.data.status !== 'OK' || !response.data.routes.length) {
      throw new Error(`No route found: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
    const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60;

    const routeData = {
      distance: totalDistance,
      duration: totalDuration,
      polyline: route.overview_polyline.points,
      legs: route.legs.map(leg => ({
        distance: leg.distance.value / 1000,
        duration: leg.duration.value / 60,
        startLocation: {
          latitude: leg.start_location.lat,
          longitude: leg.start_location.lng,
        },
        endLocation: {
          latitude: leg.end_location.lat,
          longitude: leg.end_location.lng,
        },
      })),
    };

    routeCache.set(cacheKey, routeData);
    return routeData;
  } catch (error) {
    console.error('Route with waypoints error:', error);
    throw new Error(`Failed to calculate route with waypoints: ${error.message}`);
  }
};

/**
 * Calculate if a point is on/near a route (using actual route polyline)
 * @param {Object} point - {latitude, longitude}
 * @param {Object} routeStart - {latitude, longitude}
 * @param {Object} routeEnd - {latitude, longitude}
 * @param {number} threshold - Maximum distance in km (default: 2km)
 * @returns {Promise<Object>} - {isOnRoute, distance, nearestPoint}
 */
const isPointOnRoute = async (point, routeStart, routeEnd, threshold = 2) => {
  try {
    const route = await getRoute(routeStart, routeEnd);
    
    // Decode polyline to get route points
    const decoded = polyline.decode(route.polyline);
    
    let minDistance = Infinity;
    let nearestPoint = null;
    
    // Check distance to each segment of the route
    for (let i = 0; i < decoded.length - 1; i++) {
      const segmentStart = { latitude: decoded[i][0], longitude: decoded[i][1] };
      const segmentEnd = { latitude: decoded[i + 1][0], longitude: decoded[i + 1][1] };
      const distance = distanceToLineSegment(point, segmentStart, segmentEnd);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = segmentStart;
      }
    }
    
    return {
      isOnRoute: minDistance <= threshold,
      distance: minDistance,
      nearestPoint,
    };
  } catch (error) {
    console.error('Point on route check error:', error);
    // Fallback to simple straight-line calculation
    const fallbackDistance = calculateDistance(
      point.latitude,
      point.longitude,
      routeStart.latitude,
      routeStart.longitude
    );
    return {
      isOnRoute: false,
      distance: fallbackDistance,
      nearestPoint: routeStart,
    };
  }
};

/**
 * Calculate route overlap between two routes
 * @param {Object} route1 - {pickupLocation, dropoffLocation}
 * @param {Object} route2 - {pickupLocation, dropoffLocation}
 * @returns {Promise<Object>} - Overlap data
 */
const calculateRouteOverlap = async (route1, route2) => {
  try {
    // Get both routes
    const [route1Data, route2Data] = await Promise.all([
      getRoute(route1.pickupLocation, route1.dropoffLocation),
      getRoute(route2.pickupLocation, route2.dropoffLocation),
    ]);

    // Decode polylines
    const route1Points = polyline.decode(route1Data.polyline);
    const route2Points = polyline.decode(route2Data.polyline);

    // Find overlapping segments
    let overlapDistance = 0;
    const overlapThreshold = 0.1; // 100 meters

    // Check each point in route1 against route2 segments
    for (let i = 0; i < route1Points.length; i++) {
      const point = { latitude: route1Points[i][0], longitude: route1Points[i][1] };
      
      for (let j = 0; j < route2Points.length - 1; j++) {
        const segStart = { latitude: route2Points[j][0], longitude: route2Points[j][1] };
        const segEnd = { latitude: route2Points[j + 1][0], longitude: route2Points[j + 1][1] };
        const distance = distanceToLineSegment(point, segStart, segEnd);
        
        if (distance <= overlapThreshold) {
          // Calculate segment length
          const segLength = calculateDistance(
            segStart.latitude,
            segStart.longitude,
            segEnd.latitude,
            segEnd.longitude
          );
          overlapDistance += segLength / route1Points.length; // Approximate
          break;
        }
      }
    }

    const overlapPercentage = (overlapDistance / route1Data.distance) * 100;

    return {
      overlapPercentage: Math.min(100, Math.max(0, overlapPercentage)),
      overlapDistance: overlapDistance,
      route1Distance: route1Data.distance,
      route2Distance: route2Data.distance,
    };
  } catch (error) {
    console.error('Route overlap calculation error:', error);
    throw new Error(`Failed to calculate route overlap: ${error.message}`);
  }
};

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
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
 * Helper: Calculate distance from a point to a line segment
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

module.exports = {
  getRoute,
  getRouteWithWaypoints,
  calculateRouteOverlap,
  isPointOnRoute,
  calculateDistance,
};

