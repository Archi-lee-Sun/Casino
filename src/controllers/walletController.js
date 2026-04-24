const { getUserById } = require('../db/queries/userQueries');
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