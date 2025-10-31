const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { createLimiter } = require('../middleware/rateLimiter');

// Rate limiters
const otpLimiter = createLimiter(5, 15); // 5 requests per 15 minutes
const verifyLimiter = createLimiter(10, 15); // 10 requests per 15 minutes

// Send OTP
router.post('/send', otpLimiter, otpController.sendOTP);

// Verify OTP
router.post('/verify', verifyLimiter, otpController.verifyOTP);

module.exports = router;
