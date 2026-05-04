const { updateBallance, logTransaction } = require('../services/walletService');
const pool = require('../config/db');
const { spin } = require('../games/slots/slotsService');

const playspin = async (req, res) => {
    const userId = req.user.id;
    const betAmount = req.body.betAmount;

    if (!betAmount ||betAmount <= 0) {
        return res.status(400).json({ error: "BET_AMOUNT MUST BE POSITIVE" });
    }

    try {
        const userResult = await pool.query(`
            SELECT balance FROM users 
            WHERE id = $1;`, [userId]);

        const user = userResult.rows[0];

        if (!user || betAmount > user.balance) {
            return res.status(400).json({ error: "INSUFFICIENT FUNDS" });
        }

        await updateBallance(userId, -betAmount);
        await logTransaction(userId, -betAmount, "SPIN", 'user played a spin');

        const { grid, iswin, winninglines, payout } = spin(betAmount);

        if (iswin) {
            await updateBallance(userId, payout);
            await logTransaction(userId, payout, "SPIN WIN", "USER WON A SPIN");
        }

        return res.status(200).json({ grid, iswin, winninglines, payout });
    } catch (error) {
        console.error("Error occurred while playing spin:", error);
        return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    }
};

module.exports = { playspin };