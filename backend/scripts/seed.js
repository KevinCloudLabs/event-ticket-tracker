// Runs a single SQL file against the configured database. Unlike migrate.js, this is
// never run automatically — seed files can contain DROP TABLE, so they must be invoked
// explicitly and deliberately.
// Usage: DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... node scripts/seed.js db/seed/events_clients_tickets.sql
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const relativePath = process.argv[2];

if (!relativePath) {
  console.error('Usage: node scripts/seed.js <path-to-sql-file>');
  process.exit(1);
}

const filePath = path.join(__dirname, '..', relativePath);
const sql = fs.readFileSync(filePath, 'utf8');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  console.log(`Running ${relativePath}...`);
  db.query(sql, (err) => {
    if (err) {
      console.error('Seed failed:', err);
      db.end();
      process.exit(1);
    }
    console.log('Seed complete.');
    db.end();
  });
});
