const jwt = require('jsonwebtoken');

/**
 * Middleware function to authenticate JWT tokens.
 * Extracts the token from the `Authorization` header, verifies it, 
 * and attaches the decoded user information to `req.user`.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function in the pipeline.
 */
exports.authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden - Invalid token' });
    req.user = user;
    next();
  });
};
