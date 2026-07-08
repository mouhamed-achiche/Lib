module.exports = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Log error securely (without exposing sensitive data in production)
  console.error(isDev ? err : `[${err.name || 'Error'}] ${err.message}`, isDev ? err.stack : '')
  
  const status = err.statusCode || 500;
  
  // Don't expose sensitive error details in production
  let message = err.message || 'Internal Server Error';
  if (!isDev && status === 500) {
    message = 'Internal Server Error';
  }
  
  res.status(status).json({ 
    success: false, 
    message,
    ...(isDev && { error: err.message })
  });
};
