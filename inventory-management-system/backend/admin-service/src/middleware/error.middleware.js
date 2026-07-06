/**
 * errorHandler — Express 4 error handler (4 arguments required).
 * Must be the last middleware registered in app.js.
 */
export const errorHandler = (err, req, res, next) => {
  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Handle Mongoose Cast Errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid format for field ${err.path}`,
    });
  }

  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

/**
 * notFound — catches unmatched routes and forwards a 404 error.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
