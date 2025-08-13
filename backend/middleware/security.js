const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
};

// General API rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again after 15 minutes.'
);

// Auth endpoints rate limiter (more restrictive)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again after 15 minutes.'
);

// Post creation rate limiter
const postLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 posts per minute
  'Too many posts created, please wait a moment before creating another.'
);

// Expert registration rate limiter
const expertRegistrationLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 expert registrations per hour
  'Too many expert registration attempts, please try again later.'
);

// Security headers middleware
const securityHeaders = helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize common XSS patterns
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove HTML tags and dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  postLimiter,
  expertRegistrationLimiter,
  securityHeaders,
  sanitizeInput
};