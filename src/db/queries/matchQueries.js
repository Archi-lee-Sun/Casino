const pool = require('../../config/db');

const insertMatch = async (apiMatchId, homeTeam, awayTeam, homeOdds, drawOdds, awayOdds, matchDate) => {
    const query = `
        INSERT INTO matches (api_match_id, home_team, away_team, home_odds, draw_odds, away_odds, match_date , created_at , status)
        VALUES ($1, $2, $3, $4, $5, $6, $7 , NOW(), 'active')
        RETURNING *;
    `;
    const values = [apiMatchId, homeTeam, awayTeam, homeOdds, drawOdds, awayOdds, matchDate];

    try {
        const match = await pool.query(query , values);
        return match.rows[0];
    } catch (error) {
        throw new Error('Error inserting match');
    }
};


const getMatchByApiId = async (apiMatchId) => {
    const query = `
        SELECT * FROM matches WHERE api_match_id = $1
    `
    const values = [apiMatchId];

    try {
        const match = await pool.query(query , values);
        return match.rows[0]
    } catch (error) {
        throw new Error('Error fetching match by API ID');
    }
};

const updateMatchResult = async (apiMatchId , result) => {
    try {
        const match = await pool.query(`
            UPDATE matches SET result = $1 , status = 'completed' WHERE api_match_id = $2
        `, [result, apiMatchId]);
        return match.rows[0];
    } catch (error) {
        throw new Error('Error updating match result');
    }
};

module.exports = {
    insertMatch,
    getMatchByApiId,
    updateMatchResult
}