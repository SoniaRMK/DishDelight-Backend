/**
 * Middleware to handle unexpected errors globally.
 *
 * @param {Error} err - The error object containing details about the error.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function in the stack.
 */
exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An unexpected error occurred' });
  };
  