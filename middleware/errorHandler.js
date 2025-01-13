const { AppError } = require("../utils/errors");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Extract value from error message
  const field = Object.keys(err.keyPattern)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // This is specifically for Mongoose validation errors
  if (!err.errors) {
    // If we don't have Mongoose's err.errors property, keep the original message
    return new AppError(err.message || "Validation Error", 400);
  }

  try {
    const errors = Object.values(err.errors).map(
      (e) => e.message || "Invalid input"
    );
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
  } catch (error) {
    return new AppError(err.message || "Validation Error", 400);
  }
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, res) => {
  console.error("Error:", err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

const errorHandler = (err, req, res, next) => {
  console.error("Original Error:", err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error._message = err._message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // Distinguish between Mongoose validation errors and custom ValidationError
    if (error.name === "ValidationError") {
      // If it's a Mongoose validation error, `_message` is usually "Validation failed"
      if (error._message === "Validation failed") {
        error = handleValidationErrorDB(error);
      } else {
        // Otherwise, it's your custom ValidationError: keep the original message
        error = new AppError(error.message, error.statusCode || 400);
      }
    }

    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
