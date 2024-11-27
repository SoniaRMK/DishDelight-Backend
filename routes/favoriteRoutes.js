const express = require('express');
const { addFavoriteMeal, getFavoriteMeals, deleteFavoriteMeal } = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Favorite meals routes
router.post('/', authenticateToken, addFavoriteMeal);
router.get('/', authenticateToken, getFavoriteMeals);
router.delete('/:meal_id', authenticateToken, deleteFavoriteMeal);

module.exports = router;
