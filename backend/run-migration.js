const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'carshare_db',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_rider_searches_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration...');
    
    // Execute migration
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Tables created:');
    console.log('   - rider_searches');
    console.log('   - rider_search_matches');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE' && error.sqlMessage.includes('users')) {
      console.error('⚠️  Make sure the users table exists first!');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigration();

