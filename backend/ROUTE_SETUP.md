# Route Calculation Setup Guide

## ✅ What's Been Implemented

Route calculation is now set up on the backend! Here's what was added:

1. ✅ Route service (`services/routeService.js`) - Calculates real driving routes
2. ✅ Route controller (`controllers/routeController.js`) - API handlers
3. ✅ Route routes (`routes/routes.js`) - API endpoints
4. ✅ Server integration - Routes are registered

## 🔑 API Key Setup

### Use the Same API Key as Frontend

**Yes, you can use the same Google Maps API key!** Just make sure it has these APIs enabled:

1. **Directions API** ⭐ (Required for route calculation)
2. Places API (already enabled for autocomplete)
3. Geocoding API (already enabled)

### Steps to Enable Directions API:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Search for "Directions API"
5. Click **Enable**

### Add API Key to Backend

1. Open `backend/.env` (create it from `env.example` if it doesn't exist)
2. Add your Google Maps API key:

```env
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Use the same key as in frontend `.env`:**
- Frontend: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key`
- Backend: `GOOGLE_MAPS_API_KEY=your_key`

## 🚀 Quick Start

1. **Add API key to `.env`:**
   ```bash
   cd backend
   # Copy env.example to .env if needed
   # Edit .env and add: GOOGLE_MAPS_API_KEY=your_key
   ```

2. **Restart the server:**
   ```bash
   npm run dev
   ```

3. **Test the endpoint:**
   ```bash
   # First, get a JWT token by logging in
   # Then test route calculation:
   curl -X POST http://localhost:3000/api/routes/calculate \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "origin": {"latitude": 44.4268, "longitude": 26.1025},
       "destination": {"latitude": 44.4378, "longitude": 26.0967}
     }'
   ```

## 📡 API Endpoints

### 1. Calculate Route
**POST** `/api/routes/calculate`

Calculate route between two points.

**Request:**
```json
{
  "origin": {
    "latitude": 44.4268,
    "longitude": 26.1025
  },
  "destination": {
    "latitude": 44.4378,
    "longitude": 26.0967
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {
      "distance": 2.5,
      "distanceText": "2.5 km",
      "duration": 8,
      "durationText": "8 mins",
      "polyline": "encoded_polyline_string",
      "steps": [...]
    }
  }
}
```

### 2. Calculate Route with Waypoints
**POST** `/api/routes/calculate-with-waypoints`

Calculate route with intermediate stops.

**Request:**
```json
{
  "origin": {"latitude": 44.4268, "longitude": 26.1025},
  "waypoints": [
    {"latitude": 44.4300, "longitude": 26.1000}
  ],
  "destination": {"latitude": 44.4378, "longitude": 26.0967}
}
```

### 3. Calculate Route Overlap
**POST** `/api/routes/overlap`

Calculate how much two routes overlap.

**Request:**
```json
{
  "route1": {
    "pickupLocation": {"latitude": 44.4268, "longitude": 26.1025},
    "dropoffLocation": {"latitude": 44.4378, "longitude": 26.0967}
  },
  "route2": {
    "pickupLocation": {"latitude": 44.4280, "longitude": 26.1030},
    "dropoffLocation": {"latitude": 44.4360, "longitude": 26.0970}
  }
}
```

### 4. Check Point on Route
**POST** `/api/routes/check-point`

Check if a point is on/near a route.

**Request:**
```json
{
  "point": {"latitude": 44.4300, "longitude": 26.1000},
  "routeStart": {"latitude": 44.4268, "longitude": 26.1025},
  "routeEnd": {"latitude": 44.4378, "longitude": 26.0967},
  "threshold": 2
}
```

## 💾 Caching

Routes are automatically cached for **1 hour** to:
- Reduce API costs
- Improve performance
- Reduce latency

Cache key is based on origin and destination coordinates.

## 🔄 Next Steps: Update Matching Algorithm

The matching algorithm (`services/matchingService.js`) currently uses simple straight-line distance. To use real routes:

1. Update `findMatchingRides` to use `routeService.isPointOnRoute()` instead of the simple `isPointOnRoute()`
2. This will make matching more accurate but slower (due to API calls)
3. Consider batching route calculations or using a hybrid approach

**Example update:**
```javascript
// In matchingService.js
const routeService = require('./routeService');

// Make findMatchingRides async
const findMatchingRides = async (passengerRoute, driverRoutes) => {
  // Use routeService.isPointOnRoute() for real route checking
  // ...
};
```

## 💰 Cost Considerations

- Google Maps Directions API: ~$5 per 1,000 requests
- Routes are cached for 1 hour
- Consider rate limiting for route endpoints
- Monitor usage in Google Cloud Console

## 🐛 Troubleshooting

### "No route found" error
- Check if Directions API is enabled
- Verify API key is correct
- Check coordinates are valid

### "API key not valid" error
- Verify API key in `.env`
- Check API key has Directions API enabled
- Make sure key isn't restricted to specific IPs/domains

### Routes not caching
- Check if `node-cache` is installed
- Verify cache TTL is set correctly

## 📝 Notes

- All endpoints require authentication (JWT token)
- Routes are cached to reduce API costs
- Polyline encoding is used for efficient storage
- Fallback to simple calculation if API fails

