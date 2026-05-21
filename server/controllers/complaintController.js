const Complaint = require('../models/Complaint');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create complaint
const createComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { defendantId, bookingId, type, subject, description } = req.body;

    // Check if defendant exists
    const defendant = await User.findById(defendantId);
    if (!defendant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let booking = null;

    // Check if booking exists (if provided)
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.borrower.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the borrower can file a complaint for this booking'
        });
      }

      if (booking.lender.toString() !== defendantId) {
        return res.status(400).json({
          success: false,
          message: 'Complaint must be filed against the item owner'
        });
      }

      const existingComplaint = await Complaint.findOne({
        booking: bookingId,
        complainant: req.user.id
      });

      if (existingComplaint) {
        return res.status(400).json({
          success: false,
          message: 'Complaint already exists for this booking'
        });
      }
    }

    // Create complaint
    const complaint = await Complaint.create({
      complainant: req.user.id,
      defendant: defendantId,
      booking: bookingId,
      item: booking?.item,
      type,
      subject,
      description,
      evidence: req.files ? req.files.map(file => file.path) : []
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('complainant', 'name email')
      .populate('defendant', 'name email')
      .populate('booking', 'item startDate endDate');

    res.status(201).json({
      success: true,
      message: 'Complaint filed successfully',
      data: { complaint: populatedComplaint }
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Complaint already exists for this booking'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating complaint'
    });
  }
};

// Get user's complaints
const getUserComplaints = async (req, res) => {
  try {
    const { type = 'filed', page = 1, limit = 10 } = req.query;

    let query = {};
    if (type === 'filed') {
      query.complainant = req.user.id;
    } else if (type === 'received') {
      query.defendant = req.user.id;
    } else {
      query.$or = [
        { complainant: req.user.id },
        { defendant: req.user.id }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('complainant', 'name email profileImage')
      .populate('defendant', 'name email profileImage')
      .populate('booking', 'item startDate endDate')
      .populate('item', 'title images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      data: {
        complaints,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching complaints'
    });
  }
};

// Get complaint by ID
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('complainant', 'name email profileImage')
      .populate('defendant', 'name email profileImage')
      .populate('booking')
      .populate('messages.sender', 'name profileImage')
      .populate('adminNotes.admin', 'name')
      .populate('resolution.resolvedBy', 'name');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user is involved in this complaint
    if (complaint.complainant._id.toString() !== req.user.id && 
        complaint.defendant._id.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }

    res.json({
      success: true,
      data: { complaint }
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching complaint'
    });
  }
};

// Add message to complaint
const addComplaintMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user is involved in this complaint
    if (complaint.complainant.toString() !== req.user.id && 
        complaint.defendant.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to message in this complaint'
      });
    }

    complaint.messages.push({
      sender: req.user.id,
      message,
      timestamp: new Date(),
      isAdminMessage: req.user.role === 'admin'
    });

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('messages.sender', 'name profileImage');

    res.json({
      success: true,
      message: 'Message added successfully',
      data: { complaint: updatedComplaint }
    });

  } catch (error) {
    console.error('Add complaint message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding message'
    });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaintById,
  addComplaintMessage
};
