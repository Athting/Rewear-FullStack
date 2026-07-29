const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log detailed error for developers
  console.error('API Error:', err);

  // Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id of ${err.value}`
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate field value entered: ${field}. Please use another value.`
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Fallback to Server fault
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server error occurred'
  });
};

export default errorHandler;
