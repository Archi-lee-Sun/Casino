const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth');
const walletRoutes = require('./src/routes/wallet');
const slotsRoutes = require('./src/routes/slots');
const crashRoutes = require('./src/routes/crash');
const sportsRoutes = require('./src/routes/sports');
const leaderboardRoutes = require('./src/routes/leaderboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'pages')));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/crash', crashRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Casino server running on port ${PORT}`);
});