// Standardized response handler middleware
const responseHandler = (req, res, next) => {
  // Success response helper
  res.success = (data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Error response helper
  res.error = (message = 'Internal Server Error', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error: details,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Paginated response helper
  res.paginated = (data, pagination, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  next();
};

module.exports = responseHandler;