/**
 * Test the search endpoint directly
 */
require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSearchEndpoint() {
  console.log('🧪 Testing Search Endpoint\n');
  console.log('='.repeat(60));

  // First, register a new user
  console.log('\n1️⃣ Registering test user...');
  let token;
  
  try {
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'test123456',
      role: 'both',
    });
    
    if (registerResponse.data.success) {
      token = registerResponse.data.data.token;
      console.log('✅ Registered and logged in');
    } else {
      console.error('❌ Registration failed:', registerResponse.data);
      return;
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      // User exists, try to login
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'test123456',
        });
        if (loginResponse.data.success) {
          token = loginResponse.data.data.token;
          console.log('✅ Logged in with existing user');
        }
      } catch (loginError) {
        console.error('❌ Login also failed:', loginError.response?.data || loginError.message);
        return;
      }
    } else {
      return;
    }
  }

  if (!token) {
    console.error('❌ No token received');
    return;
  }

  // Test search with the same data as frontend
  console.log('\n2️⃣ Testing search endpoint...');
  const searchData = {
    pickup_latitude: 45.76296893389605,
    pickup_longitude: 21.245900820940733,
    dropoff_latitude: 45.76301477789323,
    dropoff_longitude: 21.24587869271636,
    schedule_days: ["monday", "tuesday"],
    schedule_time: "8:32 PM"
  };

  console.log('Search data:', JSON.stringify(searchData, null, 2));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/rides/search`,
      searchData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\n✅ Search successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ Search failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      console.log('Error message:', error.response.data?.message);
      console.log('Error details:', error.response.data?.error);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testSearchEndpoint();

