const pool = require('../../config/db');

const insertCrashRound = async (hash, crashPoint) => {
    const query = `
        INSERT INTO crash_games (hash, crash_point, status, created_at) 
        VALUES($1, $2, 'waiting', NOW()) 
        RETURNING *;
    `;
    const values = [hash, crashPoint];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch(err) {
        console.error('Error inserting crash round:', err);
        throw err;
    }
};

const getCrashRoundById = async (id) => {
    const query = `SELECT * FROM crash_games WHERE id = $1`;
    const values = [id];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch(err) {
        console.error('Error fetching crash round:', err);
        throw err;
    }
};


const updateCrashRoundStates = async (id, status, startedAt = null, crashedAt = null, crashPoint = null) => {
    const query = `
        UPDATE crash_games 
        SET status = $2, 
            started_at = COALESCE($3, started_at), 
            crashed_at = COALESCE($4, crashed_at), 
            crash_point = COALESCE($5, crash_point)
        WHERE id = $1
        RETURNING *;
    `;
  
    const values = [id, status, startedAt, crashedAt, crashPoint];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch(err) {
        console.error('Error updating crash round:', err);
        throw err;
    }
};

const getCurrentWaitingRound = async () => {
    const result = await pool.query(`
        SELECT * FROM crash_games 
        WHERE status = 'waiting' 
        ORDER BY created_at DESC 
        LIMIT 1
    `);
    return result.rows[0];
};

module.exports = {
    insertCrashRound,
    getCrashRoundById,
    updateCrashRoundStates,
    getCurrentWaitingRound
};
