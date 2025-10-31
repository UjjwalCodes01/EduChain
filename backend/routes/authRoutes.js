const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.get('/check/:wallet', authController.checkWallet);
router.post('/login', authController.login);

module.exports = router;
