// Creates the database, tables and seed data from database/schema.sql
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });
  try {
    await conn.query(sql);
    console.log('Easyshop database initialised with schema and sample electronics data.');
  } catch (err) {
    console.error('Database initialisation failed:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
