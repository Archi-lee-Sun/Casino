const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { playspin } = require('../controllers/slotsController');

router.post('/spin', auth, playspin);

module.exports = router;