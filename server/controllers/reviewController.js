const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create review
const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookingId, type, rating, comment } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('item')
      .populate('borrower')
      .populate('lender');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Only the borrower can review after a completed rental.
    if (booking.borrower._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the borrower can review this booking'
      });
    }

    // Determine reviewee based on type and user role
    let reviewee;
    if (type === 'item') {
      reviewee = booking.lender._id;
    } else if (type === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Owner reviews are disabled'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      booking: bookingId,
      reviewer: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      item: booking.item._id,
      reviewer: req.user.id,
      reviewee,
      type,
      rating: Number(rating),
      comment
    });

    // Update item or user rating
    if (type === 'item') {
      const item = await Item.findById(booking.item._id);
      item.updateRating(Number(rating));
      await item.save();
    } else if (type === 'user') {
      const user = await User.findById(reviewee);
      user.updateRating(Number(rating));
      await user.save();
    }

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name profileImage')
      .populate('reviewee', 'name')
      .populate('item', 'title');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: populatedReview }
    });

  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating review'
    });
  }
};

// Get reviews for an item
const getItemReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      item: req.params.itemId,
      type: 'item',
      isHidden: false
    })
      .populate('reviewer', 'name profileImage')
      .populate('booking', 'startDate endDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      item: req.params.itemId,
      type: 'item',
      isHidden: false
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get item reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews'
    });
  }
};

// Get reviews for a user
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      reviewee: req.params.userId,
      type: 'user',
      isHidden: false
    })
      .populate('reviewer', 'name profileImage')
      .populate('item', 'title')
      .populate('booking', 'startDate endDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      reviewee: req.params.userId,
      type: 'user',
      isHidden: false
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews'
    });
  }
};

// Report review
const reportReview = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is not the reviewer
    if (review.reviewer.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report your own review'
      });
    }

    review.isReported = true;
    review.reportReason = reason;
    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reporting review'
    });
  }
};

// Get user's reviews (reviews they've written)
const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ reviewer: req.user.id })
      .populate('reviewee', 'name')
      .populate('item', 'title images')
      .populate('booking', 'startDate endDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ reviewer: req.user.id });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews'
    });
  }
};

module.exports = {
  createReview,
  getItemReviews,
  getUserReviews,
  reportReview,
  getMyReviews
};
