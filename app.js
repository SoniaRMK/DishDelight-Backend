const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const cors = require('cors');

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Helper function to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification failed:", err.message); // Log verification errors
      return res.status(403).json({ message: 'Forbidden - Invalid token' });
    }
    req.user = user;
    next();
  });
};

// GET requests
app.get('/', (req, res) => {
    res.send('Welcome to DishDelight!');
  });

// 1. User Registration
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// 2. User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ message: 'Login successful', token, user: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// 3. Add Favorite Meal
app.post('/favorites', authenticateToken, async (req, res) => {
  const { meal_id, meal_name, image_url } = req.body;
  if (!meal_id || !meal_name || !image_url) {
    return res.status(400).json({ message: 'Meal ID, name, and image URL are required' });
  }

  try {
    await pool.query(
      'INSERT INTO favorite_meals (user_id, meal_id, meal_name, image_url) VALUES ($1, $2, $3, $4)',
      [req.user.userId, meal_id, meal_name, image_url]
    );
    res.status(201).json({ message: 'Favorite meal added successfully' });
  } catch (error) {
    if (error.code === '23505') { // 23505 is the unique_violation error code in PostgreSQL
      return res.status(409).json({ message: 'Meal already added to favorites' });
    }
    res.status(500).json({ message: 'Error adding favorite meal', error: error.message });
  }
});

// 4. Get Favorite Meals for the Logged-in User
app.get('/favorites', authenticateToken, async (req, res) => {
  console.log(req.user);
  if (!req.user) {
    return res.status(403).json({ message: 'Forbidden - user not authenticated' });
  }
  try {
    const result = await pool.query(
      'SELECT meal_id, meal_name, image_url, added_at FROM favorite_meals WHERE user_id = $1',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving favorite meals', error: error.message });
  }
});

// 5. Delete Favorite Meal
app.delete('/favorites/:meal_id', authenticateToken, async (req, res) => {
  const { meal_id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM favorite_meals WHERE user_id = $1 AND meal_id = $2',
      [req.user.userId, meal_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Favorite meal not found' });
    }
    res.json({ message: 'Favorite meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting favorite meal', error: error.message });
  }
});

// Export the app for testing
module.exports = app;
