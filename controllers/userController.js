const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

/**
 * Validates if a password meets the required criteria.
 *
 * @param {string} password - The password to validate.
 * @returns {boolean} True if the password is valid, otherwise false.
 */
const isPasswordValid = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+<>])[A-Za-z\d@$!%*?&#^()\-_=+<>]{6,}$/;
  return regex.test(password);
};

/**
 * Registers a new user by hashing the password and storing the user in the database.
 *
 * @param {Object} req - The Express request object containing `username`, `email`, and `password`.
 * @param {Object} res - The Express response object.
 */
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  if (!isPasswordValid(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 6 characters long and include a combination of lowercase, uppercase, number, and special character.',
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

/**
 * Logs in a user by validating the email and password, and returns a JWT token if successful.
 *
 * @param {Object} req - The Express request object containing `email` and `password`.
 * @param {Object} res - The Express response object.
 */
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ message: 'Login successful', token, user: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};
