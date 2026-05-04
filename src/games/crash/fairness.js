const crypto = require('crypto');

const generateCrashPoint = (seed, roundId) => {
    const hash = crypto.createHmac('sha256' , seed).update(roundId.toString()).digest('hex')

    const hexPart = hash.slice(0,8);

    const decimalValue = parseInt(hexPart , 16)

    const crashPoint = Math.max(100 , (100 * Math.pow(2, 32)) / (decimalValue + 1)) / 100

    return Math.floor(crashPoint * 100) / 100
}

module.exports = { generateCrashPoint }