const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  pricing: {
    dailyPrice: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    lenderEarnings: { type: Number, required: true }
  },
  payment: {
    depositPaid: { type: Boolean, default: false },
    depositRefunded: { type: Boolean, default: false },
    finalPaymentMade: { type: Boolean, default: false },
    lenderPaid: { type: Boolean, default: false }
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  returnCondition: {
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'damaged'] },
    notes: String,
    images: [String],
    damageCharges: { type: Number, default: 0 }
  },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

/**
 * Date validation middleware before saving booking
 * @function pre-save hook
 * @param {Function} next - Mongoose next function
 * @description Validates that end date is after start date
 * Special features:
 * - Prevents booking creation with invalid date ranges
 * - Throws error if start date is not before end date
 * - Ensures data integrity for booking dates
 */
// Validate dates
bookingSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

/**
 * Calculates booking pricing based on rental period
 * @function calculatePricing
 * @param {number} dailyPrice - Daily rental price of the item
 * @description Calculates total rental cost and updates pricing object
 * Special features:
 * - Calculates total rental days using date difference
 * - Uses Math.ceil to round up partial days
 * - Calculates subtotal as dailyPrice * totalDays
 * - Updates booking pricing object with calculated values
 * - Handles date calculations in milliseconds
 */
// Simple rent calculation
bookingSchema.methods.calculatePricing = function(dailyPrice,itemValue, depositPercentage) {
  const totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  const subtotal = dailyPrice * totalDays;
  const depositAmount = Math.round((itemValue * depositPercentage) / 100);
  const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
  const totalAmount = subtotal + depositAmount + platformFee;
  const lenderEarnings = subtotal - platformFee;

  this.pricing = {
    dailyPrice,
    totalDays,
    subtotal,
    depositAmount,
    platformFee,
    totalAmount,
    lenderEarnings
  };
};

// Add timeline entry
bookingSchema.methods.addTimelineEntry = function(status, note = '') {
  this.timeline.push({
    status,
    note,
    timestamp: new Date()
  });
};

module.exports = mongoose.model('Booking', bookingSchema);
