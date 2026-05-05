let currentMultiplier = 1.00; 
let currentRoundId = null;
const crashClients = new Set();

const { insertBet, updateBetCashout, updateBetLoss , getBetByUserAndRound} = require('../db/queries/betQueries');
const { createRound, startRound, endRound , } = require('../services/crashService');
const { updateBallance, logTransaction } = require('../services/walletService');
const { getCurrentWaitingRound } = require('../db/queries/crashQueries');
const { getUserById } = require('../db/queries/userQueries');



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

const cashOut = async (req , res) => {
    const userId = req.user.id
    
    try {
        const bet = await getBetByUserAndRound(userId , currentRoundId);

        if(!bet) {
            return res.status(400).json({ error: 'No active bet to cash out' });
        }

        const payout = parseFloat((bet.amount * currentMultiplier).toFixed(2))

        await updateBetCashout(bet.id , currentMultiplier , payout)

        await updateBallance(userId , payout)
        await logTransaction(userId , payout , 'cashout' , `Cashed out bet of ${bet.amount} at multiplier ${currentMultiplier} for a payout of ${payout}`)
        res.json({ payout , multiplier : currentMultiplier });

    } catch (error) {
        console.error('Error cashing out bet:', error);
        res.status(500).json({ error: 'Failed to cash out bet' });
    }
}

const startGameLoop = async () => {
    while(true) {
        const round = await createRound();
        currentRoundId = round.id;

        broadcastToCrash({ type: 'game_state', state: 'waiting', time: 10000 });
        await new Promise(resolve => setTimeout(resolve , 10000));

        await startRound(round.id);
        currentMultiplier = 1.00;

        broadcastToCrash({ type: 'game_state', state: 'running'})

        while(currentMultiplier < round.crash_point) {
            await new Promise(resolve => setTimeout(resolve , 100));
            currentMultiplier = parseFloat((currentMultiplier * 1.01).toFixed(2));
            broadcastToCrash({ type: 'multiplier_update' , multiplier: currentMultiplier});
        }

        await endRound(round.id);
        await updateBetLoss(round.id);

        broadcastToCrash({ type: 'game_state', state: 'crashed' , crash_point : round.crash_point})
        await new Promise(resolve => setTimeout(resolve , 5000));
    }
}

const broadcastToCrash = (message) => {
    crashClients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
};

module.exports = {
    placeBet,
    cashOut,
    startGameLoop,
    crashClients
}