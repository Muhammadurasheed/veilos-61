const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  };
};

// Common validation rules
const validationRules = {
  // User validations
  registerUser: [
    body('alias')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Alias must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('avatarIndex')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Avatar index must be between 1 and 12')
  ],

  // Expert validations
  expertRegistration: [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('specialization')
      .isLength({ min: 2, max: 100 })
      .withMessage('Specialization is required'),
    body('bio')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Bio must be between 10 and 1000 characters'),
    body('pricingModel')
      .isIn(['free', 'paid'])
      .withMessage('Pricing model must be free or paid')
  ],

  // Post validations
  createPost: [
    body('content')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Content must be between 1 and 2000 characters'),
    body('feeling')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Feeling must be between 1 and 50 characters'),
    body('topic')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Topic must be between 1 and 100 characters'),
    body('wantsExpertHelp')
      .optional()
      .isBoolean()
      .withMessage('Wants expert help must be a boolean')
  ],

  // Comment validations
  addComment: [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters')
  ],

  // Session validations
  createSession: [
    body('expertId')
      .isLength({ min: 1 })
      .withMessage('Expert ID is required'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Valid scheduled date is required'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 120 })
      .withMessage('Duration must be between 15 and 120 minutes'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
  ],

  // Rating validations
  rateSession: [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('feedback')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Feedback must be less than 1000 characters')
  ]
};

module.exports = { validate, validationRules };