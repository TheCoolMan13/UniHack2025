/**
 * Test script for Driver Recommendation System
 * Tests the enhanced matching algorithm with mock data
 * Run with: node test-matching-recommendations.js
 */

require('dotenv').config();

// Force enable real routes for testing
process.env.USE_REAL_ROUTES = 'true';

const path = require('path');
const { findMatchingRides } = require(path.join(__dirname, 'services', 'matchingService'));

// Mock driver routes (Bucharest area)
const mockDriverRoutes = [
  {
    id: 1,
    driver_id: 1,
    driver_name: 'John Doe',
    driver_rating: 4.5,
    pickupLocation: {
      latitude: 44.4268, // University Square
      longitude: 26.1025
    },
    dropoffLocation: {
      latitude: 44.4515, // Herastrau Park
      longitude: 26.0853
    },
    schedule: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      time: '7:30 AM'
    },
    price: 15.00,
    available_seats: 2
  },
  {
    id: 2,
    driver_id: 2,
    driver_name: 'Jane Smith',
    driver_rating: 4.8,
    pickupLocation: {
      latitude: 44.4200, // Near University Square
      longitude: 26.1000
    },
    dropoffLocation: {
      latitude: 44.4500, // Near Herastrau
      longitude: 26.0900
    },
    schedule: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      time: '7:45 AM'
    },
    price: 12.00,
    available_seats: 3
  },
  {
    id: 3,
    driver_id: 3,
    driver_name: 'Bob Johnson',
    driver_rating: 4.2,
    pickupLocation: {
      latitude: 44.4300, // Different area
      longitude: 26.1100
    },
    dropoffLocation: {
      latitude: 44.4600, // Different destination
      longitude: 26.1000
    },
    schedule: {
      days: ['monday', 'wednesday', 'friday'],
      time: '8:00 AM'
    },
    price: 18.00,
    available_seats: 1
  }
];

// Mock passenger route (wants to go from point A to B along driver's route)
const mockPassengerRoute = {
  pickupLocation: {
    latitude: 44.4378, // Calea Victoriei (on route between University Square and Herastrau)
    longitude: 26.0967
  },
  dropoffLocation: {
    latitude: 44.4450, // Closer to Herastrau (on route)
    longitude: 26.0880
  },
  schedule: {
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    time: '7:30 AM'
  }
};

async function testMatchingRecommendations() {
  console.log('🧪 Testing Driver Recommendation System\n');
  console.log('='.repeat(70));
  
  console.log('\n📋 Test Setup:');
  console.log(`   Passenger Route:`);
  console.log(`   - Pickup: (${mockPassengerRoute.pickupLocation.latitude}, ${mockPassengerRoute.pickupLocation.longitude})`);
  console.log(`   - Dropoff: (${mockPassengerRoute.dropoffLocation.latitude}, ${mockPassengerRoute.dropoffLocation.longitude})`);
  console.log(`   - Schedule: ${mockPassengerRoute.schedule.days.join(', ')} at ${mockPassengerRoute.schedule.time}`);
  console.log(`\n   Driver Routes: ${mockDriverRoutes.length}`);
  mockDriverRoutes.forEach((route, idx) => {
    console.log(`   ${idx + 1}. ${route.driver_name} (Rating: ${route.driver_rating})`);
    console.log(`      From: (${route.pickupLocation.latitude}, ${route.pickupLocation.longitude})`);
    console.log(`      To: (${route.dropoffLocation.latitude}, ${route.dropoffLocation.longitude})`);
    console.log(`      Schedule: ${route.schedule.days.join(', ')} at ${route.schedule.time}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n🔍 Running Matching Algorithm...\n');

  try {
    const startTime = Date.now();
    const matches = await findMatchingRides(mockPassengerRoute, mockDriverRoutes);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`✅ Matching completed in ${responseTime}ms\n`);
    console.log('='.repeat(70));
    console.log(`\n📊 Results: Found ${matches.length} match(es)\n`);

    if (matches.length === 0) {
      console.log('⚠️  No matches found. This could mean:');
      console.log('   - No driver routes align with passenger route');
      console.log('   - Match scores are below threshold (30 points)');
      console.log('   - Google Maps API key might not be configured');
      return;
    }

    // Display each match
    matches.forEach((match, index) => {
      console.log(`${'='.repeat(70)}`);
      console.log(`\n🎯 Match #${index + 1}: ${match.driver_name}`);
      console.log(`   Driver ID: ${match.driver_id}`);
      console.log(`   Rating: ${match.driver_rating} ⭐`);
      console.log(`   Match Score: ${match.matchScore}/100`);
      console.log(`   Price: $${match.price}`);
      console.log(`   Available Seats: ${match.available_seats}`);

      console.log(`\n   📍 Route Alignment:`);
      console.log(`   - Pickup Distance: ${match.pickupDistance !== null ? match.pickupDistance.toFixed(2) + ' km' : 'N/A'}`);
      console.log(`   - Dropoff Distance: ${match.dropoffDistance !== null ? match.dropoffDistance.toFixed(2) + ' km' : 'N/A'}`);
      console.log(`   - Valid Route Order: ${match.isValidOrder ? '✅ Yes' : '❌ No'}`);

      console.log(`\n   ✅ Match Reasons:`);
      match.reasons.forEach(reason => {
        console.log(`      • ${reason}`);
      });

      if (match.recommendedRoute) {
        console.log(`\n   🗺️  Recommended Route:`);
        console.log(`   - Total Distance: ${match.recommendedRoute.distanceText || match.recommendedRoute.distance.toFixed(2) + ' km'}`);
        console.log(`   - Total Duration: ${match.recommendedRoute.durationText || Math.round(match.recommendedRoute.duration) + ' min'}`);
        console.log(`   - Route Legs: ${match.recommendedRoute.legs.length}`);

        if (match.recommendedRoute.legs.length > 0) {
          console.log(`\n   📍 Route Breakdown:`);
          match.recommendedRoute.legs.forEach((leg, legIndex) => {
            console.log(`      ${legIndex + 1}. ${leg.from || 'Leg ' + (legIndex + 1)} → ${leg.to || 'Next'}`);
            console.log(`         Distance: ${leg.distance.toFixed(2)} km, Duration: ${Math.round(leg.duration)} min`);
          });
        }

        if (match.originalRoute) {
          console.log(`\n   📊 Route Comparison:`);
          console.log(`   - Original Route: ${match.originalRoute.distanceText || match.originalRoute.distance.toFixed(2) + ' km'} in ${match.originalRoute.durationText || Math.round(match.originalRoute.duration) + ' min'}`);
          console.log(`   - With Passenger: ${match.recommendedRoute.distanceText || match.recommendedRoute.distance.toFixed(2) + ' km'} in ${match.recommendedRoute.durationText || Math.round(match.recommendedRoute.duration) + ' min'}`);
          
          if (match.detourDistance !== undefined) {
            console.log(`   - Detour: +${match.detourDistance.toFixed(2)} km (+${match.detourDuration} min)`);
          }
        }

        if (match.recommendedRoute.polyline) {
          console.log(`\n   🗺️  Polyline: ${match.recommendedRoute.polyline.substring(0, 50)}...`);
        }
      } else {
        console.log(`\n   ⚠️  No recommended route calculated (order may be invalid or points not on route)`);
      }

      console.log('');
    });

    console.log('='.repeat(70));
    console.log('\n✅ Test completed successfully!\n');

    // Summary
    console.log('📈 Summary:');
    console.log(`   - Total matches: ${matches.length}`);
    console.log(`   - Best match: ${matches[0]?.driver_name} (Score: ${matches[0]?.matchScore})`);
    console.log(`   - Matches with recommended routes: ${matches.filter(m => m.recommendedRoute).length}`);
    console.log(`   - Matches with valid order: ${matches.filter(m => m.isValidOrder).length}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    console.error('\nStack trace:', error.stack);
    
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
      console.error('\n💡 Tip: Make sure GOOGLE_MAPS_API_KEY is set in your .env file');
    }
    
    if (error.message.includes('Failed to calculate route') || error.message.includes('ZERO_RESULTS')) {
      console.error('\n💡 Tip: Check your Google Maps API key has Directions API enabled');
      console.error('   Also verify the coordinates are valid locations');
    }

    if (error.message.includes('REQUEST_DENIED')) {
      console.error('\n💡 Tip: Your Google Maps API key may not have the required permissions');
      console.error('   Make sure Directions API is enabled in Google Cloud Console');
    }
  }
}

// Run the test
console.log('🚀 Starting Driver Recommendation System Test\n');
testMatchingRecommendations().catch(console.error);

