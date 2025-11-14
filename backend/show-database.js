/**
 * Show Database Contents
 * Displays all data from the database tables
 */

require('dotenv').config();
const db = require('./config/database');

async function showDatabase() {
  try {
    console.log('\n📊 Database Contents\n');
    console.log('='.repeat(60));

    // Show Users
    console.log('\n👥 USERS TABLE:');
    console.log('-'.repeat(60));
    const [users] = await db.execute('SELECT * FROM users ORDER BY id');
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Phone: ${user.phone || 'N/A'}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Rating: ${user.rating}`);
        console.log(`  Verified: ${user.verified ? 'Yes' : 'No'}`);
        console.log(`  Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Show Rides
    console.log('\n🚗 RIDES TABLE:');
    console.log('-'.repeat(60));
    const [rides] = await db.execute(`
      SELECT r.*, u.name as driver_name 
      FROM rides r 
      LEFT JOIN users u ON r.driver_id = u.id 
      ORDER BY r.id
    `);
    if (rides.length === 0) {
      console.log('No rides found.');
    } else {
      rides.forEach(ride => {
        console.log(`ID: ${ride.id}`);
        console.log(`  Driver: ${ride.driver_name} (ID: ${ride.driver_id})`);
        console.log(`  Pickup: ${ride.pickup_address}`);
        console.log(`    Location: (${ride.pickup_latitude}, ${ride.pickup_longitude})`);
        console.log(`  Dropoff: ${ride.dropoff_address}`);
        console.log(`    Location: (${ride.dropoff_latitude}, ${ride.dropoff_longitude})`);
        console.log(`  Schedule: ${ride.schedule_days} at ${ride.schedule_time}`);
        console.log(`  Price: $${ride.price}`);
        console.log(`  Available Seats: ${ride.available_seats}`);
        console.log(`  Status: ${ride.status}`);
        console.log(`  Created: ${ride.created_at}`);
        console.log('');
      });
    }

    // Show Ride Requests
    console.log('\n📋 RIDE REQUESTS TABLE:');
    console.log('-'.repeat(60));
    const [requests] = await db.execute(`
      SELECT rr.*, 
             u1.name as passenger_name, 
             u2.name as driver_name,
             r.pickup_address as ride_pickup,
             r.dropoff_address as ride_dropoff
      FROM ride_requests rr
      LEFT JOIN users u1 ON rr.passenger_id = u1.id
      LEFT JOIN rides r ON rr.ride_id = r.id
      LEFT JOIN users u2 ON r.driver_id = u2.id
      ORDER BY rr.id
    `);
    if (requests.length === 0) {
      console.log('No ride requests found.');
    } else {
      requests.forEach(request => {
        console.log(`ID: ${request.id}`);
        console.log(`  Ride ID: ${request.ride_id}`);
        console.log(`  Driver: ${request.driver_name || 'N/A'}`);
        console.log(`  Route: ${request.ride_pickup} → ${request.ride_dropoff}`);
        console.log(`  Passenger: ${request.passenger_name} (ID: ${request.passenger_id})`);
        if (request.pickup_address) {
          console.log(`  Passenger Pickup: ${request.pickup_address}`);
        }
        if (request.dropoff_address) {
          console.log(`  Passenger Dropoff: ${request.dropoff_address}`);
        }
        console.log(`  Status: ${request.status}`);
        console.log(`  Created: ${request.created_at}`);
        console.log('');
      });
    }

    // Show Sessions (if any)
    console.log('\n🔐 SESSIONS TABLE:');
    console.log('-'.repeat(60));
    const [sessions] = await db.execute('SELECT * FROM sessions ORDER BY id');
    if (sessions.length === 0) {
      console.log('No sessions found.');
    } else {
      sessions.forEach(session => {
        console.log(`ID: ${session.id}`);
        console.log(`  User ID: ${session.user_id}`);
        console.log(`  Token: ${session.token.substring(0, 50)}...`);
        console.log(`  Expires: ${session.expires_at}`);
        console.log(`  Created: ${session.created_at}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log('-'.repeat(60));
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [rideCount] = await db.execute('SELECT COUNT(*) as count FROM rides');
    const [requestCount] = await db.execute('SELECT COUNT(*) as count FROM ride_requests');
    const [sessionCount] = await db.execute('SELECT COUNT(*) as count FROM sessions');
    
    console.log(`Total Users: ${userCount[0].count}`);
    console.log(`Total Rides: ${rideCount[0].count}`);
    console.log(`Total Ride Requests: ${requestCount[0].count}`);
    console.log(`Total Sessions: ${sessionCount[0].count}`);
    console.log('');

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error showing database:', error);
    process.exit(1);
  }
}

showDatabase();

