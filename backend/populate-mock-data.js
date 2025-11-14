/**
 * Populate Database with Mock Data from Timisoara, Romania
 * Creates 50 test users, each with exactly 5 rides
 */

require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

// Timisoara, Romania locations (real coordinates)
const TIMISOARA_LOCATIONS = [
  // City center and main areas
  { name: "Piata Unirii", lat: 45.7536, lng: 21.2257 },
  { name: "Piata Victoriei", lat: 45.7489, lng: 21.2083 },
  { name: "Gara Timisoara Nord", lat: 45.7608, lng: 21.2264 },
  { name: "Aeroportul Timisoara", lat: 45.8097, lng: 21.3378 },
  { name: "Universitatea Politehnica", lat: 45.7478, lng: 21.2261 },
  { name: "Iulius Town", lat: 45.7600, lng: 21.2400 },
  { name: "Complexul Studentesc", lat: 45.7400, lng: 21.2200 },
  { name: "Spitalul Municipal", lat: 45.7500, lng: 21.2100 },
  { name: "Parcul Rozelor", lat: 45.7450, lng: 21.2300 },
  { name: "Centrul Civic", lat: 45.7550, lng: 21.2150 },
  { name: "Fabric", lat: 45.7350, lng: 21.2050 },
  { name: "Mehala", lat: 45.7400, lng: 21.2000 },
  { name: "Freidorf", lat: 45.7300, lng: 21.2400 },
  { name: "Giroc", lat: 45.7000, lng: 21.2500 },
  { name: "Dumbravita", lat: 45.8000, lng: 21.2500 },
  { name: "Ghiroda", lat: 45.7800, lng: 21.3000 },
  { name: "Sagului", lat: 45.7200, lng: 21.1800 },
  { name: "Circumvalatiunii", lat: 45.7500, lng: 21.1900 },
  { name: "Bulevardul Revolutiei", lat: 45.7480, lng: 21.2080 },
  { name: "Strada Eugeniu de Savoya", lat: 45.7520, lng: 21.2220 },
];

// Days of week
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Time slots (morning commute times) - More variety
const TIME_SLOTS = [
  '6:00 AM', '6:15 AM', '6:30 AM', '6:45 AM',
  '7:00 AM', '7:15 AM', '7:30 AM', '7:45 AM',
  '8:00 AM', '8:15 AM', '8:30 AM', '8:45 AM',
  '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM',
  // Afternoon times
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM',
  // Evening times
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM',
  '7:00 PM', '7:15 PM', '7:30 PM', '7:45 PM',
  '8:00 PM', '8:30 PM',
];

// Price range (in RON - Romanian Leu)
const MIN_PRICE = 5;
const MAX_PRICE = 25;

// Rating range
const MIN_RATING = 3.5;
const MAX_RATING = 5.0;

// Available seats
const SEATS_OPTIONS = [1, 2, 3, 4];

/**
 * Generate random number between min and max
 */
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random subset of array
 */
function randomSubset(array, min = 1, max = null) {
  const count = max ? randomInt(min, max) : randomInt(min, array.length);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Format time with slight variation
 */
function getRandomTime() {
  return randomElement(TIME_SLOTS);
}

/**
 * Get random days (mostly weekdays, some weekends)
 */
function getRandomDays() {
  if (Math.random() > 0.2) {
    // 80% chance of weekdays only
    return randomSubset(WEEKDAYS, 3, 5);
  } else {
    // 20% chance of including weekends
    return randomSubset(DAYS, 2, 4);
  }
}

/**
 * Get random price
 */
function getRandomPrice() {
  return parseFloat((randomBetween(MIN_PRICE, MAX_PRICE)).toFixed(2));
}

/**
 * Get random rating
 */
function getRandomRating() {
  return parseFloat((randomBetween(MIN_RATING, MAX_RATING)).toFixed(2));
}

/**
 * Get random location with slight variation
 */
function getRandomLocation() {
  const base = randomElement(TIMISOARA_LOCATIONS);
  // Add small random offset (up to 2km)
  const latOffset = randomBetween(-0.018, 0.018); // ~2km
  const lngOffset = randomBetween(-0.018, 0.018);
  
  return {
    name: base.name,
    lat: parseFloat((base.lat + latOffset).toFixed(8)),
    lng: parseFloat((base.lng + lngOffset).toFixed(8)),
    address: `${base.name}, Timisoara, Romania`
  };
}

/**
 * Clear existing test data
 */
async function clearTestData() {
  try {
    console.log('🗑️  Clearing existing test data...');
    
    // Delete rides from test users
    await db.execute(`
      DELETE FROM rides 
      WHERE driver_id IN (
        SELECT id FROM users WHERE name LIKE 'TEST_USER_%'
      )
    `);
    
    // Delete test users
    await db.execute(`DELETE FROM users WHERE name LIKE 'TEST_USER_%'`);
    
    console.log('✅ Test data cleared');
  } catch (error) {
    console.error('Error clearing test data:', error.message);
    throw error;
  }
}

/**
 * Create a test user
 */
async function createTestUser(userNumber) {
  const name = `TEST_USER_${userNumber}`;
  const email = `test_user_${userNumber}@timisoara.test`;
  const password = 'test123456'; // Same password for all test users
  const passwordHash = await bcrypt.hash(password, 10);
  const phone = `+407${randomInt(10000000, 99999999)}`;
  const rating = getRandomRating();
  const role = 'driver'; // All test users are drivers
  
  try {
    const [result] = await db.execute(
      `INSERT INTO users (email, password_hash, name, phone, role, rating, verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, name, phone, role, rating, true]
    );
    
    return result.insertId;
  } catch (error) {
    console.error(`Error creating user ${name}:`, error.message);
    throw error;
  }
}

/**
 * Create rides for a user
 */
async function createRidesForUser(userId, userNumber) {
  const rides = [];
  
  for (let i = 1; i <= 5; i++) {
    const pickup = getRandomLocation();
    let dropoff = getRandomLocation();
    
    // Ensure pickup and dropoff are different
    while (pickup.name === dropoff.name) {
      dropoff = getRandomLocation();
    }
    
    const scheduleDays = getRandomDays();
    const scheduleTime = getRandomTime();
    const price = getRandomPrice();
    const availableSeats = randomElement(SEATS_OPTIONS);
    
    try {
      const [result] = await db.execute(
        `INSERT INTO rides (
          driver_id, pickup_latitude, pickup_longitude, pickup_address,
          dropoff_latitude, dropoff_longitude, dropoff_address,
          schedule_days, schedule_time, price, available_seats, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          userId,
          pickup.lat,
          pickup.lng,
          pickup.address,
          dropoff.lat,
          dropoff.lng,
          dropoff.address,
          JSON.stringify(scheduleDays),
          scheduleTime,
          price,
          availableSeats
        ]
      );
      
      rides.push({
        id: result.insertId,
        pickup: pickup.address,
        dropoff: dropoff.address,
        time: scheduleTime,
        days: scheduleDays.length
      });
    } catch (error) {
      console.error(`Error creating ride ${i} for user ${userNumber}:`, error.message);
      throw error;
    }
  }
  
  return rides;
}

/**
 * Main function to populate database
 */
async function populateDatabase() {
  const MAX_USERS = 50;
  
  try {
    console.log('🚀 Starting database population...\n');
    
    // Clear existing test data
    await clearTestData();
    
    console.log(`\n📝 Creating ${MAX_USERS} test users with 5 rides each...\n`);
    
    const allUsers = [];
    
    for (let i = 1; i <= MAX_USERS; i++) {
      try {
        // Create user
        const userId = await createTestUser(i);
        console.log(`✅ Created TEST_USER_${i} (ID: ${userId})`);
        
        // Create 5 rides for this user
        const rides = await createRidesForUser(userId, i);
        console.log(`   └─ Created 5 rides`);
        
        allUsers.push({
          userId,
          userNumber: i,
          rides: rides.length
        });
        
        // Small delay to avoid overwhelming the database
        if (i % 10 === 0) {
          console.log(`   Progress: ${i}/${MAX_USERS} users created\n`);
        }
      } catch (error) {
        console.error(`❌ Failed to create user ${i}:`, error.message);
        // Continue with next user
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 POPULATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Users created: ${allUsers.length}`);
    console.log(`✅ Total rides created: ${allUsers.length * 5}`);
    console.log(`✅ Location: Timisoara, Romania`);
    console.log(`✅ All users are drivers with ratings between ${MIN_RATING}-${MAX_RATING}`);
    console.log(`✅ Prices range: ${MIN_PRICE}-${MAX_PRICE} RON`);
    console.log('\n💡 Test user credentials:');
    console.log('   Email: test_user_1@timisoara.test');
    console.log('   Password: test123456');
    console.log('   (Same password for all test users)');
    console.log('\n✅ Database population completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error populating database:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateDatabase };

