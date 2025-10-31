const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Transaction routes
router.get('/wallet/:address', transactionController.getTransactionHistory);
router.get('/:id', transactionController.getTransactionDetails);

module.exports = router;
