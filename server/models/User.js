const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      minlength: [5, 'Street address must be at least 5 characters'],
      maxlength: [100, 'Street address cannot exceed 100 characters'],
      match: [/^[a-zA-Z0-9\s\-#.,\/]+$/, 'Street address contains invalid characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City must be at least 2 characters'],
      maxlength: [50, 'City cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      minlength: [2, 'State must be at least 2 characters'],
      maxlength: [50, 'State cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s]+$/, 'State can only contain letters and spaces']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit ZIP code']
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
      match: [/^[a-zA-Z\s]+$/, 'Country can only contain letters and spaces']
    }
  },
  idProof: {
    type: String,
    required: [true, 'ID proof is required']
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  wallet: {
    balance: { type: Number, default: 1000 }, // Starting with 1000 for demo
    transactions: [{
      type: { type: String, enum: ['credit', 'debit'] },
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now },
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
    }]
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  stats: {
    itemsListed: { type: Number, default: 0 },
    itemsBorrowed: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

/**
 * Password hashing middleware before saving user
 * @function pre-save hook
 * @param {Function} next - Mongoose next function
 * @description Automatically hashes password before saving to database
 * Special features:
 * - Only hashes password if it has been modified
 * - Uses bcrypt with salt rounds of 12 for security
 * - Handles hashing errors gracefully
 * - Prevents password re-hashing on every save
 */
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Password comparison method for authentication
 * @async
 * @function comparePassword
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} True if password matches, false otherwise
 * @description Compares plain text password with hashed password in database
 * Special features:
 * - Uses bcrypt.compare for secure password verification
 * - Returns boolean result for authentication logic
 * - Handles async password comparison
 */
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update rating method
userSchema.methods.updateRating = function (newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
};

module.exports = mongoose.model('User', userSchema);
