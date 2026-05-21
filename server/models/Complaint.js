const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  defendant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  type: {
    type: String,
    enum: ['item_damage', 'late_return', 'no_show', 'inappropriate_behavior', 'payment_issue', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  evidence: [{
    type: String // File paths for uploaded evidence
  }],
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminNotes: [{
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    timestamp: { type: Date, default: Date.now }
  }],
  resolution: {
    action: {
      type: String,
      enum: ['warning', 'suspension', 'refund', 'compensation', 'no_action']
    },
    description: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now },
    isAdminMessage: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

complaintSchema.index({ booking: 1, complainant: 1 }, { unique: true, sparse: true });
complaintSchema.index({ item: 1, type: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
