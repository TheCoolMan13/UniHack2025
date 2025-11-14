/**
 * Update all rides with proper times and ensure no N/A values
 */

require('dotenv').config();
const db = require('./config/database');

// Time slots (morning commute times)
const TIME_SLOTS = [
  '6:00 AM', '6:15 AM', '6:30 AM', '6:45 AM',
  '7:00 AM', '7:15 AM', '7:30 AM', '7:45 AM',
  '8:00 AM', '8:15 AM', '8:30 AM', '8:45 AM',
  '9:00 AM', '9:15 AM', '9:30 AM',
  // Evening times
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM',
  '7:00 PM', '7:15 PM', '7:30 PM',
];

/**
 * Get random element from array
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Update all rides with proper times
 */
async function updateRideTimes() {
  try {
    console.log('🔄 Updating ride times...\n');
    
    // Get all rides
    const [rides] = await db.execute(`
      SELECT id, schedule_time 
      FROM rides 
      WHERE schedule_time IS NULL 
         OR schedule_time = '' 
         OR schedule_time = 'N/A'
         OR schedule_time = 'null'
    `);
    
    if (rides.length === 0) {
      console.log('✅ All rides already have proper times!');
      return;
    }
    
    console.log(`Found ${rides.length} rides with missing or invalid times\n`);
    
    let updated = 0;
    for (const ride of rides) {
      const newTime = randomElement(TIME_SLOTS);
      
      await db.execute(
        'UPDATE rides SET schedule_time = ? WHERE id = ?',
        [newTime, ride.id]
      );
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`   Updated ${updated}/${rides.length} rides...`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} rides with proper times!`);
    
    // Also update all rides to ensure they have valid times (even if they seem valid)
    const [allRides] = await db.execute('SELECT id, schedule_time FROM rides');
    console.log(`\n📊 Total rides in database: ${allRides.length}`);
    
    // Verify all have valid times
    const invalidRides = allRides.filter(r => 
      !r.schedule_time || 
      r.schedule_time === '' || 
      r.schedule_time === 'N/A' ||
      r.schedule_time === 'null'
    );
    
    if (invalidRides.length > 0) {
      console.log(`⚠️  Found ${invalidRides.length} rides still with invalid times, updating...`);
      for (const ride of invalidRides) {
        const newTime = randomElement(TIME_SLOTS);
        await db.execute(
          'UPDATE rides SET schedule_time = ? WHERE id = ?',
          [newTime, ride.id]
        );
      }
      console.log(`✅ Updated remaining ${invalidRides.length} rides`);
    } else {
      console.log('✅ All rides have valid times!');
    }
    
  } catch (error) {
    console.error('❌ Error updating ride times:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  updateRideTimes()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateRideTimes };

