const PAYLINES = [
    { name: 'Top Row',      coords: [[0, 0], [1, 0], [2, 0]] },
    { name: 'Middle Row',   coords: [[0, 1], [1, 1], [2, 1]] },
    { name: 'Bottom Row',   coords: [[0, 2], [1, 2], [2, 2]] },
    { name: 'Diagonal Down', coords: [[0, 0], [1, 1], [2, 2]] },
    { name: 'Diagonal Up',   coords: [[0, 2], [1, 1], [2, 0]] }
];

module.exports = PAYLINES;