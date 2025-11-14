/**
 * Create MySQL User for Team Member
 * Run this script to create a user that can access the database from another machine
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

async function createSharedUser() {
  console.log('\n👥 Create Shared Database User\n');
  console.log('This will create a MySQL user that can access the database from another machine.\n');

  try {
    // Connect as root
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || 3306)
    });

    console.log('✅ Connected to MySQL server\n');

    // Get user details
    const username = await question('Enter username for your friend: ') || 'friend_user';
    const password = await question('Enter password for this user: ');
    
    if (!password) {
      console.log('❌ Password is required!');
      rl.close();
      process.exit(1);
    }

    const dbName = process.env.DB_NAME || 'carshare_db';

    console.log('\nCreating user...');

    // Create user (allow from any host '%')
    try {
      await connection.execute(
        `CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`,
        [username, password]
      );
      console.log(`✅ User '${username}' created`);
    } catch (error) {
      if (error.code === 'ER_USER_ALREADY_EXISTS') {
        console.log(`⚠️  User '${username}' already exists, updating password...`);
        await connection.execute(
          `ALTER USER ?@'%' IDENTIFIED BY ?`,
          [username, password]
        );
        console.log(`✅ Password updated for '${username}'`);
      } else {
        throw error;
      }
    }

    // Grant privileges
    await connection.execute(
      `GRANT ALL PRIVILEGES ON ${dbName}.* TO ?@'%'`,
      [username]
    );
    console.log(`✅ Granted privileges on '${dbName}' database`);

    // Flush privileges
    await connection.execute('FLUSH PRIVILEGES');
    console.log('✅ Privileges flushed\n');

    // Get IP address
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = 'localhost';
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipAddress = iface.address;
          break;
        }
      }
      if (ipAddress !== 'localhost') break;
    }

    console.log('📋 Connection Details for Your Friend:');
    console.log('='.repeat(60));
    console.log(`Host: ${ipAddress}`);
    console.log(`Port: ${process.env.DB_PORT || 3306}`);
    console.log(`Database: ${dbName}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  Important Next Steps:');
    console.log('1. Make sure MySQL is configured to accept remote connections');
    console.log('2. Configure Windows Firewall to allow port 3306');
    console.log('3. See SHARE_DATABASE.md for detailed instructions\n');

    await connection.end();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

createSharedUser();

