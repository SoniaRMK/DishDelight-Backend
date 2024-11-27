const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { errorHandler } = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/users', userRoutes);
app.use('/favorites', favoriteRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;
