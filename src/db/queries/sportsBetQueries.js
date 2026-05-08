const pool = require('../../config/db');

const insertSportsBet = async (userId, matchId, apiMatchId, outcome, amount, odds) => {
    const query = `
        INSERT INTO sports_bets (user_id, match_id, api_match_id, outcome, amount, odds , status , created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
        RETURNING *;
    `;
    const values = [userId, matchId, apiMatchId, outcome, amount, odds];

    try {
        const sportsBet = await pool.query(query, values);
        return sportsBet.rows[0];
    } catch (error) {
        throw new Error('Error inserting sports bet');
    }
};

const getPendingSportsBets = async (apiMatchId) => {
    try {
        const query = `
            SELECT * FROM sports_bets 
            WHERE status = 'pending' AND api_match_id = $1
        `;
        const values = [apiMatchId];
        const pendingBets = await pool.query(query, values);
        return pendingBets.rows;
    } catch (error) {
        throw new Error('Error fetching pending sports bets');
    }
};

const updateSportsBetStatus = async (betId, status, payout) => {
    try {
        await pool.query(`
            UPDATE sports_bets 
            SET status = $1, payout = $2 
            WHERE id = $3
        `, [status, payout, betId]);
    } catch (error) {
        throw new Error('Error updating sports bet status');
    }
};

module.exports = {
    insertSportsBet ,
    getPendingSportsBets ,
    updateSportsBetStatus
};
