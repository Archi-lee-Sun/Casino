const express = require('express');
const cors = require('cors');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');
require('dotenv').config();

const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth');
const walletRoutes = require('./src/routes/wallet');
const slotsRoutes = require('./src/routes/slots');
const crashRoutes = require('./src/routes/crash');
const sportsRoutes = require('./src/routes/sports');
const leaderboardRoutes = require('./src/routes/leaderboard');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const { crashClients, startGameLoop } = require('./src/controllers/crashController');

app.use(cors());
app.use(express.json());

// ✅ FIX: Serve the entire project root so that:
//   - /pages/index.html is accessible
//   - /css/main.css is accessible (referenced as ../css/main.css from pages/)
//   - /js/api.js is accessible (referenced as ../js/api.js from pages/)
app.use(express.static(path.join(__dirname)));

// Redirect root "/" to the login page
app.get('/', (req, res) => {
  res.redirect('/pages/index.html');
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/crash', crashRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'join_crash') {
                crashClients.add(ws);
            }
        } catch (error) {
            console.error('Socket message error:', error);
        }
    });

    ws.on('close', () => {
        crashClients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`🎰 Casino server running on http://localhost:${PORT}`);
    startGameLoop(wss);
});

module.exports = { wss };