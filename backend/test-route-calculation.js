/**
 * Test script to verify route calculation is working correctly
 * Run with: node test-route-calculation.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test coordinates (Bucharest, Romania area)
const TEST_ROUTES = [
  {
    name: 'Short route in Bucharest',
    origin: { latitude: 44.4268, longitude: 26.1025 }, // University Square
    destination: { latitude: 44.4378, longitude: 26.0967 }, // Calea Victoriei
  },
  {
    name: 'Longer route in Bucharest',
    origin: { latitude: 44.4268, longitude: 26.1025 }, // University Square
    destination: { latitude: 44.4515, longitude: 26.0853 }, // Herastrau Park
  },
];

async function testRouteCalculation() {
  console.log('🧪 Testing Route Calculation\n');
  console.log('='.repeat(60));

  // First, we need to login to get a token
  console.log('\n1️⃣ Logging in to get authentication token...');
  
  try {
    // Try to register/login a test user
    let token;
    
    try {
      // Try to register
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'test123456',
        role: 'both',
      });
      
      if (registerResponse.data.success) {
        token = registerResponse.data.data.token;
        console.log('✅ Registered test user');
      }
    } catch (registerError) {
      // User might already exist, try to login
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'test123456',
        });
        
        if (loginResponse.data.success) {
          token = loginResponse.data.data.token;
          console.log('✅ Logged in with existing test user');
        }
      } catch (loginError) {
        console.error('❌ Failed to authenticate:', loginError.response?.data || loginError.message);
        console.log('\n💡 Tip: Create a user first using the app or API');
        return;
      }
    }

    if (!token) {
      console.error('❌ No authentication token received');
      return;
    }

    console.log('✅ Authentication successful\n');

    // Test route calculation
    console.log('2️⃣ Testing route calculation endpoints...\n');

    for (const testRoute of TEST_ROUTES) {
      console.log(`📍 Testing: ${testRoute.name}`);
      console.log(`   From: (${testRoute.origin.latitude}, ${testRoute.origin.longitude})`);
      console.log(`   To: (${testRoute.destination.latitude}, ${testRoute.destination.longitude})`);

      try {
        const startTime = Date.now();
        const response = await axios.post(
          `${API_BASE_URL}/routes/calculate`,
          {
            origin: testRoute.origin,
            destination: testRoute.destination,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.data.success) {
          const route = response.data.data.route;
          
          console.log('   ✅ Route calculated successfully!');
          console.log(`   📏 Distance: ${route.distance.toFixed(2)} km (${route.distanceText})`);
          console.log(`   ⏱️  Duration: ${route.duration.toFixed(0)} minutes (${route.durationText})`);
          console.log(`   🗺️  Polyline: ${route.polyline.substring(0, 50)}...`);
          console.log(`   📊 Steps: ${route.steps.length} route segments`);
          console.log(`   ⚡ Response time: ${responseTime}ms`);
          
          // Verify it's a real route (not straight-line)
          const straightLineDistance = calculateStraightLineDistance(
            testRoute.origin.latitude,
            testRoute.origin.longitude,
            testRoute.destination.latitude,
            testRoute.destination.longitude
          );
          
          const routeDistance = route.distance;
          const difference = routeDistance - straightLineDistance;
          
          console.log(`   📐 Straight-line distance: ${straightLineDistance.toFixed(2)} km`);
          console.log(`   🔄 Difference: ${difference.toFixed(2)} km`);
          
          if (difference > 0.1) {
            console.log('   ✅ Verified: Using real route (not straight-line)!');
          } else {
            console.log('   ⚠️  Warning: Route distance very close to straight-line');
          }
        } else {
          console.log('   ❌ Failed:', response.data.message);
        }
      } catch (error) {
        console.log('   ❌ Error:', error.response?.data?.message || error.message);
        if (error.response?.data) {
          console.log('   Details:', JSON.stringify(error.response.data, null, 2));
        }
      }

      console.log('');
    }

    // Test route with waypoints
    console.log('3️⃣ Testing route with waypoints...\n');
    try {
      const waypointRoute = {
        origin: TEST_ROUTES[0].origin,
        waypoints: [
          { latitude: 44.4300, longitude: 26.1000 },
        ],
        destination: TEST_ROUTES[0].destination,
      };

      console.log('📍 Testing route with 1 waypoint');
      const startTime = Date.now();
      const response = await axios.post(
        `${API_BASE_URL}/routes/calculate-with-waypoints`,
        waypointRoute,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const endTime = Date.now();

      if (response.data.success) {
        const route = response.data.data.route;
        console.log('   ✅ Route with waypoints calculated!');
        console.log(`   📏 Total distance: ${route.distance.toFixed(2)} km`);
        console.log(`   ⏱️  Total duration: ${route.duration.toFixed(0)} minutes`);
        console.log(`   🛣️  Route legs: ${route.legs.length}`);
        console.log(`   ⚡ Response time: ${endTime - startTime}ms`);
      }
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Route calculation test complete!');
    console.log('\n💡 Tips:');
    console.log('   - If routes are cached, second request will be faster');
    console.log('   - Check Google Cloud Console for API usage');
    console.log('   - Verify API key has Directions API enabled');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Helper function to calculate straight-line distance (Haversine formula)
function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
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
}

// Run the test
testRouteCalculation();

