const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { uploadEvidence, handleUploadError } = require('../middleware/upload');
const {
  createComplaint,
  getUserComplaints,
  getComplaintById,
  addComplaintMessage
} = require('../controllers/complaintController');

const router = express.Router();

// Validation rules
const complaintValidation = [
  body('defendantId')
    .isMongoId()
    .withMessage('Please provide a valid defendant ID'),
  body('type')
    .isIn(['item_damage', 'late_return', 'no_show', 'inappropriate_behavior', 'payment_issue', 'other'])
    .withMessage('Please provide a valid complaint type'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
];

const messageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
];

// All routes require authentication
router.use(auth);

// Routes
router.post('/', uploadEvidence, handleUploadError, complaintValidation, createComplaint);
router.get('/', getUserComplaints);
router.get('/:id', getComplaintById);
router.post('/:id/messages', messageValidation, addComplaintMessage);

module.exports = router;
