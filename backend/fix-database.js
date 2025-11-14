/**
 * Database Connection Fixer
 * Helps diagnose and fix database connection issues
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection(config) {
  try {
    const connection = await mysql.createConnection(config);
    await connection.end();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

async function fixDatabase() {
  console.log('\n🔧 Database Connection Fixer\n');
  console.log('Current configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'carshare_db'}`);
  console.log(`  Port: ${process.env.DB_PORT || 3306}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '*** (set)' : '(not set)'}\n`);

  // Test current configuration
  console.log('Testing current configuration...');
  const currentConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'carshare_db',
    port: parseInt(process.env.DB_PORT || 3306)
  };

  let result = await testConnection(currentConfig);
  
  if (result.success) {
    console.log('✅ Connection successful with current configuration!\n');
    rl.close();
    return;
  }

  console.log('❌ Connection failed!\n');
  console.log(`Error: ${result.error.message}\n`);

  // Try different configurations
  console.log('Let\'s try to find the correct configuration...\n');

  // Try 1: No password (XAMPP/WAMP default)
  console.log('Trying with empty password (XAMPP/WAMP default)...');
  const configNoPassword = { ...currentConfig, password: '' };
  result = await testConnection(configNoPassword);
  
  if (result.success) {
    console.log('✅ Success with empty password!\n');
    const update = await question('Update .env file to use empty password? (y/n): ');
    if (update.toLowerCase() === 'y') {
      await updateEnvFile('DB_PASSWORD', '');
      console.log('✅ .env file updated!\n');
    }
    rl.close();
    return;
  }

  // Try 2: Ask for password
  console.log('❌ Empty password didn\'t work.\n');
  console.log('Please enter your MySQL root password:');
  const password = await question('Password (press Enter to skip): ');
  
  if (password) {
    const configWithPassword = { ...currentConfig, password };
    result = await testConnection(configWithPassword);
    
    if (result.success) {
      console.log('✅ Success with provided password!\n');
      const update = await question('Update .env file with this password? (y/n): ');
      if (update.toLowerCase() === 'y') {
        await updateEnvFile('DB_PASSWORD', password);
        console.log('✅ .env file updated!\n');
      }
      rl.close();
      return;
    } else {
      console.log('❌ Still failed with provided password.\n');
      console.log(`Error: ${result.error.message}\n`);
    }
  }

  // Try 3: Test without database (to see if MySQL is running)
  console.log('Testing MySQL connection without database...');
  const configNoDb = { ...currentConfig };
  delete configNoDb.database;
  
  result = await testConnection(configNoDb);
  
  if (result.success) {
    console.log('✅ MySQL is running, but database might not exist.\n');
    console.log('Next steps:');
    console.log('1. Create the database: CREATE DATABASE carshare_db;');
    console.log('2. Or run the setup script: See SETUP.md\n');
  } else {
    console.log('❌ Cannot connect to MySQL server.\n');
    console.log('Possible issues:');
    console.log('1. MySQL service is not running');
    console.log('2. Wrong host/port');
    console.log('3. MySQL is not installed\n');
    console.log('To check MySQL service on Windows:');
    console.log('  Get-Service | Where-Object {$_.Name -like "*mysql*"}\n');
  }

  rl.close();
}

async function updateEnvFile(key, value) {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');
  
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}\n`;
  }
  
  fs.writeFileSync(envPath, content);
}

fixDatabase().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});

