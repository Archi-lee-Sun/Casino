const express = require('express');
const router = express.Router();
const crashController = require('../controllers/crashController');
const authMiddleware = require('../middleware/auth'); 


router.post('/bet', authMiddleware, crashController.placeBet);


router.post('/cashout', authMiddleware, crashController.cashOut);

module.exports = router;