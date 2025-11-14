/**
 * Quick diagnostic script to check API key configuration
 */

require('dotenv').config();

console.log('🔍 Checking Google Maps API Key Configuration\n');
console.log('='.repeat(60));

// Check if API key is set
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.log('❌ GOOGLE_MAPS_API_KEY is NOT set in .env file');
  console.log('\n💡 Solution:');
  console.log('   1. Open backend/.env file');
  console.log('   2. Add: GOOGLE_MAPS_API_KEY=your_actual_api_key_here');
  console.log('   3. Use the same key as in frontend/.env (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)');
} else {
  console.log('✅ GOOGLE_MAPS_API_KEY is set');
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   Length: ${apiKey.length} characters`);
  
  if (apiKey === 'your_google_maps_api_key_here' || apiKey.includes('your_')) {
    console.log('\n⚠️  WARNING: API key appears to be a placeholder!');
    console.log('   You need to replace it with your actual API key.');
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📋 Next Steps:');
console.log('   1. Make sure Directions API is enabled in Google Cloud Console');
console.log('   2. Verify API key has no IP/domain restrictions');
console.log('   3. Check API key billing is enabled');
console.log('\n🔗 Google Cloud Console: https://console.cloud.google.com/');

