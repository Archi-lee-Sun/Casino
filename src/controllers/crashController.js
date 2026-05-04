const { insertBet, updateBetCashout, updateBetLoss} = require('../db/queries/betQueries');
const { createRound, startRound, endRound , } = require('../services/crashService');
const { updateBallance, logTransaction } = require('../services/walletService');
const { getCurrentWaitingRound } = require('../db/queries/crashQueries');
const { getUserById } = require('../db/queries/userQueries');
const { wss } = require('../../index');


const placeBet = async (req , res) => {
    const userId = req.user.id
    const amount = req.body.amount
    
    try {
        const user = await getUserById(userId);

        if (!user || user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const currentRound = await getCurrentWaitingRound();
        if(!currentRound) {
            return res.status(400).json({ error: 'No active round to bet on' });
        }
        if (amount <= 0){
            return res.status(400).json({ error: 'Bet amount must be greater than zero' });
        }

        const bet = await insertBet(userId , currentRound.id , amount)

        if(!bet){
            return res.status(500).json({ error: 'Failed to place bet' });
        }

        await updateBallance(userId , -amount)
        await logTransaction(userId , -amount , 'bet' , `Placed bet of ${amount} on crash round ${currentRound.id}`)
        res.json({ bet });

    } catch (error) {
        console.error('Error placing bet:', error);
        res.status(500).json({ error: 'Failed to place bet' });
    }
}

module.exports = {
    placeBet
}