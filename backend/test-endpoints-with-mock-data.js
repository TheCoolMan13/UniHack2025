/**
 * Test all endpoints with mock data
 */
require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

let authToken = null;
let testUserId = null;
let testRideId = null;

// Mock data
const mockUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'test123456',
  role: 'both',
};

const mockRide = {
  pickup_latitude: 45.76304775748015,
  pickup_longitude: 21.245893444865942,
  pickup_address: 'Bulevardul Take Ionescu 83, Timișoara, Romania',
  dropoff_latitude: 45.741436702210976,
  dropoff_longitude: 21.227345298975706,
  dropoff_address: 'Strada Ghirlandei 4, Timișoara 300231, Romania',
  schedule_days: ['monday', 'tuesday', 'wednesday'],
  schedule_time: '8:00 AM',
  price: 15.50,
  available_seats: 3,
};

const mockSearch = {
  pickup_latitude: 45.76304775748015,
  pickup_longitude: 21.245893444865942,
  dropoff_latitude: 45.741436702210976,
  dropoff_longitude: 21.227345298975706,
  schedule_days: ['tuesday'],
  schedule_time: '8:37 PM',
};

async function testEndpoint(name, testFn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${name}`);
  console.log('='.repeat(60));
  try {
    await testFn();
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    console.error(`❌ ${name} - FAILED`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

async function registerAndLogin() {
  // Register
  const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, mockUser);
  if (registerResponse.data.success) {
    authToken = registerResponse.data.data.token;
    testUserId = registerResponse.data.data.user.id;
    console.log('✅ Registered and logged in');
    return;
  }
  
  // If registration fails, try login
  const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: mockUser.email,
    password: mockUser.password,
  });
  if (loginResponse.data.success) {
    authToken = loginResponse.data.data.token;
    testUserId = loginResponse.data.data.user.id;
    console.log('✅ Logged in with existing user');
  } else {
    throw new Error('Failed to register or login');
  }
}

async function testCreateRide() {
  const response = await axios.post(
    `${API_BASE_URL}/rides`,
    mockRide,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  if (response.data.success) {
    testRideId = response.data.data.ride.id;
    console.log(`   Created ride ID: ${testRideId}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
  } else {
    throw new Error('Failed to create ride');
  }
}

async function testGetMyRides() {
  const response = await axios.get(
    `${API_BASE_URL}/rides?role=driver`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log(`   Found ${response.data.data.rides.length} rides`);
  console.log(`   Response:`, JSON.stringify(response.data, null, 2));
  
  if (!response.data.success) {
    throw new Error('Failed to get rides');
  }
}

async function testGetActiveRides() {
  const response = await axios.get(
    `${API_BASE_URL}/rides/active`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log(`   Found ${response.data.data.rides.length} active rides`);
  console.log(`   Response:`, JSON.stringify(response.data, null, 2));
  
  if (!response.data.success) {
    throw new Error('Failed to get active rides');
  }
}

async function testSearchRides() {
  const response = await axios.post(
    `${API_BASE_URL}/rides/search`,
    mockSearch,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log(`   Found ${response.data.data.matches.length} matches`);
  console.log(`   Response:`, JSON.stringify(response.data, null, 2));
  
  if (!response.data.success) {
    throw new Error('Failed to search rides');
  }
}

async function testGetRideDetails() {
  if (!testRideId) {
    throw new Error('No ride ID available');
  }
  
  const response = await axios.get(
    `${API_BASE_URL}/rides/${testRideId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log(`   Ride details:`, JSON.stringify(response.data, null, 2));
  
  if (!response.data.success) {
    throw new Error('Failed to get ride details');
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Endpoint Tests with Mock Data\n');
  
  try {
    // Step 1: Register/Login
    await testEndpoint('Register/Login', registerAndLogin);
    
    // Step 2: Create a ride
    await testEndpoint('POST /api/rides (Create Ride)', testCreateRide);
    
    // Step 3: Get my rides
    await testEndpoint('GET /api/rides?role=driver (Get My Rides)', testGetMyRides);
    
    // Step 4: Get active rides
    await testEndpoint('GET /api/rides/active (Get Active Rides)', testGetActiveRides);
    
    // Step 5: Search rides
    await testEndpoint('POST /api/rides/search (Search Rides)', testSearchRides);
    
    // Step 6: Get ride details
    await testEndpoint('GET /api/rides/:id (Get Ride Details)', testGetRideDetails);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TESTS FAILED');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

runAllTests();

