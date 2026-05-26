import { calculateStandings, generateRound1, generateSubsequentRound } from './src/utils/pairing.js';

// Setup mock players (even number to test pairing without bye)
const players = [
    { id: '1', name: 'Player 1', rating: 2000 },
    { id: '2', name: 'Player 2', rating: 1900 },
    { id: '3', name: 'Player 3', rating: 1800 },
    { id: '4', name: 'Player 4', rating: 1700 },
    { id: '5', name: 'Player 5', rating: 1600 },
    { id: '6', name: 'Player 6', rating: 1500 }
];

console.log('Testing ChessPairzzz FIDE Dutch Swiss pairing constraints...');

// Helper to check for duplicate matchups
const checkDuplicateOpponents = (allRounds) => {
    const met = {};
    for (const round of allRounds) {
        for (const game of round.pairings) {
            const key1 = `${game.white.id}-${game.black.id}`;
            const key2 = `${game.black.id}-${game.white.id}`;
            if (met[key1] || met[key2]) {
                throw new Error(`CRITICAL: Duplicate matchup detected between ${game.white.name} and ${game.black.name}!`);
            }
            met[key1] = true;
        }
    }
    console.log('✅ PASS: No duplicate opponents played.');
};

// Helper to check color difference and consecutive color rules
const checkColorConstraints = (playersList, allRounds) => {
    const standings = calculateStandings(playersList, allRounds);
    for (const p of standings) {
        const colorDiff = Math.abs(p.whiteCount - p.blackCount);
        if (colorDiff > 2) {
            throw new Error(`CRITICAL: Player ${p.name} has invalid color difference: ${p.whiteCount} White, ${p.blackCount} Black (Diff = ${colorDiff})`);
        }

        const playedColors = p.colorHistory.filter(c => c !== 'BYE');
        let consecutiveCount = 0;
        let prevColor = null;
        for (const col of playedColors) {
            if (col === prevColor) {
                consecutiveCount++;
            } else {
                consecutiveCount = 1;
                prevColor = col;
            }
            if (consecutiveCount > 2) {
                throw new Error(`CRITICAL: Player ${p.name} has 3 consecutive same colors: ${playedColors.join(', ')}`);
            }
        }
    }
    console.log('✅ PASS: Color constraints satisfied (Max diff <= 2, Max consecutive <= 2).');
};

try {
    let rounds = [];

    // --- Round 1 ---
    console.log('\n--- Round 1 Seeding ---');
    const r1 = generateRound1(players);
    r1.pairings[0].result = '1-0'; // Player 1 wins over Player 4
    r1.pairings[1].result = '0-1'; // Player 2 wins over Player 5
    r1.pairings[2].result = '1/2-1/2'; // Player 3 and 6 draw
    rounds.push(r1);

    r1.pairings.forEach(g => {
        console.log(`Game: ${g.white.name} (White, rating: ${g.white.rating}) vs ${g.black.name} (Black, rating: ${g.black.name}) -> Result: ${g.result}`);
    });

    // --- Round 2 ---
    console.log('\n--- Round 2 Pairings ---');
    const r2 = generateSubsequentRound(players, rounds);
    r2.pairings[0].result = '1-0';
    r2.pairings[1].result = '1-0';
    r2.pairings[2].result = '1/2-1/2';
    rounds.push(r2);

    r2.pairings.forEach(g => {
        console.log(`Game: ${g.white.name} (White) vs ${g.black.name} (Black)`);
    });

    // --- Round 3 ---
    console.log('\n--- Round 3 Pairings ---');
    const r3 = generateSubsequentRound(players, rounds);
    r3.pairings[0].result = '1/2-1/2';
    r3.pairings[1].result = '1-0';
    r3.pairings[2].result = '0-1';
    rounds.push(r3);

    r3.pairings.forEach(g => {
        console.log(`Game: ${g.white.name} (White) vs ${g.black.name} (Black)`);
    });

    // --- Round 4 ---
    console.log('\n--- Round 4 Pairings ---');
    const r4 = generateSubsequentRound(players, rounds);
    r4.pairings.forEach(g => {
        console.log(`Game: ${g.white.name} (White) vs ${g.black.name} (Black)`);
    });
    rounds.push(r4);

    console.log('\n--- Validation ---');
    checkDuplicateOpponents(rounds);
    checkColorConstraints(players, rounds);
    
    console.log('\n🎉 ALL FIDE Swiss Pairing constraints test cases PASSED!');
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
