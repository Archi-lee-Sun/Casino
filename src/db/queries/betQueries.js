const pool = require('../../config/db');

const insertBet = async (userId , roundId , amount) => {
    const query = `
        INSERT INTO bets (user_id ,  game_type , amount , status ,  meta , created_at)
        VALUES($1 , 'crash' , $2 , 'pending' , $3 , NOW())
        RETURNING *;
    `
        
    const metaData = {
        round_id : roundId ,
        cashout_multiplier : null ,
        auto_cashout : null
    }

    const values = [userId , amount , metaData]

    try {
        const result = await pool.query(query , values)
        return result.rows[0];
    } catch (error) {
        console.error('Error inserting bet:', error);
        throw error;
    }
}

const updateBetCashout = async (betId , cashout_multiplier , payout) => {
    const query = `
        UPDATE bets 
        SET status = 'won' , payout = $2 , meta = jsonb_set(meta, '{cashout_multiplier}', to_jsonb($3::numeric)) 
        WHERE id = $1
        RETURNING *;
    `
    const values = [betId , payout , cashout_multiplier]
    try {
        const result = await pool.query(query , values)
        return result.rows[0];
    } catch (error) {
        console.error('Error updating bet cashout:', error);
        throw error;
    }
}

const updateBetLoss = async (roundId) => {
    const query = `
        UPDATE bets
        SET status = 'lost'
        WHERE meta->> 'round_id' = $1 AND status = 'pending';
    `
    const values = [roundId]

    try{
        const result = await pool.query(query , values)
        return result.rowCount;
    } catch (error) {
        console.error('Error updating lost bets:', error);
        throw error;
    }
}
module.exports = {
    insertBet,
    updateBetCashout,
    updateBetLoss
}