const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Generates JWT authentication token
 * @function generateToken
 * @param {string} id - User ID to encode in the token
 * @returns {string} JWT token string
 * @description Creates a JWT token with user ID payload
 * Special features:
 * - Uses environment variable for JWT secret with fallback
 * - Sets token expiration to 1 hour for security
 * - Returns signed token for authentication
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1h',
  });
};

/**
 * Registers a new user account
 * @async
 * @function register
 * @param {Object} req - Express request object containing user data and uploaded ID proof file
 * @param {Object} res - Express response object
 * @description Creates a new user account with validation and file upload handling
 * Special features:
 * - Validates input using express-validator
 * - Checks for existing email addresses to prevent duplicates
 * - Requires ID proof document upload for verification
 * - Parses JSON address field if provided as string
 * - Automatically hashes password using User model pre-save hook
 * - Returns user data without password and JWT token for immediate login
 * - Handles file upload errors and validation failures gracefully
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    
    // Check if user already exists before writing, and keep the database unique index as backup.
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone }
      ]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === normalizedEmail
          ? 'User already exists with this email'
          : 'User already exists with this phone number'
      });
    }

    // Check if ID proof file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ID proof document is required'
      });
    }

    // Parse address if it's a string
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address format'
        });
      }
    }

    // Additional address validation
    if (!parsedAddress || !parsedAddress.street || !parsedAddress.city || !parsedAddress.state || !parsedAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'All address fields (street, city, state, zipCode) are required'
      });
    }

    // Validate ZIP code format
    const zipCodeRegex = /^[1-9][0-9]{5}$/;
    if (!zipCodeRegex.test(parsedAddress.zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format. Please enter a 6-digit ZIP code starting with 1-9'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      address: parsedAddress,
      idProof: req.file.path
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'user';
      return res.status(400).json({
        success: false,
        message: field === 'email'
          ? 'User already exists with this email'
          : field === 'phone'
            ? 'User already exists with this phone number'
            : `${field} already exists`
      });
    }

    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Authenticates user login
 * @async
 * @function login
 * @param {Object} req - Express request object containing email and password
 * @param {Object} res - Express response object
 * @description Authenticates user credentials and returns JWT token
 * Special features:
 * - Validates input using express-validator
 * - Uses select('+password') to include password field for comparison (normally excluded)
 * - Compares password using bcrypt comparison method
 * - Checks account suspension status for security
 * - Returns same error message for both invalid email and password (security best practice)
 * - Returns user data without password and JWT token for authentication
 * - Handles authentication failures gracefully
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists and include password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Retrieves current user profile information
 * @async
 * @function getProfile
 * @param {Object} req - Express request object with authenticated user data
 * @param {Object} res - Express response object
 * @description Fetches and returns the authenticated user's profile data
 * Special features:
 * - Uses authenticated user ID from JWT token (req.user.id set by auth middleware)
 * - Returns complete user profile information
 * - Password is automatically excluded due to User schema configuration
 * - Simple and fast operation with minimal error handling
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

/**
 * Updates user profile information
 * @async
 * @function updateProfile
 * @param {Object} req - Express request object with user data and optional profile image file
 * @param {Object} res - Express response object
 * @description Updates user profile with optional profile image upload
 * Special features:
 * - Only updates provided fields (partial updates)
 * - Handles optional profile image file upload
 * - Uses findByIdAndUpdate with validation enabled
 * - Returns updated user data immediately
 * - Supports flexible field updates without requiring all fields
 * - File upload path is automatically saved to profileImage field
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) {
      const normalizedPhone = phone.trim();
      const existingPhoneUser = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: req.user.id }
      });

      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this phone number'
        });
      }

      updateData.phone = normalizedPhone;
    }
    if (address) updateData.address = address;
    
    // Handle profile image upload
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: field === 'phone' ? 'User already exists with this phone number' : `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

/**
 * Changes user password with current password verification
 * @async
 * @function changePassword
 * @param {Object} req - Express request object containing current and new passwords
 * @param {Object} res - Express response object
 * @description Securely changes user password after verifying current password
 * Special features:
 * - Requires current password for verification (security best practice)
 * - Uses select('+password') to include password field for comparison
 * - Verifies current password before allowing change
 * - Uses direct assignment and save() to trigger password hashing pre-save hook
 * - Returns success message without sensitive data
 * - Handles password verification failures with appropriate error messages
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

/**
 * Adds money to user's wallet
 * @async
 * @function addToWallet
 * @param {Object} req - Express request object containing amount to add
 * @param {Object} res - Express response object
 * @description Adds specified amount to user's wallet balance with transaction record
 * Special features:
 * - Validates amount is positive number
 * - Creates transaction record for audit trail
 * - Updates wallet balance atomically
 * - Returns updated user data
 */
const addToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { 'wallet.balance': amount },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: amount,
            description: `Wallet top-up of ₹${amount}`,
            date: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      data: { 
        user,
        newBalance: user.wallet.balance
      }
    });

  } catch (error) {
    console.error('Add to wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding to wallet'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  addToWallet
};
