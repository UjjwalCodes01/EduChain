const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../utils/email');

// Test email endpoint
router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Try to send test OTP
        const testOTP = '123456';
        
        try {
            await sendOTPEmail(email, testOTP, 'Test User');
            
            res.status(200).json({
                success: true,
                message: 'Test email sent successfully',
                details: {
                    to: email,
                    otp: testOTP,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (emailError) {
            console.error('Email send error:', emailError);
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: emailError.message,
                stack: process.env.NODE_ENV === 'development' ? emailError.stack : undefined
            });
        }
    } catch (error) {
        console.error('Debug test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal error',
            error: error.message
        });
    }
});

// Check email configuration
router.get('/email-config', (req, res) => {
    res.json({
        configured: {
            EMAIL_USER: !!process.env.EMAIL_USER,
            EMAIL_PASS: !!process.env.EMAIL_PASS,
            EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
            FRONTEND_URL: process.env.FRONTEND_URL
        },
        values: {
            EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
            EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail (default)',
            FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET'
        }
    });
});

module.exports = router;
