/**
 * Seed script — creates tables and inserts a demo school.
 * Usage: node src/seed.js
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  // Connect without database first to create it if needed
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔌 Connected to MySQL');

  // Run schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await conn.query(schema);
  console.log('📦 Schema applied');

  // Insert demo school (ignore if exists)
  const hash = await bcrypt.hash('password123', 10);
  try {
    await conn.execute(
      `INSERT INTO prayag_lplan.schools (name, email, password_hash) VALUES (?, ?, ?)`,
      ['Demo School', 'demo@school.com', hash]
    );
    console.log('🏫 Demo school created (demo@school.com / password123)');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('🏫 Demo school already exists');
    } else {
      throw err;
    }
  }

  await conn.end();
  console.log('✅ Seed complete');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
