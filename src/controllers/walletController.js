const { getUserById , getTransactionsByUserId } = require('../db/queries/userQueries');
const { updateBallance, logTransaction } = require('../services/walletService');
const pool = require('../config/db');

const getBalance = async (req , res) => {
    const userId = req.user.id;

    try{
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ balance : user.balance})
    } catch(err){
        console.error(err)
        res.status(500).json({ error : 'Internal server error'})
    }
}

const getTransactions = async (req , res) => {
    const userId = req.user.id;

    try{
        const result = await getTransactionsByUserId(userId)
        
        if(result.length === 0){
            return res.status(404).json({ error : 'NO transactions found'})
        }

        res.status(200).json({ transactions : result})
    } catch(err){
        console.error(err)
        res.status(500).json({ error : 'Internal server error'})
    }
}

const addBonus = async (req , res) => {
    const userId = req.user.id;

    try{
        const lastTransaction = await pool.query(`
            SELECT * FROM transactions
            WHERE user_id = $1 AND type = 'bonus'
            ORDER BY created_at DESC
            LIMIT 1 ;`, [userId]);

        const last = lastTransaction.rows[0];
        if (last && last.created_at > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return res.status(400).json({ error: 'Bonus already claimed in the last 24 hours' });
        }

        const bonusAmount = 100;

        const updatedBalance = await updateBallance(userId , bonusAmount);
        await logTransaction(userId , bonusAmount , 'bonus' , 'Daily bonus')
        res.status(200).json({ balance : updatedBalance.balance})
    } catch(err){
        console.error(err)
        res.status(500).json({ error : 'Internal server error'})
    }
}

module.exports = { getBalance , getTransactions , addBonus}