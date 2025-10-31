const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    walletAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - auto delete when expired
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster lookups
otpSchema.index({ email: 1, walletAddress: 1 });
otpSchema.index({ expiresAt: 1 });

// Method to verify OTP
otpSchema.methods.verifyOTP = function(inputOTP) {
    if (this.verified) {
        throw new Error('OTP already used');
    }
    
    if (this.expiresAt < new Date()) {
        throw new Error('OTP expired');
    }
    
    if (this.attempts >= 3) {
        throw new Error('Maximum verification attempts exceeded');
    }
    
    this.attempts += 1;
    
    if (this.otp === inputOTP) {
        this.verified = true;
        return true;
    }
    
    return false;
};

module.exports = mongoose.model('OTP', otpSchema);
