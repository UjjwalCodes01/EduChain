const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  submitApplication,
  verifyEmail,
  getApplication,
  getPoolApplications,
  getWalletApplications,
  resendVerification
} = require('../controllers/applicationController');
const { applicationLimiter, emailLimiter } = require('../middleware/rateLimiter');

// Configure multer for file uploads (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
  }
});

// Public routes
router.post('/submit', applicationLimiter, upload.single('document'), submitApplication);
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', emailLimiter, resendVerification);

// Get application by wallet and pool
router.get('/wallet/:walletAddress/pool/:poolAddress', getApplication);

// Get all applications for a wallet
router.get('/wallet/:walletAddress', getWalletApplications);

// Get all applications for a pool
router.get('/pool/:poolAddress', getPoolApplications);

module.exports = router;
