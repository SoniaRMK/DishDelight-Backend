//Tests for user registration and login functionality.
const { registerUser, loginUser } = require('../controllers/userController');
const db = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../models/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('User Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      const req = {
        body: { username: 'testuser', email: 'test@test.com', password: 'password123' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      bcrypt.hash.mockResolvedValue('hashedPassword');
      db.query.mockResolvedValue({ rows: [{ id: 1, username: 'testuser', email: 'test@test.com' }] });

      await registerUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['testuser', 'test@test.com', 'hashedPassword']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User registered successfully' }));
    });

    it('should handle email already registered error', async () => {
      const req = {
        body: { username: 'testuser', email: 'test@test.com', password: 'password123' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      db.query.mockRejectedValue({ code: '23505' });

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
    });

    it('should return 400 if required fields are missing', async () => {
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
  
        // Test missing username
        let req = { body: { email: 'test@test.com', password: 'password123' } };
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Username, email, and password are required' });
  
        // Test missing email
        req = { body: { username: 'testuser', password: 'password123' } };
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Username, email, and password are required' });
  
        // Test missing password
        req = { body: { username: 'testuser', email: 'test@test.com' } };
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Username, email, and password are required' });
      });

      it('should return 500 for an unexpected error', async () => {
        const req = {
          body: { username: 'testuser', email: 'test@test.com', password: 'password123' },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
  
        const mockError = new Error('Unexpected error');
        db.query.mockRejectedValue(mockError);
  
        await registerUser(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error registering user',
          error: mockError.message,
        });
      });

  });

  describe('loginUser', () => {
    it('should log in a user successfully and return a token', async () => {
      const req = {
        body: { email: 'test@test.com', password: 'password123' },
      };
      const res = {
        json: jest.fn(),
      };

      db.query.mockResolvedValue({ rows: [{ user_id: 1, password_hash: 'hashedPassword' }] });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fakeToken');

      await loginUser(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '5h' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fakeToken' }));
    });

    it('should return 401 for invalid credentials', async () => {
      const req = { body: { email: 'test@test.com', password: 'wrongpassword' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      db.query.mockResolvedValue({ rows: [{ password_hash: 'hashedPassword' }] });
      bcrypt.compare.mockResolvedValue(false);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Test missing email
    let req = { body: { password: 'password123' } };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });

    // Test missing password
    req = { body: { email: 'test@test.com' } };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
  });

  it('should return 500 for an unexpected error', async () => {
    const req = {
      body: { email: 'test@test.com', password: 'password123' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockError = new Error('Unexpected error');
    db.query.mockRejectedValue(mockError);

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error logging in',
      error: mockError.message,
    });
  });
});
