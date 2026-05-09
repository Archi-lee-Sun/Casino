const express = require('express');
const router = express.Router();
const sportsController = require('../controllers/sportsController');
const authenticateToken = require('../middleware/auth'); 

router.get('/matches', authenticateToken, sportsController.getMatches);

router.post('/bet', authenticateToken, sportsController.placeBet);

router.post('/resolve', authenticateToken, sportsController.resolveMatch);


module.exports = router;