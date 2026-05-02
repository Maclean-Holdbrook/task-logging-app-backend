function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

function errorHandler(error, req, res, next) {
  void req
  void next

  const statusCode = error.statusCode || 500

  res.status(statusCode).json({
    message: error.message || 'Unexpected server error',
    details: error.details || null,
  })
}

export { errorHandler, notFoundHandler }
