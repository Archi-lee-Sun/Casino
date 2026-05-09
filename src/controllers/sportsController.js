const { getUpcomingMatches , getMatchOdds , getMatchResult} = require('../services/sportsService');
const { updateBallance, logTransaction } = require('../services/walletService');
const { insertSportsBet ,getPendingSportsBets ,updateSportsBetStatus} = require('../db/queries/sportsBetQueries');
const { insertMatch,getMatchByApiId,updateMatchResult } = require('../db/queries/matchQueries');
const { getUserById } = require('../db/queries/userQueries');
const pool = require('../config/db');


const getMatches = async (req , res) => {
    try {
        const matches = await getUpcomingMatches();
        if(matches.length === 0){
            return res.status(404).json({ message : 'No upcoming matches found' })
        }
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message : 'Error fetching upcoming matches' });
    }
}

const placeBet = async (req , res) => {
    const {apiMatchId, outcome, amount} = req.body;
    const userId = req.user.id

    if(outcome !== 'home' && outcome !== 'draw' && outcome !== 'away'){
        return res.status(400).json({ message : 'Invalid outcome. Must be home, draw, or away' })
    }

    if(!apiMatchId || !amount){
        return res.status(400).json({ message : 'apiMatchId and amount are required' })
    }
    if(amount <= 0){
        return res.status(400).json({ message : 'Amount must be greater than 0' })
    }

    try {
        const user = await getUserById(userId)
        if(user.balance < amount){
            return res.status(400).json({ message : 'Insufficient balance' })
        }

        const matches = await getUpcomingMatches();
        const match = matches.find(m => m.fixture.id.toString() === apiMatchId.toString());

        if(!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        
        const odds = await getMatchOdds(apiMatchId);
        if(odds.length === 0){
            return res.status(404).json({ message : 'Odds not found for this match' })
        }

        const selectedOdds = odds[0].bookmakers[0].bets.find(b => b.label.toLowerCase() === outcome.toLowerCase());
        if(!selectedOdds){
            return res.status(404).json({ message : 'Selected odds not found' })
        }
        const existingMatch = await getMatchByApiId(apiMatchId);

        if(!existingMatch){
            await insertMatch(
                apiMatchId,
                match.teams.home.name,
                match.teams.away.name,
                odds[0].bookmakers[0].bets.find(b => b.label.toLowerCase() === 'home').values[0].odd,
                odds[0].bookmakers[0].bets.find(b => b.label.toLowerCase() === 'draw').values[0].odd,
                odds[0].bookmakers[0].bets.find(b => b.label.toLowerCase() === 'away').values[0].odd,
                match.fixture.date
            )
        }

        await insertSportsBet(userId, match.fixture.id, apiMatchId, outcome, amount, selectedOdds.values[0].odd);
        await updateBallance(userId, -amount);
        await logTransaction(userId, -amount, 'bet_placement', `Placed bet of ${amount} on match ${match.teams.home.name} vs ${match.teams.away.name} for outcome ${outcome}`);

        res.json({ message : 'Bet placed successfully' });
    } catch (error) {
        res.status(500).json({ message : 'Error placing bet' });
    }
}

const resolveMatch = async (req , res) => {
    const {apiMatchId} = req.body;
    
    if(!apiMatchId){
        return res.status(400).json({ message : 'apiMatchId is required' })
    }

    try {
        const matchData = await getMatchResult(apiMatchId);

        if (!matchData) {
            return res.status(404).json({ message: 'Match result not found in API' });
        }

        if (matchData.fixture.status.short !== 'FT') {
            return res.status(400).json({ 
                message: `Match is not finished yet. Status: ${matchData.fixture.status.long}` 
            });
        }

        const goalsHome = matchData.goals.home;
        const goalsAway = matchData.goals.away;

        const result = goalsHome > goalsAway ? 'home' : (goalsHome < goalsAway ? 'away' : 'draw')

        await updateMatchResult(apiMatchId , result)

        const pendingBets = await getPendingSportsBets(apiMatchId)
        for(const bet of pendingBets){
            if(bet.outcome === result){
                const payout = bet.amount * bet.odds;
                await updateSportsBetStatus(bet.id, 'won', payout);
                await updateBallance(bet.user_id, payout);
                await logTransaction(bet.user_id, payout, 'bet_win', `Won bet of ${bet.amount} on match ${bet.api_match_id} with outcome ${bet.outcome}`);
            } else {
                await updateSportsBetStatus(bet.id, 'lost', 0);
            }
        }

        res.json({ message : 'Match resolved successfully' });

    } catch (error){
        res.status(500).json({ message : 'Error resolving match' });
    }

}

module.exports = {
    getMatches,
    placeBet ,
    resolveMatch
}