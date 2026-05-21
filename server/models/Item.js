const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Item description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'books', 'tools', 'sports', 'photography', 'gadgets', 'furniture', 'vehicles', 'appliances', 'musical-instruments', 'others']
  },
  dailyPrice: {
    type: Number,
    required: [true, 'Daily price is required'],
    min: [1, 'Daily price must be at least ₹1']
  },
  itemValue: {
    type: Number,
    required: [true, 'Item value is required'],
    min: [100, 'Item value must be at least ₹100']
  },
  depositPercentage: {
    type: Number,
    required: [true, 'Deposit percentage is required'],
    min: [10, 'Deposit percentage must be at least 10%'],
    max: [100, 'Deposit percentage cannot exceed 100%'],
    default: 20
  },
  images: [{
    type: String,
    required: true
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    street: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, trim: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    unavailableDates: [Date],
    minRentalDays: { type: Number, default: 1 },
    maxRentalDays: { type: Number, default: 30 }
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  stats: {
    views: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

/**
 * Virtual field to calculate deposit amount
 * @function depositAmount getter
 * @returns {number} Calculated deposit amount rounded to nearest integer
 * @description Calculates deposit amount based on item value and deposit percentage
 * Special features:
 * - Virtual field not stored in database
 * - Automatically calculated when accessed
 * - Rounds result to nearest integer for currency precision
 * - Uses itemValue and depositPercentage for calculation
 */
// Calculate deposit amount
itemSchema.virtual('depositAmount').get(function() {
  return Math.round((this.itemValue * this.depositPercentage) / 100);
});

/**
 * Updates item rating with new rating value
 * @function updateRating
 * @param {number} newRating - New rating value to add
 * @description Updates average rating and count when new rating is added
 * Special features:
 * - Maintains running average of all ratings
 * - Increments rating count for each new rating
 * - Recalculates average rating dynamically
 * - Handles rating aggregation for item statistics
 */
// Update rating method
itemSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
};

/**
 * Database indexes for optimized query performance
 * @description Creates indexes for efficient searching and filtering
 * Special features:
 * - Text index on title and description for full-text search
 * - Category index for category-based filtering
 * - City index for location-based filtering
 * - Daily price index for price range queries
 * - Rating index for sorting by popularity (descending)
 */
// Indexes for better search performance
itemSchema.index({ title: 'text', description: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ 'location.city': 1 });
itemSchema.index({ dailyPrice: 1 });
itemSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Item', itemSchema);
