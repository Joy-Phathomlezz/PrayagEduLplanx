/**
 * Seed script — creates tables and inserts demo schools.
 * Usage: node src/seed.js
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seed() {
  // Connect without database first to create it if needed
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL');

  // Run schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await conn.query(schema);
  console.log('Schema applied');

  // Insert schools
  const schools = [
    { name: 'PrayagEdu School', domain: 'https://demo.prayagedu.com', code: '9999' },
    { name: 'Assam Rifles Public School - Sports', domain: 'https://arpsshillong.prayagedu.com', code: '1980' },
    { name: 'Little Flower', domain: 'https://lfsc.prayagedu.com', code: '9002' },
    { name: 'Assam Rifles Public School - Primary', domain: 'https://arpsshillonglp.prayagedu.com', code: '1981' },
    { name: 'Assam Rifles Public School - Jorhat', domain: 'https://arpsjorhat.prayagedu.com', code: '1982' },
    { name: 'Pine Mount School', domain: 'https://pinemount.prayagedu.com', code: '1900' },
    { name: 'Auxilium Higher Secondary School Mawtnum', domain: 'https://auxilium-n.prayagedu.com', code: '9005' },
    { name: 'Alpha English Higher Secondary School', domain: 'https://alphaschool.prayagedu.com', code: '9007' },
    { name: 'PrayagEdu Local', domain: 'http://192.168.0.135/prayagedu/public', code: '9998' }
  ];

  for (const s of schools) {
    try {
      await conn.execute(
        `INSERT INTO prayag_lplan.schools (name, domain, code) VALUES (?, ?, ?)`,
        [s.name, s.domain, s.code]
      );
      console.log(`School created: ${s.name} (Code: ${s.code})`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`School already exists: ${s.name}`);
      } else {
        throw err;
      }
    }
  }

  await conn.end();
  console.log(' Seed complete');
}

seed().catch((err) => {
  console.error(' Seed failed:', err);
  process.exit(1);
});
