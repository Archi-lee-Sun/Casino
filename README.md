# Casino Platform

Full-stack online casino demo with fake currency. Built as portfolio project demonstrating backend architecture, real-time systems, and algorithm implementation.

## What This Is

Browser-based casino platform with three games, sports betting, live leaderboard, wallet system. No real money. Users register, get 1000 coins, play games, compete on leaderboard.

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL via Supabase
- **Auth**: JWT + bcrypt
- **Real-time**: WebSockets (ws)
- **External API**: API-Football (live match data)

## Games

**Slots** - 3x3 reel grid with weighted symbol selection. RTP algorithm controls payout rates. Provably fair weighted random using cumulative weight distribution.

**Crash** - Provably fair multiplier game using HMAC-SHA256 hash chain. Game loop runs server-side continuously. Players join via WebSocket, place bets during waiting phase, cash out before crash point. Crash point predetermined per round using cryptographic seed.

**Sports Betting** - Live football fixtures from API-Football. Users bet on home/draw/away outcome. Bets stored and resolved when match finishes via resolve endpoint.

## Algorithms Implemented

- Weighted random symbol selection (slots RTP)
- Provably fair crash point generation (HMAC-SHA256)
- Wilson Score leaderboard ranking
- Incremental balance updates with transaction logging

## Database Schema

`users` `transactions` `bets` `sports_bets` `matches` `crash_games`

## API Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/wallet/balance
GET  /api/wallet/transactions
POST /api/wallet/bonus
POST /api/slots/spin
POST /api/crash/bet
POST /api/crash/cashout
GET  /api/sports/matches
POST /api/sports/bet
POST /api/sports/resolve
GET  /api/leaderboard
```

## Setup

```bash
git clone <repo>
cd casino
npm install
```

Create `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
PORT=3000
FOOTBALL_API_KEY=your_key
```

```bash
node index.js
```

Run SQL migrations in `/src/db/migrations/` against Supabase before starting.

## Project Structure

```
src/
  config/       db connection
  controllers/  request handlers
  services/     game logic and algorithms
  routes/       express routers
  middleware/   auth, rate limiting, errors
  games/        pure algorithm files (slots, crash)
  db/
    queries/    raw SQL functions
    migrations/ table definitions
```

## Division of Work

Backend written by developer. Frontend (HTML/CSS/JS) generated separately. All game algorithms, database design, API architecture, WebSocket implementation written by developer.

## Notes

Free tier API-Football does not support `next` parameter — app fetches today's fixtures by date. Crash game runs continuously from server start — rounds auto-cycle every ~25 seconds.
