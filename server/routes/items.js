const express = require('express');
const { body } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadItemImages, handleUploadError } = require('../middleware/upload');
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getUserItems,
  getCategories,
  extendRentalPeriod
} = require('../controllers/itemController');

const router = express.Router();

/**
 * Validation rules for item creation and updates
 * @description Express-validator rules for item endpoints
 * Special features:
 * - Title: 3-100 characters, trimmed
 * - Description: 10-1000 characters, trimmed
 * - Category: Must be from predefined list
 * - Daily price: Minimum ₹1, float validation
 * - Item value: Minimum ₹100, float validation
 * - Deposit percentage: 10-100%, float validation
 */
// Validation rules
const itemValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['electronics', 'books', 'tools', 'sports', 'photography', 'gadgets', 'furniture', 'vehicles', 'appliances', 'musical-instruments', 'others'])
    .withMessage('Please select a valid category'),
  body('dailyPrice')
    .isFloat({ min: 1 })
    .withMessage('Daily price must be at least ₹1'),
  body('itemValue')
    .isFloat({ min: 100 })
    .withMessage('Item value must be at least ₹100'),
  body('depositPercentage')
    .isFloat({ min: 10, max: 100 })
    .withMessage('Deposit percentage must be between 10% and 100%')
];

/**
 * Item routes configuration
 * @description Defines all item-related endpoints
 * Special features:
 * - Public routes: Browse items, categories, and item details
 * - Protected routes: Create, update, delete items (require authentication)
 * - GET /: Get items with search and filtering
 * - GET /categories: Get categories with item counts
 * - GET /:id: Get specific item details
 * - POST /: Create new item with image uploads and validation
 * - PUT /:id: Update item with optional image uploads
 * - DELETE /:id: Delete item (owner only)
 * - GET /user/my-items: Get user's own items
 */
// Public routes
router.get('/', optionalAuth, getItems);
router.get('/categories', getCategories);

// Protected routes
router.post('/', auth, uploadItemImages, handleUploadError, itemValidation, createItem);
router.put('/:id', auth, uploadItemImages, handleUploadError, updateItem);
router.delete('/:id', auth, deleteItem);
router.get('/user/my-items', auth, getUserItems);
router.post('/extend-rental', auth, extendRentalPeriod);
router.get('/:id', getItemById);

module.exports = router;
