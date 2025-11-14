/**
 * Backend Setup Script
 * Helps configure and test the backend setup
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🚀 Backend Setup Wizard\n');
  console.log('This script will help you configure your backend.\n');

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Read env.example as template
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    // Default template
    envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=carshare_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=carshare_super_secret_jwt_key_change_this_in_production_2025
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8081
`;
  }

  console.log('\n📝 Database Configuration\n');
  console.log('Please enter your MySQL credentials:');

  const dbHost = await question(`Database Host [localhost]: `) || 'localhost';
  const dbUser = await question(`Database User [root]: `) || 'root';
  const dbPassword = await question(`Database Password (press Enter if no password): `) || '';
  const dbName = await question(`Database Name [carshare_db]: `) || 'carshare_db';
  const dbPort = await question(`Database Port [3306]: `) || '3306';

  console.log('\n🔐 JWT Configuration\n');
  const jwtSecret = await question(`JWT Secret [random secret will be generated]: `) || 
    `carshare_jwt_secret_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('\n🌐 Server Configuration\n');
  const port = await question(`Server Port [3000]: `) || '3000';
  const corsOrigin = await question(`CORS Origin [http://localhost:8081]: `) || 'http://localhost:8081';

  // Replace values in template
  envContent = envContent.replace(/DB_HOST=.*/g, `DB_HOST=${dbHost}`);
  envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${dbUser}`);
  envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${dbPassword}`);
  envContent = envContent.replace(/DB_NAME=.*/g, `DB_NAME=${dbName}`);
  envContent = envContent.replace(/DB_PORT=.*/g, `DB_PORT=${dbPort}`);
  envContent = envContent.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);
  envContent = envContent.replace(/PORT=.*/g, `PORT=${port}`);
  envContent = envContent.replace(/CORS_ORIGIN=.*/g, `CORS_ORIGIN=${corsOrigin}`);

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!\n');

  // Test connection
  console.log('🔍 Testing database connection...\n');
  const testConnection = await question('Would you like to test the database connection now? (y/n): ');
  
  if (testConnection.toLowerCase() === 'y') {
    rl.close();
    console.log('\nRunning connection test...\n');
    require('./test-connection.js');
  } else {
    rl.close();
    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Test database connection: node test-connection.js');
    console.log('2. Set up database schema: See SETUP.md');
    console.log('3. Start server: npm run dev\n');
  }
}

setup().catch(err => {
  console.error('Setup error:', err);
  rl.close();
  process.exit(1);
});

