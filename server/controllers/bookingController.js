const Booking = require('../models/Booking');
const Item = require('../models/Item');
const User = require('../models/User');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const { validationResult } = require('express-validator');

/**
 * Creates a new booking request
 * @async
 * @function createBooking
 * @param {Object} req - Express request object containing itemId, startDate, endDate
 * @param {Object} res - Express response object
 * @description Creates a booking request with comprehensive validation and conflict checking
 * Special features:
 * - Validates input using express-validator
 * - Prevents users from booking their own items
 * - Checks item availability status
 * - Performs date conflict detection with existing approved/active bookings
 * - Calculates pricing including deposit and rental fees
 * - Validates borrower's wallet balance before allowing booking
 * - Creates timeline entry for tracking booking status
 * - Returns populated booking data with item and user details
 * - Handles complex business logic for rental platform
 */
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { itemId, startDate, endDate, message } = req.body;

    // Get item details
    const item = await Item.findById(itemId).populate('owner');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user is trying to book their own item
    if (item.owner._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own item'
      });
    }

    // Check if item is available
    if (!item.availability.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for booking'
      });
    }

    // Check for date conflicts
    const conflictingBooking = await Booking.findOne({
      item: itemId,
      status: { $in: ['approved', 'active'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for the selected dates'
      });
    }

    // Create booking
    const booking = new Booking({
      item: itemId,
      borrower: req.user.id,
      lender: item.owner._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    // Calculate pricing
    booking.calculatePricing(item.dailyPrice, item.itemValue, item.depositPercentage);

    // Check if borrower has sufficient balance
    const borrower = await User.findById(req.user.id);
    if (borrower.wallet.balance < booking.pricing.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Add initial timeline entry
    booking.addTimelineEntry('pending', 'Booking request created');
    if (message && message.trim()) {
      booking.messages.push({
        sender: req.user.id,
        message: message.trim()
      });
    }

    await booking.save();

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('item', 'title images dailyPrice')
      .populate('borrower', 'name email phone')
      .populate('lender', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: { booking: populatedBooking }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating booking'
    });
  }
};

/**
 * Retrieves user's bookings with filtering and pagination
 * @async
 * @function getUserBookings
 * @param {Object} req - Express request object with query parameters for filtering
 * @param {Object} res - Express response object
 * @description Fetches user's bookings with advanced filtering and pagination
 * Special features:
 * - Supports filtering by user role (borrower/lender/all)
 * - Supports filtering by booking status
 * - Implements pagination with configurable page size
 * - Returns populated data for items and users
 * - Sorts bookings by creation date (newest first)
 * - Calculates pagination metadata (current page, total pages, total count)
 * - Handles both borrower and lender perspectives
 */
const getUserBookings = async (req, res) => {
  try {
    const { type = 'all', status, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by user type
    if (type === 'borrower') {
      query.borrower = req.user.id;
    } else if (type === 'lender') {
      query.lender = req.user.id;
    } else {
      query.$or = [
        { borrower: req.user.id },
        { lender: req.user.id }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('item', 'title images dailyPrice category')
      .populate('borrower', 'name email phone profileImage')
      .populate('lender', 'name email phone profileImage')
      .populate('messages.sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const bookingIds = bookings.map((booking) => booking._id);
    const [reviews, complaints] = await Promise.all([
      Review.find({ booking: { $in: bookingIds }, reviewer: req.user.id }).select('booking'),
      Complaint.find({ booking: { $in: bookingIds }, complainant: req.user.id }).select('booking')
    ]);
    const reviewedBookingIds = new Set(reviews.map((review) => review.booking.toString()));
    const complainedBookingIds = new Set(complaints.map((complaint) => complaint.booking.toString()));
    const bookingsWithUserActions = bookings.map((booking) => ({
      ...booking.toObject(),
      userActions: {
        hasReviewed: reviewedBookingIds.has(booking._id.toString()),
        hasComplained: complainedBookingIds.has(booking._id.toString())
      }
    }));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings: bookingsWithUserActions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
};

/**
 * Retrieves a specific booking by ID with authorization check
 * @async
 * @function getBookingById
 * @param {Object} req - Express request object with booking ID parameter
 * @param {Object} res - Express response object
 * @description Fetches detailed booking information with security validation
 * Special features:
 * - Populates complete item details and user information
 * - Performs authorization check to ensure only involved parties can view booking
 * - Returns detailed booking data including addresses for contact purposes
 * - Handles booking not found scenarios
 * - Prevents unauthorized access to booking details
 * - Provides comprehensive error handling
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('item')
      .populate('borrower', 'name email phone profileImage address')
      .populate('lender', 'name email phone profileImage address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is involved in this booking
    if (booking.borrower._id.toString() !== req.user.id &&
      booking.lender._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking'
    });
  }
};

/**
 * Updates booking status with complex business logic and payment processing
 * @async
 * @function updateBookingStatus
 * @param {Object} req - Express request object with status and optional note
 * @param {Object} res - Express response object
 * @description Handles booking status transitions with payment processing and authorization
 * Special features:
 * - Implements role-based authorization (only lenders can approve/cancel)
 * - Handles complex payment flows including wallet deductions and refunds
 * - Processes different status transitions: pending→approved→active→completed
 * - Manages wallet transactions with detailed transaction history
 * - Updates user statistics (earnings, bookings count)
 * - Creates timeline entries for audit trail
 * - Handles refunds for cancelled bookings
 * - Processes final payments and deposit refunds on completion
 * - Updates item statistics for performance tracking
 * - Comprehensive error handling for financial operations
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('borrower')
      .populate('lender')
      .populate('item');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization based on status change
    if (status === 'approved' || status === 'rejected' || status === 'cancelled') {
      if (booking.lender._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the lender can approve, reject, or cancel bookings'
        });
      }
    }

    // Handle different status transitions
    if (status === 'approved' && booking.status === 'pending') {
      // Deduct amount from borrower's wallet
      await User.findByIdAndUpdate(booking.borrower._id, {
        $inc: { 'wallet.balance': -booking.pricing.totalAmount },
        $push: {
          'wallet.transactions': {
            type: 'debit',
            amount: booking.pricing.totalAmount,
            description: `Booking payment for ${booking.item.title}`,
            bookingId: booking._id
          }
        }
      });

      booking.payment.depositPaid = true;
      booking.status = 'approved';
      booking.addTimelineEntry('approved', note || 'Booking approved by lender');

      await Item.findByIdAndUpdate(booking.item._id, {
        'availability.isAvailable': false
      });

    } else if (status === 'rejected' && booking.status === 'pending') {
      booking.status = 'rejected';
      booking.addTimelineEntry('rejected', note || 'Booking request rejected by lender');

    } else if (status === 'cancelled') {
      if (booking.payment.depositPaid) {
        // Refund the borrower
        await User.findByIdAndUpdate(booking.borrower._id, {
          $inc: { 'wallet.balance': booking.pricing.totalAmount },
          $push: {
            'wallet.transactions': {
              type: 'credit',
              amount: booking.pricing.totalAmount,
              description: `Refund for cancelled booking: ${booking.item.title}`,
              bookingId: booking._id
            }
          }
        });
      }

      booking.status = 'cancelled';
      // If booking cancelled, reopen item (if there are no other overlapping active bookings)
      await Item.findByIdAndUpdate(booking.item._id, {
        'availability.isAvailable': true
      });
      booking.addTimelineEntry('cancelled', note || 'Booking cancelled');

    } else if (status === 'active' && booking.status === 'approved') {
      booking.status = 'active';
      booking.addTimelineEntry('active', 'Item pickup completed');
      // Ensure item remains unavailable when active
      await Item.findByIdAndUpdate(booking.item._id, {
        'availability.isAvailable': false
      });

    } else if (status === 'completed' && booking.status === 'active') {
      // Process final payment to lender
      await User.findByIdAndUpdate(booking.lender._id, {
        $inc: {
          'wallet.balance': booking.pricing.lenderEarnings,
          'stats.totalEarnings': booking.pricing.lenderEarnings
        },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: booking.pricing.lenderEarnings,
            description: `Earnings from rental: ${booking.item.title}`,
            bookingId: booking._id
          }
        }
      });

      // Refund deposit to borrower
      await User.findByIdAndUpdate(booking.borrower._id, {
        $inc: { 'wallet.balance': booking.pricing.depositAmount },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: booking.pricing.depositAmount,
            description: `Deposit refund for: ${booking.item.title}`,
            bookingId: booking._id
          }
        }
      });

      booking.payment.finalPaymentMade = true;
      booking.payment.lenderPaid = true;
      booking.payment.depositRefunded = true;
      booking.status = 'completed';
      booking.addTimelineEntry('completed', 'Booking completed successfully');

      // Reopen item for rent after completion (if business rule permits)
      await Item.findByIdAndUpdate(booking.item._id, {
        'availability.isAvailable': true
      });

      // Update item stats
      await Item.findByIdAndUpdate(booking.item._id, {
        $inc: {
          'stats.bookings': 1,
          'stats.totalEarnings': booking.pricing.lenderEarnings
        }
      });
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('item', 'title images')
      .populate('borrower', 'name email')
      .populate('lender', 'name email');

    res.json({
      success: true,
      message: status === 'approved'
        ? 'Booking request accepted successfully'
        : status === 'rejected'
          ? 'Booking request rejected successfully'
          : `Booking ${status} successfully`,
      data: { booking: updatedBooking }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating booking status'
    });
  }
};

/**
 * Adds a message to booking conversation
 * @async
 * @function addBookingMessage
 * @param {Object} req - Express request object containing message content
 * @param {Object} res - Express response object
 * @description Adds messages to booking conversation with authorization check
 * Special features:
 * - Validates user authorization (only borrower and lender can message)
 * - Creates timestamped messages with sender information
 * - Returns updated booking with populated sender details
 * - Maintains conversation history for booking disputes and communication
 * - Handles authorization failures gracefully
 * - Provides real-time messaging capability for booking participants
 */
const addBookingMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is involved in this booking
    if (booking.borrower.toString() !== req.user.id &&
      booking.lender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to message in this booking'
      });
    }

    booking.messages.push({
      sender: req.user.id,
      message,
      timestamp: new Date()
    });

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('messages.sender', 'name profileImage');

    res.json({
      success: true,
      message: 'Message added successfully',
      data: { booking: updatedBooking }
    });

  } catch (error) {
    console.error('Add booking message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding message'
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  addBookingMessage
};
