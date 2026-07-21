const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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

app.use(cors());
app.use(express.json());

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
  const { event_id, client_id, status, price } = req.body;
  const sql = 'INSERT INTO tickets (event_id, client_id, status, price) VALUES (?, ?, ?, ?)';
  db.query(sql, [event_id, client_id, status, price], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error creating ticket');
      return;
    }
    res.status(201).json({ id: result.insertId, event_id, client_id, status, price });
  });
});

router.put('/tickets/:id/assign', (req, res) => {
  const { id } = req.params;
  const { client_id } = req.body;
  const sql = 'UPDATE tickets SET client_id = ?, status = ? WHERE id = ?';
  db.query(sql, [client_id, 'assigned', id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error assigning ticket');
      return;
    }
    res.json({ id, client_id, status: 'assigned' });
  });
});

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});