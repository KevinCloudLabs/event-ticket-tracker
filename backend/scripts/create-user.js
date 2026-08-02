// Bootstrap script for creating a user. Run manually — there is no public signup endpoint.
// Usage: DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... node scripts/create-user.js <email> <password> [name] [role]
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const [, , email, password, name = null, role = 'user'] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-user.js <email> <password> [name] [role]');
  process.exit(1);
}

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
      console.error('Failed to hash password:', err);
      db.end();
      process.exit(1);
    }

    const sql = 'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)';
    db.query(sql, [email, hash, name, role], (err, result) => {
      if (err) {
        console.error('Failed to create user:', err);
        db.end();
        process.exit(1);
      }
      console.log(`User created: id=${result.insertId} email=${email} role=${role}`);
      db.end();
    });
  });
});
