const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('./app');
const { Pool } = require('pg');

// Mock environment variables
process.env.JWT_SECRET = 'test_secret';

// Mock the Pool class from pg
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const pool = new Pool();

describe('API Endpoints', () => {
  const generateToken = (userId = 1) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    token = generateToken();
  });

  // Helper to make requests with token authorization
  const setupRequest = (method, endpoint, body) =>
    request(app)[method](endpoint).set('Authorization', `Bearer ${token}`).send(body);

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Welcome to DishDelight!');
    });
  });

  describe('POST /register', () => {
    it('should register a user successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, username: 'testuser', email: 'test@example.com' }] });
      const res = await setupRequest('post', '/register', { username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('User registered successfully');
    });

    it('should handle missing fields', async () => {
      const res = await setupRequest('post', '/register', { username: 'testuser', password: 'password123' });
      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Error registering user');
    });
  });

  describe('POST /login', () => {
    it('should login a user successfully', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, email: 'test@example.com', password_hash: hashedPassword }] });

      const res = await setupRequest('post', '/login', { email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Login successful');
      expect(res.body.token).toBeDefined();
    });

    it('should return 400 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await setupRequest('post', '/login', { email: 'invalid@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Invalid email or password');
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      const res = await setupRequest('post', '/login', { email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Error logging in');
    });

    it('should return 403 if token verification fails', async () => {
      token = 'invalid_token';

      const res = await setupRequest('get', '/favorites');

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Forbidden - Invalid token');
    });
  });

  describe('POST /favorites', () => {
    it('should add a favorite meal', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await setupRequest('post', '/favorites', { meal_id: 1, meal_name: 'Pizza', image_url: 'https://example.com/pizza.jpg' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Favorite meal added successfully');
    });

    it.each([
      [{ meal_name: 'Pasta', image_url: 'http://example.com/pasta.jpg' }, 'meal_id'],
      [{ meal_id: '123', image_url: 'http://example.com/pasta.jpg' }, 'meal_name'],
      [{ meal_id: '123', meal_name: 'Pasta' }, 'image_url'],
    ])('should return 400 if %s is missing', async (body) => {
      const res = await setupRequest('post', '/favorites', body);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Meal ID, name, and image URL are required');
    });

    it('should return 409 if the meal is already in favorites', async () => {
      pool.query.mockRejectedValueOnce({ code: '23505' });
      const res = await setupRequest('post', '/favorites', { meal_id: '123', meal_name: 'Pasta', image_url: 'http://example.com/pasta.jpg' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toEqual('Meal already added to favorites');
    });

    it('should handle other database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      const res = await setupRequest('post', '/favorites', { meal_id: '123', meal_name: 'Pasta', image_url: 'http://example.com/pasta.jpg' });

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Error adding favorite meal');
    });

    it('should return 403 if req.user is missing', async () => {
      // Mock jwt.verify to return null, simulating a missing req.user
      jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
        callback(null, null); // Simulate token verification without setting req.user
      });

      const res = await setupRequest('get', '/favorites');

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Forbidden - user not authenticated');

      // Restore the original implementation of jwt.verify
      jwt.verify.mockRestore();
    });

    it('should return 401 if token is missing', async () => {
      // Invalidate token by not providing it in the request header
      const res = await request(app).get('/favorites'); // No token set

      expect(res.statusCode).toEqual(401); // Unauthorized due to missing token
      expect(res.body.message).toEqual('Unauthorized');
    });
  });

  describe('GET /favorites', () => {
    it('should retrieve favorite meals', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ meal_id: 1, meal_name: 'Pizza', image_url: 'https://example.com/pizza.jpg', added_at: '2022-01-01' }],
      });

      const res = await setupRequest('get', '/favorites');
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].meal_name).toEqual('Pizza');
    });

    it('should handle retrieval errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      const res = await setupRequest('get', '/favorites');

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Error retrieving favorite meals');
    });
  });

  describe('DELETE /favorites/:meal_id', () => {
    it('should delete a favorite meal', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await setupRequest('delete', '/favorites/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Favorite meal deleted successfully');
    });

    it('should return 404 if meal not found', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await setupRequest('delete', '/favorites/999');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Favorite meal not found');
    });

    it('should handle deletion errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      const res = await setupRequest('delete', '/favorites/123');

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Error deleting favorite meal');
    });
  });
});
