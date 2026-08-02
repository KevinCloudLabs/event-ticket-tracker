// Runs every .sql file in db/migrations against the configured database, in filename order.
// Usage: DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... node scripts/migrate.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

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

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const runNext = (i) => {
    if (i >= files.length) {
      console.log('Migrations complete.');
      db.end();
      return;
    }

    const file = files[i];
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    console.log(`Running ${file}...`);
    db.query(sql, (err) => {
      if (err) {
        console.error(`Failed on ${file}:`, err);
        db.end();
        process.exit(1);
      }
      runNext(i + 1);
    });
  };

  runNext(0);
});
