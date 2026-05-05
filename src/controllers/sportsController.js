const { getUpcomingMatches } = require('../services/sportsService');

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

module.exports = {
    getMatches
}