const { getUpcomingMatches , getMatchOdds} = require('../services/sportsService');
const { updateBallance, logTransaction } = require('../services/walletService');
const { getUserById } = require('../db/queries/userQueries');
const pool = require('../config/db');
const { use } = require('react');

const getMatches = async (req , res) => {
    try {
        const matches = await getUpcomingMatches();
        if(matches.length === 0){
            return res.status(404).json({ message : 'No upcoming matches found' })
        }
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message : 'Error fetching upcoming matches' });
    }
}

const placeBet = async (req , res) => {
    const {apiMatchId, outcome, amount} = req.body;
    const userId = req.user.id

    if(outcome !== 'home' && outcome !== 'draw' && outcome !== 'away'){
        return res.status(400).json({ message : 'Invalid outcome. Must be home, draw, or away' })
    }

    if(!apiMatchId || !amount){
        return res.status(400).json({ message : 'apiMatchId and amount are required' })
    }
    if(amount <= 0){
        return res.status(400).json({ message : 'Amount must be greater than 0' })
    }

    try {
        const user = await getUserById(userId)
        if(user.balance < amount){
            return res.status(400).json({ message : 'Insufficient balance' })
        }

        const matches = await getUpcomingMatches();
        const match = matches.find(m => m.fixture.id.toString() === apiMatchId.toString());

        if(!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        
    } catch (error) {
        res.status(500).json({ message : 'Error placing bet' });
    }
}

module.exports = {
    getMatches,
    placeBet
}