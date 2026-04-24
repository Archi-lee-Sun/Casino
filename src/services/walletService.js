const pool = require('../../config/db');

const updateBallance = async (userId, amount) => {
    try {
        const result = await pool.query(`
            UPDATE users 
            SET balance = balance + $1 
            WHERE id = $2 
            RETURNING balance
        `, [amount, userId]);

        if (result.rowCount === 0) {
            throw new Error('User not Found');
        }

        return result.rows[0];
    } catch (err) {
        console.error(err.stack);
        throw err;
    }
}

const logTransaction = async (userId, amount, type, description) => {
    try {
        const result = await pool.query(`
            INSERT INTO transactions (user_id, amount, type, description) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `, [userId, amount, type, description]);

        return result.rows[0];
    } catch (err) {
        console.error(err.stack);
        throw err;
    }
}

module.exports = { updateBallance, logTransaction };