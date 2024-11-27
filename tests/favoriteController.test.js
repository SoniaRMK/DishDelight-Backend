//Tests for favorite meals functionality.
const { addFavoriteMeal, getFavoriteMeals, deleteFavoriteMeal } = require('../controllers/favoriteController');
const db = require('../models/db');

jest.mock('../models/db');

describe('Favorite Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFavoriteMeal', () => {
    it('should add a favorite meal successfully', async () => {
      const req = {
        user: { userId: 1 },
        body: { meal_id: '123', meal_name: 'Pizza', image_url: 'image_url' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      db.query.mockResolvedValue();

      await addFavoriteMeal(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO favorite_meals'),
        [1, '123', 'Pizza', 'image_url']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Favorite meal added successfully' });
    });

    it('should handle duplicate favorite meal error', async () => {
      const req = { user: { userId: 1 }, body: { meal_id: '123', meal_name: 'Pizza', image_url: 'image_url' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      db.query.mockRejectedValue({ code: '23505' });

      await addFavoriteMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal already added to favorites' });
    });

    it('should return 400 if required fields are missing', async () => {
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        // Test missing meal_id
        const req = { user: { userId: 1 }, body: { meal_name: 'Pizza', image_url: 'image_url' } };
        await addFavoriteMeal(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Meal ID, name, and image URL are required' });

      });
      
      it('should return 500 for an unexpected error', async () => {
        const req = { user: { userId: 1 }, body: { meal_id: '123', meal_name: 'Pizza', image_url: 'image_url' } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        const mockError = new Error('Unexpected error');
        db.query.mockRejectedValue(mockError);
    
        await addFavoriteMeal(req, res);
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error adding favorite meal',
          error: mockError.message,
        });
      });
  });

  describe('getFavoriteMeals', () => {
    it('should retrieve favorite meals successfully', async () => {
      const req = { user: { userId: 1 } };
      const res = { json: jest.fn() };

      db.query.mockResolvedValue({
        rows: [{ meal_id: '123', meal_name: 'Pizza', image_url: 'image_url', added_at: '2024-11-01' }],
      });

      await getFavoriteMeals(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT meal_id, meal_name'),
        [1]
      );
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([{"added_at": "2024-11-01", "image_url": "image_url", "meal_id": "123", "meal_name": "Pizza"}]));
    });

    it('should return 500 for an unexpected error', async () => {
        const req = { user: { userId: 1 }, body: { meal_id: '123', meal_name: 'Pizza', image_url: 'image_url' } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        const mockError = new Error('Unexpected error');
        db.query.mockRejectedValue(mockError);
    
        await getFavoriteMeals(req, res);
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error retrieving favorite meals',
          error: mockError.message,
        });
      });
  });

  describe('deleteFavoriteMeal', () => {
    it('should delete a favorite meal successfully', async () => {
      const req = { user: { userId: 1 }, params: { meal_id: '123' } };
      const res = { json: jest.fn() };

      db.query.mockResolvedValue({ rowCount: 1 });

      await deleteFavoriteMeal(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM favorite_meals'),
        [1, '123']
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Favorite meal deleted successfully' });
    });

    it('should return 404 if the meal does not exist', async () => {
      const req = { user: { userId: 1 }, params: { meal_id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      db.query.mockResolvedValue({ rowCount: 0 });

      await deleteFavoriteMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Favorite meal not found' });
    });

    it('should return 500 for an unexpected error', async () => {
        const req = { user: { userId: 1 }, params: { meal_id: '123' } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        const mockError = new Error('Unexpected error');
        db.query.mockRejectedValue(mockError);
    
        await deleteFavoriteMeal(req, res);
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error deleting favorite meal',
          error: mockError.message,
        });
      });
  });
});
