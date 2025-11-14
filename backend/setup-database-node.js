/**
 * Database Setup Script (Node.js)
 * Creates database and runs schema
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('\n🗄️  Setting up database...\n');

  // First, connect without database to create it
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || 3306)
  };

  try {
    console.log('Connecting to MySQL server...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server\n');

    // Create database
    const dbName = process.env.DB_NAME || 'carshare_db';
    console.log(`Creating database '${dbName}'...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created/verified\n`);

    // Select database
    await connection.query(`USE \`${dbName}\``);
    console.log(`Using database '${dbName}'...\n`);

    // Read and execute SQL script
    const sqlPath = path.join(__dirname, 'config', 'database.sql');
    console.log('Reading SQL schema file...');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements (remove CREATE DATABASE and USE statements)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          // Use query() instead of execute() for DDL statements
          await connection.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${i + 1}/${statements.length}: Table already exists (skipped)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    // Verify tables were created
    console.log('\nVerifying tables...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    await connection.end();
    console.log('\n✅ Database setup complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database setup failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your MySQL credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 MySQL server is not running or not accessible');
      console.error('   Start MySQL service and try again');
    }
    
    process.exit(1);
  }
}

setupDatabase();

