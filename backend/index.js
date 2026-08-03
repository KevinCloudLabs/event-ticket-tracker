const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { signToken, requireAuth } = require('./auth');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
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
    return;
  }
  console.log('Connected to MySQL database!');
});

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || 'https://events.kevinlutes.com'
};
app.use(cors(corsOptions));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later.'
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Login failed' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password_hash, (err, matches) => {
      if (err || !matches) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signToken(user);
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    });
  });
});

const router = express.Router();

router.get('/events', (req, res) => {
  db.query('SELECT * FROM events', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching events');
      return;
    }
    res.json(results);
  });
});

router.get('/clients', (req, res) => {
  db.query('SELECT * FROM clients', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching clients');
      return;
    }
    res.json(results);
  });
});

router.get('/tickets', (req, res) => {
  db.query('SELECT * FROM tickets', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching tickets');
      return;
    }
    res.json(results);
  });
});

router.post('/tickets', (req, res) => {
  const { event_id, client_id, status, price, ticket_type } = req.body;

  if (!event_id || !client_id) {
    return res.status(400).json({ error: 'event_id and client_id are required' });
  }
  if (!['available', 'assigned'].includes(status)) {
    return res.status(400).json({ error: "status must be 'available' or 'assigned'" });
  }
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  const sql = 'INSERT INTO tickets (event_id, client_id, status, price, ticket_type) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [event_id, client_id, status, price, ticket_type || 'general'], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error creating ticket');
      return;
    }
    res.status(201).json({ id: result.insertId, event_id, client_id, status, price, ticket_type: ticket_type || 'general' });
  });
});

router.put('/tickets/:id/assign', (req, res) => {
  const { id } = req.params;
  const { client_id, ticket_type } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: 'client_id is required' });
  }

  const sql = ticket_type
    ? 'UPDATE tickets SET client_id = ?, status = ?, purchased_at = CURDATE(), ticket_type = ? WHERE id = ?'
    : 'UPDATE tickets SET client_id = ?, status = ?, purchased_at = CURDATE() WHERE id = ?';
  const params = ticket_type ? [client_id, 'assigned', ticket_type, id] : [client_id, 'assigned', id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error assigning ticket');
      return;
    }
    res.json({ id, client_id, status: 'assigned' });
  });
});

router.get('/reports/client-spend', (req, res) => {
  const sql = `
    SELECT c.id AS client_id, c.name AS client_name, COALESCE(SUM(t.price), 0) AS total_spend
    FROM clients c
    LEFT JOIN tickets t ON t.client_id = c.id AND t.status = 'assigned'
    GROUP BY c.id, c.name
    ORDER BY total_spend DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching client spend');
      return;
    }
    res.json(results);
  });
});

router.get('/reports/spend-over-time', (req, res) => {
  const sql = `
    SELECT DATE_FORMAT(purchased_at, '%Y-%m') AS month, SUM(price) AS total_spend
    FROM tickets
    WHERE status = 'assigned' AND purchased_at IS NOT NULL
    GROUP BY month
    ORDER BY month ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching spend over time');
      return;
    }
    res.json(results);
  });
});

router.get('/reports/avg-ticket-value', (req, res) => {
  const sql = `
    SELECT COALESCE(AVG(price), 0) AS avg_ticket_value
    FROM tickets
    WHERE status = 'assigned'
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching average ticket value');
      return;
    }
    res.json(results[0]);
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use('/api', limiter, requireAuth, router);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
