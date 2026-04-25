const pool = require('../../config/db');

const createUser = async (username, email, passwordHash) => {
    const query = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    
    const values = [username, email, passwordHash];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error executing createUser query:', err.stack);
        throw err;
    }
}

const getUserByEmail = async (email) => {
    const query = `
        SELECT * FROM users
        WHERE email = $1;`;

    const values = [email]

    try{
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error executing getUserByEmail query:', err.stack);
        throw err;
    }
}


const getUserById = async (id) => {
    const query = `
        SELECT * FROM users
        WHERE id = $1; `;
    
    const values = [id]

    try{
        const result = await pool.query(query , values);
        return result.rows[0];
    } catch (err){
        console.error('Error executing getUserById query:' , err.stack);
        throw err;
    }
}

const getTransactionsByUserId = async (userId) => {
    const query = `
        SELECT * FROM transactions
        WHERE user_id = $1
        ORDER BY created_at DESC;`;

    const values = [userId]
    
    try{
        const result = await pool.query(query, values);
        return result.rows;
    } catch (err){
        console.error('Error executing getTransactionsByUserId query: ', err.stack);
        throw err;
    }
}

module.exports = {createUser, getUserByEmail, getUserById, getTransactionsByUserId}