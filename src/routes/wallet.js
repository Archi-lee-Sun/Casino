const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const { getBalance, getTransactions, addBonus } = require('../controllers/walletController');


router.get('/balance', auth, getBalance);
router.get('/transactions', auth, getTransactions);
router.post('/bonus', auth, addBonus);

module.exports = router;