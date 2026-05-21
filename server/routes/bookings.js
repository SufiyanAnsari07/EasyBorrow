const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  addBookingMessage
} = require('../controllers/bookingController');

const router = express.Router();

/**
 * Validation rules for booking creation
 * @description Express-validator rules for booking endpoints
 * Special features:
 * - itemId: Valid MongoDB ObjectId format
 * - startDate: Valid ISO8601 date format
 * - endDate: Valid ISO8601 date format
 */
// Validation rules
const bookingValidation = [
  body('itemId')
    .isMongoId()
    .withMessage('Please provide a valid item ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
];

/**
 * Validation rules for booking status updates
 * @description Validates booking status changes
 * Special features:
 * - Status: Must be one of approved, cancelled, active, completed
 */
const statusUpdateValidation = [
  body('status')
    .isIn(['approved', 'rejected', 'cancelled', 'active', 'completed'])
    .withMessage('Please provide a valid status')
];

/**
 * Validation rules for booking messages
 * @description Validates message content for booking conversations
 * Special features:
 * - Message: 1-500 characters, trimmed
 */
const messageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
];

/**
 * Booking routes configuration
 * @description Defines all booking-related endpoints
 * Special features:
 * - All routes require authentication
 * - POST /: Create new booking with validation
 * - GET /: Get user's bookings with filtering
 * - GET /:id: Get specific booking details
 * - PUT /:id/status: Update booking status with validation
 * - POST /:id/messages: Add message to booking conversation
 */
// All routes require authentication
router.use(auth);

// Routes
router.post('/', bookingValidation, createBooking);
router.get('/', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/status', statusUpdateValidation, updateBookingStatus);
router.post('/:id/messages', messageValidation, addBookingMessage);

module.exports = router;
