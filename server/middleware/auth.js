const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware for JWT token validation
 * @async
 * @function auth
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @description Validates JWT tokens and authenticates users for protected routes
 * Special features:
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT token using environment secret with fallback
 * - Fetches user data excluding password field for security
 * - Checks account suspension status for security
 * - Sets authenticated user data in req.user for use in routes
 * - Handles token validation errors gracefully
 * - Returns appropriate error messages for different failure scenarios
 * - Prevents access to suspended accounts
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '8e3ueuyz82ze32i');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '8e3ueuyz82ze32i');
    const user = await User.findById(decoded.id).select('-password');

    if (user && !user.isSuspended) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication.'
    });
  }
};

module.exports = { auth, optionalAuth, adminAuth };
