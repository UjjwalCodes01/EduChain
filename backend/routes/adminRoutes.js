const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  approveApplication,
  rejectApplication,
  markAsPaid,
  getStatistics,
  batchApprove
} = require('../controllers/adminController');
const { adminLimiter } = require('../middleware/rateLimiter');

// Apply admin rate limiter to all routes
router.use(adminLimiter);

// Get all applications with filtering and pagination
router.get('/applications', getAllApplications);

// Get statistics
router.get('/statistics', getStatistics);

// Approve single application
router.post('/applications/:applicationId/approve', approveApplication);

// Reject single application
router.post('/applications/:applicationId/reject', rejectApplication);

// Mark application as paid
router.post('/applications/:applicationId/paid', markAsPaid);

// Batch approve applications
router.post('/applications/batch-approve', batchApprove);

module.exports = router;
