const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/email');
const crypto = require('crypto');

// Generate and send OTP
exports.sendOTP = async (req, res) => {
    try {
        const { email, walletAddress } = req.body;

        if (!email || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Email and wallet address are required'
            });
        }

        // Check if email is already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email: email.toLowerCase(), walletAddress: walletAddress.toLowerCase() });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        const newOTP = new OTP({
            email: email.toLowerCase(),
            walletAddress: walletAddress.toLowerCase(),
            otp,
            expiresAt: otpExpiry
        });

        await newOTP.save();

        try {
            // Send OTP email
            await sendOTPEmail(email, otp);

            res.status(200).json({
                success: true,
                message: 'OTP sent to your email',
                data: {
                    email,
                    expiresIn: '10 minutes',
                    // DEVELOPMENT ONLY - Remove in production
                    ...(process.env.NODE_ENV === 'development' && { otp })
                }
            });
        } catch (error) {
            console.error('Error sending OTP:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP email. Please try again.'
            });
        }

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, walletAddress } = req.body;

        if (!email || !otp || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and wallet address are required'
            });
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            walletAddress: walletAddress.toLowerCase(),
            verified: false
        }).sort({ createdAt: -1 }); // Get the most recent OTP

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.'
            });
        }

        try {
            // Verify OTP using the model method
            const isValid = otpRecord.verifyOTP(otp);
            
            if (!isValid) {
                await otpRecord.save(); // Save attempt count
                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
                });
            }

            await otpRecord.save(); // Save verified status

            res.status(200).json({
                success: true,
                message: 'OTP verified successfully',
                data: {
                    verified: true,
                    email: otpRecord.email,
                    walletAddress: otpRecord.walletAddress
                }
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: error.message
        });
    }
};

module.exports = {
    sendOTP: exports.sendOTP,
    verifyOTP: exports.verifyOTP
};
