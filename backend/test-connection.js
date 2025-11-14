/**
 * Test MySQL Database Connection
 * Run this to verify your database credentials are correct
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'carshare_db'}`);
  console.log(`  Port: ${process.env.DB_PORT || 3306}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : '(not set)'}\n`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'carshare_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT DATABASE() as current_db, USER() as current_user');
    console.log(`  Current Database: ${rows[0].current_db}`);
    console.log(`  Current User: ${rows[0].current_user}`);
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n  Tables found: ${tables.length}`);
    if (tables.length > 0) {
      console.log('  Table names:');
      tables.forEach(table => {
        console.log(`    - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('  ⚠️  No tables found. Run the database.sql script to create tables.');
    }

    await connection.end();
    console.log('\n✅ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`\nError: ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Possible solutions:');
      console.error('  1. Check your MySQL username and password in .env file');
      console.error('  2. Verify MySQL is running');
      console.error('  3. Try connecting with MySQL Workbench to verify credentials');
      console.error('  4. If using XAMPP/WAMP, default user is "root" with empty password');
      console.error('  5. Reset MySQL root password if needed');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL server is not running or not accessible');
      console.error('  1. Start MySQL service');
      console.error('  2. Check if MySQL is running on the correct port');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database does not exist');
      console.error('  1. Create the database: CREATE DATABASE carshare_db;');
      console.error('  2. Or run the database.sql script');
    }
    
    process.exit(1);
  }
}

testConnection();

