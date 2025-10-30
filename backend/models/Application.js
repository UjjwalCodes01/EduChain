const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  // Student Information
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  
  // Pool Information
  poolId: {
    type: String,
    required: true,
    index: true
  },
  poolAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Application Data
  ipfsHash: {
    type: String,
    default: ''
  },
  applicationData: {
    name: String,
    studentId: String,
    institution: String,
    program: String,
    year: String,
    gpa: String,
    additionalInfo: String
  },
  
  // Verification Status
  verificationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'verified', 'approved', 'rejected', 'paid'],
    default: 'pending',
    index: true
  },
  
  // Admin Actions
  reviewedBy: {
    type: String,
    lowercase: true
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique applications per pool
ApplicationSchema.index({ walletAddress: 1, poolAddress: 1 }, { unique: true });

// Methods
ApplicationSchema.methods.verify = function() {
  this.emailVerified = true;
  this.verifiedAt = new Date();
  this.status = 'verified';
  this.verificationToken = undefined;
  return this.save();
};

ApplicationSchema.methods.approve = function(adminAddress, notes = '') {
  this.status = 'approved';
  this.reviewedBy = adminAddress.toLowerCase();
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

ApplicationSchema.methods.reject = function(adminAddress, notes = '') {
  this.status = 'rejected';
  this.reviewedBy = adminAddress.toLowerCase();
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

ApplicationSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  return this.save();
};

module.exports = mongoose.model('Application', ApplicationSchema);
