// Centralized error handler. Routes can either throw/pass errors to next(err),
// or keep their existing try/catch + res.status(...).json(...) pattern — this
// is a safety net for anything that isn't already handled, and a single place
// to standardize the response shape going forward.

function errorHandler(err, req, res, next) {
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
}

// Catches requests to routes that don't exist
function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
