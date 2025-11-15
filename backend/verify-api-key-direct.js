/**
 * Direct test of Google Maps API key
 */
require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

console.log('🔍 Testing Google Maps API Key Directly\n');
console.log('='.repeat(60));

if (!apiKey) {
  console.log('❌ API key not found in environment');
  process.exit(1);
}

console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`   Length: ${apiKey.length} characters\n`);

console.log('📍 Testing Directions API...\n');

client.directions({
  params: {
    origin: '44.4268,26.1025',
    destination: '44.4378,26.0967',
    key: apiKey,
    mode: 'driving',
  },
})
  .then((response) => {
    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      console.log('✅ Directions API is working!');
      console.log(`   Distance: ${leg.distance.text}`);
      console.log(`   Duration: ${leg.duration.text}`);
      console.log(`   Status: ${response.data.status}`);
    } else {
      console.log(`❌ API returned status: ${response.data.status}`);
      console.log(`   Error message: ${response.data.error_message || 'No error message'}`);
    }
  })
  .catch((error) => {
    console.log('❌ Error calling Directions API:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Status Text: ${error.response.statusText}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 403) {
        console.log('\n💡 403 Forbidden usually means:');
        console.log('   1. Directions API is not enabled');
        console.log('   2. API key has restrictions');
        console.log('   3. Billing is not enabled');
        console.log('\n🔗 Enable Directions API: https://console.cloud.google.com/apis/library/directions-backend.googleapis.com');
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
  });

