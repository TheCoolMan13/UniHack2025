# How to Test Route Calculation

## Quick Test Methods

### Method 1: Using the Test Script (Easiest)

I've created a test script for you. Run it:

```bash
cd backend
node test-route-calculation.js
```

This will:
- ✅ Automatically login/register a test user
- ✅ Test route calculation between 2 points
- ✅ Show distance, duration, and polyline
- ✅ Verify it's using real routes (not straight-line)
- ✅ Test route with waypoints

### Method 2: Manual Testing with Postman/curl

#### Step 1: Get Authentication Token

First, login to get a JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

Copy the `token` from the response.

#### Step 2: Test Route Calculation

```bash
curl -X POST http://localhost:3000/api/routes/calculate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "latitude": 44.4268,
      "longitude": 26.1025
    },
    "destination": {
      "latitude": 44.4378,
      "longitude": 26.0967
    }
  }'
```

### Method 3: Using Postman

1. **Create a new request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/routes/calculate`

2. **Add Headers:**
   - `Authorization`: `Bearer YOUR_TOKEN`
   - `Content-Type`: `application/json`

3. **Add Body (JSON):**
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

4. **Send request**

## What to Look For

### ✅ Success Response Should Include:

```json
{
  "success": true,
  "data": {
    "route": {
      "distance": 2.5,           // Distance in km
      "distanceText": "2.5 km",   // Human-readable
      "duration": 8,              // Duration in minutes
      "durationText": "8 mins",   // Human-readable
      "polyline": "encoded_string_here",  // Encoded route path
      "steps": [...]              // Route segments
    }
  }
}
```

### 🔍 How to Verify It's Using Real Routes

1. **Compare with straight-line distance:**
   - Real route distance should be **longer** than straight-line
   - If they're the same, it's not using real routes

2. **Check the polyline:**
   - Should be a long encoded string
   - If empty or missing, route calculation failed

3. **Check response time:**
   - First request: ~1-3 seconds (API call)
   - Second request (same route): ~50-200ms (cached)

4. **Check server logs:**
   - Should see route calculation logs
   - Should see cache hits on second request

## Test Coordinates (Bucharest, Romania)

```javascript
// Short route
origin: { latitude: 44.4268, longitude: 26.1025 }      // University Square
destination: { latitude: 44.4378, longitude: 26.0967 } // Calea Victoriei

// Longer route
origin: { latitude: 44.4268, longitude: 26.1025 }      // University Square
destination: { latitude: 44.4515, longitude: 26.0853 } // Herastrau Park
```

## Common Issues

### ❌ "No route found"
- **Check**: Directions API is enabled in Google Cloud Console
- **Check**: API key is correct in `.env`
- **Check**: Coordinates are valid (lat: -90 to 90, lng: -180 to 180)

### ❌ "Unauthorized" or 401
- **Check**: Token is valid and not expired
- **Check**: Token is in Authorization header: `Bearer TOKEN`

### ❌ Route distance equals straight-line
- **Check**: `USE_REAL_ROUTES=true` in `.env`
- **Check**: API key has Directions API enabled
- **Check**: Server logs for errors

### ❌ Very slow response
- **Normal**: First request takes 1-3 seconds
- **Check**: Routes are being cached (second request should be faster)
- **Check**: API quota not exceeded

## Verify Caching Works

1. **First request:**
   ```bash
   # Note the response time
   curl ... (same as above)
   # Should take ~1-3 seconds
   ```

2. **Second request (same route):**
   ```bash
   # Run the same request again
   curl ... (same as above)
   # Should take ~50-200ms (much faster!)
   ```

3. **Check server logs:**
   - First request: Should see API call
   - Second request: Should see cache hit

## Test Route with Waypoints

```bash
curl -X POST http://localhost:3000/api/routes/calculate-with-waypoints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "latitude": 44.4268,
      "longitude": 26.1025
    },
    "waypoints": [
      {
        "latitude": 44.4300,
        "longitude": 26.1000
      }
    ],
    "destination": {
      "latitude": 44.4378,
      "longitude": 26.0967
    }
  }'
```

## Expected Results

### Real Route vs Straight-Line

**Example:**
- **Straight-line distance**: 1.2 km
- **Real route distance**: 2.5 km
- **Difference**: 1.3 km (this proves it's using real roads!)

If the difference is very small (< 0.1 km), the route might be using straight-line calculation.

## Quick Verification Checklist

- [ ] Server is running
- [ ] API key is in `.env` file
- [ ] Directions API is enabled in Google Cloud Console
- [ ] Can authenticate and get token
- [ ] Route calculation returns distance and duration
- [ ] Route distance > straight-line distance
- [ ] Polyline is present in response
- [ ] Second request is faster (caching works)

## Need Help?

If something doesn't work:
1. Check server logs for errors
2. Verify API key in Google Cloud Console
3. Check `.env` file has `GOOGLE_MAPS_API_KEY`
4. Make sure Directions API is enabled

