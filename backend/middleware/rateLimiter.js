const rateLimit = require('express-rate-limit');

// Helper function to create custom rate limiters
exports.createLimiter = (max, windowMinutes) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for application submissions
exports.applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 applications per hour
  message: 'Too many application submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification limiter
exports.emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 email requests per 15 minutes
  message: 'Too many email requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin action limiter
exports.adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 admin actions per minute
  message: 'Too many admin requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
