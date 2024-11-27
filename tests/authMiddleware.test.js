//Tests for authenticateToken.
const { authenticateToken } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  it('should authenticate a valid token', () => {
    const req = { headers: { authorization: 'Bearer validToken' } };
    const res = {};
    const next = jest.fn();

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 1 });
    });

    authenticateToken(req, res, next);

    expect(req.user).toEqual({ userId: 1 });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 403 for an invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalidToken' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'));
    });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden - Invalid token' });
  });
});
