const crypto = require('crypto');
const { generateCrashPoint } = require('../games/crash/fairness');
const { insertCrashRound, updateCrashRoundStates, getCrashRoundById } = require('../db/queries/crashQueries');


const createRound = async () => {
    try {
        const seed = crypto.randomBytes(32).toString('hex');
        const hash = crypto.createHash('sha256').update(seed).digest('hex');

        
        const round = await insertCrashRound(hash, 0); 

        
        const finalCrashPoint = generateCrashPoint(seed, round.id);

        const finalRound = await updateCrashRoundStates(
            round.id, 
            'waiting', 
            null, 
            null, 
            finalCrashPoint
        );

        return { ...finalRound, seed }; 
    } catch (err) {
        console.error('Failed to create round:', err);
        throw err;
    }
};

const startRound = async (roundId) => {
    try {
        const roundBefore = await getCrashRoundById(roundId);

        if (!roundBefore) {
            throw new Error('Round not found');
        }

        const round = await updateCrashRoundStates(
            roundId,
            'running',
            new Date(),
            null,
            roundBefore.crash_point
        )

        return round
    } catch (err) {
        console.error('Failed to start round:', err);
        throw err;
    }
}


const endRound = async (roundId) => {
    try{
        const roundBefore = await getCrashRoundById(roundId)

        if (!roundBefore) {
            throw new Error('Round not found');
        }

        const round = await updateCrashRoundStates(
            roundId,
            'crashed',
            roundBefore.started_at,
            new Date(),
            roundBefore.crash_point
        )

        return round
    } catch (err) {
        console.error('Failed to end round:', err);
        throw err;
    }
}

module.exports = {
    createRound,
    startRound,
    endRound
}