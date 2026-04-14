const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  platformFee: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  maxRentalDays: {
    type: Number,
    default: 30,
    min: 1
  },
  minRentalDays: {
    type: Number,
    default: 1,
    min: 1
  },
  autoApproval: {
    type: Boolean,
    default: false
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'System is currently under maintenance. Please try again later.'
    },
    enabledAt: {
      type: Date
    },
    enabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  newUserBonus: {
    type: Number,
    default: 1000,
    min: 0
  },
  referralBonus: {
    type: Number,
    default: 500,
    min: 0
  },
  maxItemsPerUser: {
    type: Number,
    default: 10,
    min: 1
  },
  supportEmail: {
    type: String,
    default: 'support@EASYBORROW.com'
  },
  supportPhone: {
    type: String,
    default: '+91-9876543210'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
