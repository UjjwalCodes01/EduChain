const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['student', 'provider'],
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    
    // Student-specific fields
    studentData: {
        fullName: String,
        institute: String,
        program: String,
        graduationYear: Number,
        documentCID: String  // IPFS CID for student documents
    },
    
    // Provider-specific fields
    providerData: {
        organizationName: String,
        website: String,
        description: String,
        contactPerson: String,
        documentCID: String,  // IPFS CID for verification documents
        verified: {
            type: Boolean,
            default: false
        }
    },
    
    // Profile fields (accessible for both roles)
    fullName: String,
    institution: String,
    organizationName: String,
    
    // Notification preferences
    emailNotifications: {
        type: Boolean,
        default: true
    },
    applicationUpdates: {
        type: Boolean,
        default: true
    },
    weeklyDigest: {
        type: Boolean,
        default: false
    },
    
    lastLogin: {
        type: Date
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Instance method to verify email
userSchema.methods.verifyEmail = function() {
    this.emailVerified = true;
    this.verificationToken = undefined;
    this.verificationTokenExpiry = undefined;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
