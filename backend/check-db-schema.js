require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    
    try {
      const [columns] = await conn.execute('DESCRIBE rides');
      console.log('\nRides table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    } catch (e) {
      console.error('Rides table does not exist or error:', e.message);
    }
    
    await conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkSchema();

