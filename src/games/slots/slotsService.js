const PAYLINES = require('./paylines');
const SLOT_SYMBOLS = require('./symbols');

const spin = (betAmount) => {

    const grid = []

    for(let i =0; i < 3; i++){
        const reel= []
        for(let j = 0; j < 3; j++){
            const symbol = pickSymbol();
            reel.push({ name: symbol.name, emoji: symbol.emoji });
        }
        grid.push(reel)
    }

    const { iswin , winninglines , payout } = evaluateSpin(grid , betAmount)

    return {
        grid , 
        iswin ,
        winninglines,
        payout
    }
    
}

evaluateSpin = (grid , betAmount) => {
    let iswin = false;
    let winninglines = [];
    let payout = 0;

    for(let i = 0; i < PAYLINES.length; i++){
        const line  = PAYLINES[i].coords;
        const symbols = line.map(([x,y]) => grid[y][x]);
        if(symbols[0].name === symbols[1].name && symbols[1].name === symbols[2].name){
            iswin = true;
            winninglines.push(PAYLINES[i].name)
            const symbolpayout = SLOT_SYMBOLS.find(s => s.name === symbols[0].name).payout;
            payout += betAmount * symbolpayout;
        }
    }
    
    const MAX_PAYOUT = betAmount * 1000;
    payout = Math.min(payout , MAX_PAYOUT);
    return { iswin, winninglines, payout };
}

const pickSymbol = () => {
    const totalWeight = SLOT_SYMBOLS.reduce((sum , symbol) => sum + symbol.weight , 0);
    let randomNum = Math.random() * totalWeight;
    
    for(let i = 0; i < SLOT_SYMBOLS.length ; i++){
        randomNum -= SLOT_SYMBOLS[i].weight;
        if(randomNum < 0) return SLOT_SYMBOLS[i];
    }

}

module.exports = {spin};