const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Profile routes
router.get('/profile/:wallet', userController.getUserProfile);
router.put('/profile/:wallet', userController.updateUserProfile);

// Preferences routes
router.get('/preferences/:wallet', userController.getPreferences);
router.put('/preferences/:wallet', userController.updatePreferences);

module.exports = router;
