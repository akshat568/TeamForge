/**
 * Error Handler Middleware
 * Centralized error handling for the Express application
 */

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * 404 Not Found Middleware
 * Handles requests to undefined routes
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
