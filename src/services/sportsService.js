const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const headers = {
    'x-apisports-key': API_KEY
};

const getUpcomingMatches = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/fixtures`, {
            params : {
                next : 10
            } ,
            headers
        })

        return response.data.response;
    } catch (error){
        console.error('Error fetching upcoming matches:', error);
        throw error;
    }
}

const getMatchOdds = async (fixtureId) => {
    try {
        const response = await axios.get(`${BASE_URL}/odds`, {
            params: { fixture: fixtureId },
            headers
        });
        return response.data.response;
    } catch (error) {
        console.error('Error fetching match odds:', error);
        throw error;
    }
}




module.exports = {
    getUpcomingMatches,
    getMatchOdds
}