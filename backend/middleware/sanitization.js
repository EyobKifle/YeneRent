import validator from 'validator';

/**
 * Middleware to sanitize request data to prevent injection attacks
 */
export const sanitizeData = (req, res, next) => {
  // Function to recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Trim whitespace
        obj[key] = obj[key].trim();

        // Escape HTML to prevent XSS
        obj[key] = validator.escape(obj[key]);

        // Remove potential SQL injection patterns (basic)
        obj[key] = obj[key].replace(/['";\\]/g, '');

        // Remove script tags
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }

  // Sanitize route parameters
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Enhanced validation middleware for business rules
 */
export const validateBusinessRules = (req, res, next) => {
  const errors = [];

  // Validate lease dates (end date must be after start date)
  if (req.body.startDate && req.body.endDate) {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }

    // Check if lease duration is reasonable (not more than 5 years)
    const durationMs = endDate - startDate;
    const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
    if (durationMs > fiveYearsMs) {
      errors.push('Lease duration cannot exceed 5 years');
    }
  }

  // Validate payment amounts (must be positive)
  if (req.body.amount && req.body.amount <= 0) {
    errors.push('Payment amount must be positive');
  }

  // Validate rent amounts (must be reasonable)
  if (req.body.rentAmount && req.body.rentAmount <= 0) {
    errors.push('Rent amount must be positive');
  }

  if (req.body.rent && req.body.rent <= 0) {
    errors.push('Rent must be positive');
  }

  // Validate unit numbers (should be alphanumeric)
  if (req.body.unitNumber && !/^[a-zA-Z0-9\s\-]+$/.test(req.body.unitNumber)) {
    errors.push('Unit number can only contain letters, numbers, spaces, and hyphens');
  }

  // Validate email format if provided
  if (req.body.email && !validator.isEmail(req.body.email)) {
    errors.push('Invalid email format');
  }

  // Validate phone format if provided (basic validation)
  if (req.body.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(req.body.phone)) {
    errors.push('Invalid phone number format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors
    });
  }

  next();
};

export default { sanitizeData, validateBusinessRules };
