const db = require('../models/db');

/**
 * Adds a meal to the logged-in user's list of favorite meals.
 *
 * @param {Object} req - The Express request object containing `meal_id`, `meal_name`, and `image_url`.
 * @param {Object} res - The Express response object.
 */
exports.addFavoriteMeal = async (req, res) => {
  const { meal_id, meal_name, image_url } = req.body;

  if (!meal_id || !meal_name || !image_url) {
    return res.status(400).json({ message: 'Meal ID, name, and image URL are required' });
  }

  try {
    await db.query(
      'INSERT INTO favorite_meals (user_id, meal_id, meal_name, image_url) VALUES ($1, $2, $3, $4)',
      [req.user.userId, meal_id, meal_name, image_url]
    );
    res.status(201).json({ message: 'Favorite meal added successfully' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Meal already added to favorites' });
    }
    res.status(500).json({ message: 'Error adding favorite meal', error: error.message });
  }
};

/**
 * Retrieves the logged-in user's list of favorite meals.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
exports.getFavoriteMeals = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT meal_id, meal_name, image_url, added_at FROM favorite_meals WHERE user_id = $1',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving favorite meals', error: error.message });
  }
};

/**
 * Deletes a specific meal from the logged-in user's list of favorite meals.
 *
 * @param {Object} req - The Express request object containing the `meal_id` in the URL parameters.
 * @param {Object} res - The Express response object.
 */
exports.deleteFavoriteMeal = async (req, res) => {
  const { meal_id } = req.params;

  try {
    const result = await db.query(
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
};
