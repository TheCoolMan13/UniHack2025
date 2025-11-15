# Testing Driver Recommendation System

## Overview
This guide explains how to test the enhanced driver recommendation system that matches passenger routes with driver routes.

## API Endpoint
**POST** `/api/matching/search`

**Authentication:** Required (Bearer token)

## Request Body
```json
{
  "pickup_latitude": 44.4268,
  "pickup_longitude": 26.1025,
  "dropoff_latitude": 44.4378,
  "dropoff_longitude": 26.0967,
  "schedule_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "schedule_time": "7:30 AM"
}
```

## Response Structure
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": 1,
        "driver_id": 5,
        "driver_name": "John Doe",
        "driver_rating": 4.5,
        "matchScore": 85,
        "reasons": [
          "Perfect route alignment",
          "Time matches",
          "Days match",
          "Minimal detour (+1.2km)"
        ],
        "pickupDistance": 0.5,
        "dropoffDistance": 0.3,
        "isValidOrder": true,
        "detourDistance": 1.2,
        "detourDuration": 3,
        "originalRoute": {
          "distance": 13.1,
          "duration": 20
        },
        "recommendedRoute": {
          "distance": 14.3,
          "duration": 23,
          "polyline": "...",
          "legs": [
            {
              "distance": 5.2,
              "duration": 8,
              "startLocation": { "latitude": 44.4200, "longitude": 26.1000 },
              "endLocation": { "latitude": 44.4268, "longitude": 26.1025 }
            },
            {
              "distance": 3.1,
              "duration": 5,
              "startLocation": { "latitude": 44.4268, "longitude": 26.1025 },
              "endLocation": { "latitude": 44.4378, "longitude": 26.0967 }
            },
            {
              "distance": 6.0,
              "duration": 10,
              "startLocation": { "latitude": 44.4378, "longitude": 26.0967 },
              "endLocation": { "latitude": 44.4500, "longitude": 26.0900 }
            }
          ]
        },
        "price": 15.00,
        "available_seats": 2,
        "pickupLocation": {
          "latitude": 44.4200,
          "longitude": 26.1000
        },
        "dropoffLocation": {
          "latitude": 44.4500,
          "longitude": 26.0900
        },
        "schedule": {
          "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
          "time": "7:30 AM"
        }
      }
    ],
    "count": 1
  }
}
```

## Key Features Tested

### 1. Route Order Verification
- ✅ Verifies that passenger pickup comes before dropoff along driver's route
- ✅ Uses route polyline to determine exact positions
- ✅ Flags invalid order with warning in reasons

### 2. Recommended Route Calculation
- ✅ Calculates complete route: Driver Origin → Passenger Pickup → Passenger Dropoff → Driver Destination
- ✅ Includes all route legs with distances and durations
- ✅ Provides polyline for map visualization

### 3. Detour Metrics
- ✅ Calculates extra distance driver must travel
- ✅ Calculates extra time driver must spend
- ✅ Compares against original route

### 4. Match Scoring
- ✅ Perfect alignment (both on route + correct order): 40 points
- ✅ Both on route: 30 points
- ✅ Time match: 25 points
- ✅ Day match: 15 points
- ✅ Minimal detour bonus: +5 points
- ✅ Large detour penalty: -5 points
- ✅ Invalid order penalty: -15 points

## Test Scenarios

### Scenario 1: Perfect Match
- Driver route: C → D
- Passenger route: A → B (where A and B are on route C→D, and A comes before B)
- Expected: High match score, recommended route calculated

### Scenario 2: Invalid Order
- Driver route: C → D
- Passenger route: B → A (where A and B are on route, but B comes after A)
- Expected: Lower match score, warning about route order

### Scenario 3: Near Route
- Driver route: C → D
- Passenger route: A → B (where A and B are within 5km of route)
- Expected: Moderate match score, no recommended route if order invalid

### Scenario 4: Time Mismatch
- Driver route: C → D at 7:30 AM
- Passenger route: A → B at 9:00 AM
- Expected: Lower match score, "Time close" instead of "Time matches"

## Testing with cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Search for matches
curl -X POST http://localhost:3000/api/matching/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "pickup_latitude": 44.4268,
    "pickup_longitude": 26.1025,
    "dropoff_latitude": 44.4378,
    "dropoff_longitude": 26.0967,
    "schedule_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "schedule_time": "7:30 AM"
  }'
```

## Testing with Postman/Insomnia

1. Create a POST request to `http://localhost:3000/api/matching/search`
2. Add header: `Authorization: Bearer YOUR_TOKEN`
3. Add header: `Content-Type: application/json`
4. Add body with pickup/dropoff coordinates and schedule
5. Send request and review matches

## Notes

- The system uses Google Maps Directions API for accurate route calculation
- Routes are cached for 1 hour to reduce API calls
- Set `USE_REAL_ROUTES=false` in `.env` to disable real route checking (uses approximations)
- Match score threshold is 30 - matches below this are not returned
- Matches are sorted by score (highest first)

