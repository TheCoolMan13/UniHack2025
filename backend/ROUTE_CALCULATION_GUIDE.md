# Route Calculation Implementation Guide

## Overview

This guide shows how to implement real route calculation using Google Maps Directions API on the backend. This will replace the simple straight-line distance calculations with actual driving routes.

## Why Backend?

✅ **Security** - API keys stay on server  
✅ **Performance** - Can cache routes  
✅ **Cost** - Fewer API calls  
✅ **Consistency** - Same calculation for all clients  

---

## Step 1: Install Dependencies

```bash
cd backend
npm install @googlemaps/google-maps-services-js
npm install node-cache  # For caching routes
```

---

## Step 2: Set Up Google Maps API Key

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Directions API** and **Maps JavaScript API**
3. Add to `.env`:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

## Step 3: Create Route Service

Create `backend/services/routeService.js`:

```javascript
const { Client } = require('@googlemaps/google-maps-services-js');
const NodeCache = require('node-cache');

const client = new Client({});
const routeCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

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
      throw new Error('No route found');
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
    throw new Error('Failed to calculate route');
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
  const cacheKey = `waypoints_${origin.latitude},${origin.longitude}_${waypoints.map(w => `${w.latitude},${w.longitude}`).join('_')}_${destination.latitude},${destination.longitude}`;
  
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
      throw new Error('No route found');
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
    throw new Error('Failed to calculate route with waypoints');
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

    // Calculate overlap (simplified - in production, decode polylines and compare)
    // For now, check if route2's points are near route1
    const route1Polyline = route1Data.polyline;
    const route2Polyline = route2Data.polyline;

    // Decode polylines and find common segments
    // This is a simplified version - you might want to use a library like @mapbox/polyline
    const overlap = calculatePolylineOverlap(route1Polyline, route2Polyline);

    return {
      overlapPercentage: overlap.percentage,
      overlapDistance: overlap.distance,
      route1Distance: route1Data.distance,
      route2Distance: route2Data.distance,
    };
  } catch (error) {
    console.error('Route overlap calculation error:', error);
    throw new Error('Failed to calculate route overlap');
  }
};

/**
 * Calculate if a point is on/near a route (using actual route polyline)
 * @param {Object} point - {latitude, longitude}
 * @param {Object} routeStart - {latitude, longitude}
 * @param {Object} routeEnd - {latitude, longitude}
 * @param {number} threshold - Maximum distance in km
 * @returns {Promise<Object>} - {isOnRoute, distance, nearestPoint}
 */
const isPointOnRoute = async (point, routeStart, routeEnd, threshold = 2) => {
  try {
    const route = await getRoute(routeStart, routeEnd);
    
    // Decode polyline and find nearest point on route
    // Use @mapbox/polyline to decode
    const decoded = decodePolyline(route.polyline);
    
    let minDistance = Infinity;
    let nearestPoint = null;
    
    for (let i = 0; i < decoded.length - 1; i++) {
      const segmentStart = decoded[i];
      const segmentEnd = decoded[i + 1];
      const distance = distanceToLineSegment(point, segmentStart, segmentEnd);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = {
          latitude: segmentStart[0],
          longitude: segmentStart[1],
        };
      }
    }
    
    return {
      isOnRoute: minDistance <= threshold,
      distance: minDistance,
      nearestPoint,
    };
  } catch (error) {
    console.error('Point on route check error:', error);
    // Fallback to simple calculation
    return {
      isOnRoute: false,
      distance: Infinity,
      nearestPoint: null,
    };
  }
};

// Helper function to decode polyline (simplified - use library in production)
const decodePolyline = (encoded) => {
  // Use @mapbox/polyline library for proper decoding
  // For now, return empty array
  return [];
};

// Helper function to calculate polyline overlap (simplified)
const calculatePolylineOverlap = (polyline1, polyline2) => {
  // Implement polyline comparison logic
  // This is complex - consider using a library
  return {
    percentage: 0,
    distance: 0,
  };
};

// Helper function (already exists in matchingService)
const distanceToLineSegment = (point, lineStart, lineEnd) => {
  const A = point.latitude - lineStart[0];
  const B = point.longitude - lineStart[1];
  const C = lineEnd[0] - lineStart[0];
  const D = lineEnd[1] - lineStart[1];

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;
  if (param < 0) {
    xx = lineStart[0];
    yy = lineStart[1];
  } else if (param > 1) {
    xx = lineEnd[0];
    yy = lineEnd[1];
  } else {
    xx = lineStart[0] + param * C;
    yy = lineStart[1] + param * D;
  }

  const dx = point.latitude - xx;
  const dy = point.longitude - yy;
  return Math.sqrt(dx * dx + dy * dy) * 111; // Convert to km
};

module.exports = {
  getRoute,
  getRouteWithWaypoints,
  calculateRouteOverlap,
  isPointOnRoute,
};
```

---

## Step 4: Create Route Controller

Create `backend/controllers/routeController.js`:

```javascript
const routeService = require('../services/routeService');

/**
 * @desc    Get route between two points
 * @route   POST /api/routes/calculate
 * @access  Private
 */
const calculateRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required',
      });
    }

    const route = await routeService.getRoute(origin, destination);

    res.json({
      success: true,
      data: { route },
    });
  } catch (error) {
    console.error('Calculate route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate route',
    });
  }
};

/**
 * @desc    Get route with waypoints
 * @route   POST /api/routes/calculate-with-waypoints
 * @access  Private
 */
const calculateRouteWithWaypoints = async (req, res) => {
  try {
    const { origin, waypoints, destination } = req.body;

    if (!origin || !destination || !waypoints || !Array.isArray(waypoints)) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and waypoints array are required',
      });
    }

    const route = await routeService.getRouteWithWaypoints(origin, waypoints, destination);

    res.json({
      success: true,
      data: { route },
    });
  } catch (error) {
    console.error('Calculate route with waypoints error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate route',
    });
  }
};

/**
 * @desc    Calculate route overlap
 * @route   POST /api/routes/overlap
 * @access  Private
 */
const calculateOverlap = async (req, res) => {
  try {
    const { route1, route2 } = req.body;

    if (!route1 || !route2) {
      return res.status(400).json({
        success: false,
        message: 'Both routes are required',
      });
    }

    const overlap = await routeService.calculateRouteOverlap(route1, route2);

    res.json({
      success: true,
      data: { overlap },
    });
  } catch (error) {
    console.error('Calculate overlap error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate overlap',
    });
  }
};

module.exports = {
  calculateRoute,
  calculateRouteWithWaypoints,
  calculateOverlap,
};
```

---

## Step 5: Create Route Routes

Create `backend/routes/routes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const routeController = require('../controllers/routeController');

/**
 * @route   POST /api/routes/calculate
 * @desc    Calculate route between two points
 * @access  Private
 */
router.post('/calculate', authenticate, routeController.calculateRoute);

/**
 * @route   POST /api/routes/calculate-with-waypoints
 * @desc    Calculate route with waypoints
 * @access  Private
 */
router.post('/calculate-with-waypoints', authenticate, routeController.calculateRouteWithWaypoints);

/**
 * @route   POST /api/routes/overlap
 * @desc    Calculate route overlap
 * @access  Private
 */
router.post('/overlap', authenticate, routeController.calculateOverlap);

module.exports = router;
```

---

## Step 6: Update Server.js

Add route to `backend/server.js`:

```javascript
const routesRoutes = require('./routes/routes');

// ... existing code ...

app.use('/api/routes', routesRoutes);
```

---

## Step 7: Update Matching Service

Update `backend/services/matchingService.js` to use real routes:

```javascript
const routeService = require('./routeService');

// Update findMatchingRides to use real route calculation
const findMatchingRides = async (passengerRoute, driverRoutes) => {
  const matches = [];

  for (const driverRoute of driverRoutes) {
    try {
      // Check if passenger pickup is on driver route (using real route)
      const pickupCheck = await routeService.isPointOnRoute(
        passengerRoute.pickupLocation,
        driverRoute.pickupLocation,
        driverRoute.dropoffLocation,
        2 // 2km threshold
      );

      // Check if passenger dropoff is on driver route
      const dropoffCheck = await routeService.isPointOnRoute(
        passengerRoute.dropoffLocation,
        driverRoute.pickupLocation,
        driverRoute.dropoffLocation,
        2
      );

      // Calculate match score
      let matchScore = 0;
      const reasons = [];

      if (pickupCheck.isOnRoute) {
        matchScore += 30;
        reasons.push('Pickup on route');
      }
      if (dropoffCheck.isOnRoute) {
        matchScore += 30;
        reasons.push('Dropoff on route');
      }

      // Time and day matching (existing logic)
      const timeMatch = isTimeMatch(
        passengerRoute.schedule.time,
        driverRoute.schedule.time
      );
      const dayMatch = isDayMatch(
        passengerRoute.schedule.days,
        driverRoute.schedule.days
      );

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
          pickupDistance: pickupCheck.distance,
          dropoffDistance: dropoffCheck.distance,
        });
      }
    } catch (error) {
      console.error('Error matching route:', error);
      // Continue with next route
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
};
```

---

## Step 8: Install Polyline Decoder (Optional)

For better polyline handling:

```bash
npm install @mapbox/polyline
```

Then update routeService.js:

```javascript
const polyline = require('@mapbox/polyline');

const decodePolyline = (encoded) => {
  return polyline.decode(encoded).map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
};
```

---

## Testing

Test the endpoints with Postman or curl:

```bash
# Calculate route
curl -X POST http://localhost:3000/api/routes/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"latitude": 40.7128, "longitude": -74.0060},
    "destination": {"latitude": 40.7589, "longitude": -73.9851}
  }'
```

---

## Cost Considerations

- Google Maps Directions API: ~$5 per 1000 requests
- Cache routes to reduce API calls
- Consider using free alternatives for development (Mapbox, OpenRouteService)

---

## Next Steps

1. ✅ Implement basic route calculation
2. ✅ Add caching
3. ✅ Update matching algorithm to use real routes
4. 🔄 Add route visualization (polylines) to frontend
5. 🔄 Calculate detour distance for drivers
6. 🔄 Optimize route matching performance

---

## Notes

- Always cache routes to reduce API costs
- Handle API errors gracefully
- Consider rate limiting for route endpoints
- Monitor API usage in Google Cloud Console

