const pool = require('../config/db');

const getLeaderboard = async (req, res) => {
    try {
        const query = `
            SELECT username, balance , ROW_NUMBER() OVER (ORDER BY balance DESC) as rank
            FROM users 
            ORDER BY balance DESC 
            LIMIT 10
        `;

        const { rows } = await pool.query(query);

    
        if (rows.length === 0) {
            return res.json({ message: "No users found", leaderboard: [] });
        }

        res.json(rows);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};

module.exports = {
    getLeaderboard
};