const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const multer = require('multer');
const { createLimiter } = require('../middleware/rateLimiter');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    }
});

// Rate limiter for onboarding
const onboardingLimiter = createLimiter(5, 60); // 5 requests per minute

// Student registration
router.post('/student', onboardingLimiter, upload.single('document'), onboardingController.registerStudent);

// Provider registration
router.post('/provider', onboardingLimiter, upload.single('document'), onboardingController.registerProvider);

// Email verification
router.get('/verify/:token', onboardingController.verifyEmail);

// Resend verification email
router.post('/resend-verification', onboardingLimiter, onboardingController.resendVerification);

// Get user profile
router.get('/profile/:walletAddress', onboardingController.getUserProfile);

module.exports = router;
