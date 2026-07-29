import { validationResult, body } from 'express-validator';

// Standard validator runner
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// User Registration checks
export const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('username').notEmpty().withMessage('Username is required').trim(),
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('locationName').notEmpty().withMessage('Location is required').trim(),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude coordinate is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude coordinate is required'),
  validate
];

// User Login checks
export const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Listing Validation checks
export const listingValidation = [
  body('title').notEmpty().withMessage('Clothing Title is required').trim(),
  body('description').notEmpty().withMessage('Description is required').trim(),
  body('category').notEmpty().withMessage('Category is required').trim(),
  body('brand').notEmpty().withMessage('Brand is required').trim(),
  body('size').notEmpty().withMessage('Size is required').trim(),
  body('condition').isIn(['New with Tags', 'Like New', 'Good', 'Fair']).withMessage('Invalid clothing condition'),
  body('color').notEmpty().withMessage('Color is required').trim(),
  body('material').notEmpty().withMessage('Material is required').trim(),
  body('swapValue').isInt({ min: 1 }).withMessage('Swap value must be a positive number'),
  body('locationName').notEmpty().withMessage('Location name is required').trim(),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  validate
];
