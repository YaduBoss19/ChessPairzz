
/**
 * Simplified Swiss Pairing Logic (Dutch System variant)
 */

export const RESULTS = {
    WHITE_WIN: '1-0',
    BLACK_WIN: '0-1',
    DRAW: '1/2-1/2',
    BYE: '1-0 (Bye)',
    WHITE_WALKOVER: '+ -',
    BLACK_WALKOVER: '- +'
};

/**
 * Generates Round 1 pairings: Top half vs Bottom half
 * @param {Array} players - List of player objects { id, name, rating }
 * @returns {Array} List of games { white, black, bye }
 */
export const generateRound1 = (players) => {
    const sortedPlayers = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const n = sortedPlayers.length;
    const pairings = [];
    let bye = null;

    const activePlayers = [...sortedPlayers];
    if (n % 2 !== 0) {
        // In Swiss, the lowest ranked player usually gets the bye in round 1
        bye = activePlayers.pop();
    }

    const half = activePlayers.length / 2;
    const top = activePlayers.slice(0, half);
    const bottom = activePlayers.slice(half);

    for (let i = 0; i < half; i++) {
        // Alternate white/black assignment for top half
        if (i % 2 === 0) {
            pairings.push({ white: top[i], black: bottom[i] });
        } else {
            pairings.push({ white: bottom[i], black: top[i] });
        }
    }

    return { pairings, bye };
};

/**
 * Calculates current standings based on tournament history with FIDE tie-breaks
 */
export const calculateStandings = (players, rounds, tieBreaks = ['Points', 'BH-C1', 'BH', 'Wins', 'Direct', 'SB', 'BW']) => {
    const standings = players.map(p => ({
        ...p,
        points: 0,
        opponents: [], // Store opponent IDs for Buchholz
        gameResults: {}, // Store results against specific opponents for Direct Encounter
        wins: 0,
        blackWins: 0,
        sonnebornBerger: 0,
        buchholz: 0,
        buchholzCut1: 0,
        colorCount: 0,
        lastColor: null
    }));

    const playerMap = standings.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
    }, {});

    rounds.forEach(round => {
        round.pairings.forEach(game => {
            if (!game.result) return;

            const whitePlayer = playerMap[game.white.id];
            const blackPlayer = playerMap[game.black.id];

            whitePlayer.opponents.push(blackPlayer.id);
            blackPlayer.opponents.push(whitePlayer.id);

            whitePlayer.colorCount++;
            whitePlayer.lastColor = 'W';
            blackPlayer.colorCount--;
            blackPlayer.lastColor = 'B';

            // Store results for Direct Encounter
            if (game.result === RESULTS.WHITE_WIN || game.result === RESULTS.WHITE_WALKOVER) {
                whitePlayer.points += 1;
                whitePlayer.wins += 1;
                whitePlayer.gameResults[blackPlayer.id] = 1;
                blackPlayer.gameResults[whitePlayer.id] = 0;
            } else if (game.result === RESULTS.BLACK_WIN || game.result === RESULTS.BLACK_WALKOVER) {
                blackPlayer.points += 1;
                blackPlayer.wins += 1;
                blackPlayer.blackWins += 1;
                blackPlayer.gameResults[whitePlayer.id] = 1;
                whitePlayer.gameResults[blackPlayer.id] = 0;
            } else if (game.result === RESULTS.DRAW) {
                whitePlayer.points += 0.5;
                blackPlayer.points += 0.5;
                whitePlayer.gameResults[blackPlayer.id] = 0.5;
                blackPlayer.gameResults[whitePlayer.id] = 0.5;
            }
        });

        if (round.bye) {
            const byePlayer = playerMap[round.bye.id];
            byePlayer.points += 1;
            byePlayer.wins += 1; // FIDE usually counts BYE as a win for tie-breaks
        }
    });

    // Calculate Buchholz and Sonneborn-Berger
    standings.forEach(p => {
        let opponentScores = [];
        p.opponents.forEach(oppId => {
            const opp = playerMap[oppId];
            if (!opp) return;

            opponentScores.push(opp.points);
            p.buchholz += opp.points;

            // Sonneborn-Berger calculation
            const result = p.gameResults[oppId];
            if (result === 1) {
                p.sonnebornBerger += opp.points;
            } else if (result === 0.5) {
                p.sonnebornBerger += (opp.points * 0.5);
            }
        });

        // Buchholz Cut 1: exclude lowest score
        if (opponentScores.length > 0) {
            const minScore = Math.min(...opponentScores);
            p.buchholzCut1 = p.buchholz - minScore;
        } else {
            p.buchholzCut1 = 0;
        }
    });

    // Sorting based on provided tie-breaks list
    return standings.sort((a, b) => {
        for (const tb of tieBreaks) {
            if (tb === 'Points' && b.points !== a.points) return b.points - a.points;
            if (tb === 'BH-C1' && b.buchholzCut1 !== a.buchholzCut1) return b.buchholzCut1 - a.buchholzCut1;
            if (tb === 'BH' && b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
            if (tb === 'Wins' && b.wins !== a.wins) return b.wins - a.wins;
            if (tb === 'Direct') {
                const directResult = a.gameResults[b.id];
                if (directResult !== undefined) {
                    const bDirectResult = b.gameResults[a.id];
                    if (directResult > bDirectResult) return -1;
                    if (directResult < bDirectResult) return 1;
                }
            }
            if (tb === 'SB' && b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
            if (tb === 'BW' && b.blackWins !== a.blackWins) return b.blackWins - a.blackWins;
        }
        
        // Rating (as fallback)
        return (b.rating || 0) - (a.rating || 0);
    });
};

/**
 * Generates subsequent round pairings based on scores
 * Uses a greedy approach for simplicity: match highest available players
 */
export const generateSubsequentRound = (players, rounds) => {
    const standings = calculateStandings(players, rounds);
    const n = standings.length;
    const pairings = [];
    let bye = null;

    // History of who played whom
    const history = {};
    players.forEach(p => history[p.id] = new Set());
    rounds.forEach(r => {
        r.pairings.forEach(g => {
            history[g.white.id].add(g.black.id);
            history[g.black.id].add(g.white.id);
        });
    });

    // Check who already had a bye
    const hadBye = new Set();
    rounds.forEach(r => { if (r.bye) hadBye.add(r.bye.id); });

    let availablePlayers = [...standings];

    // Bye logic
    if (n % 2 !== 0) {
        // Find the lowest ranked player who hasn't had a bye
        for (let i = availablePlayers.length - 1; i >= 0; i--) {
            if (!hadBye.has(availablePlayers[i].id)) {
                bye = availablePlayers.splice(i, 1)[0];
                break;
            }
        }
        // Fallback if everyone had a bye (rare)
        if (!bye) bye = availablePlayers.pop();
    }

    // Matching logic
    while (availablePlayers.length >= 2) {
        const p1 = availablePlayers.shift();
        let partnerIdx = -1;

        // Try to find a player with similar score who p1 hasn't played
        for (let i = 0; i < availablePlayers.length; i++) {
            if (!history[p1.id].has(availablePlayers[i].id)) {
                partnerIdx = i;
                break;
            }
        }

        // Fallback: match with first available (should ideally backtrack, but greedy for now)
        if (partnerIdx === -1) partnerIdx = 0;

        const p2 = availablePlayers.splice(partnerIdx, 1)[0];

        // Simple color balance: who had white fewer times?
        if (p1.colorCount <= p2.colorCount) {
            pairings.push({ white: p1, black: p2 });
        } else {
            pairings.push({ white: p2, black: p1 });
        }
    }

    return { pairings, bye };
};

/**
 * Generates Round Robin pairings for a specific round
 */
export const generateRoundRobinPairings = (players, roundNumber) => {
    let participants = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const n = participants.length;
    
    if (n % 2 !== 0) {
        participants.push({ id: 'dummy-bye', name: 'Bye', rating: 0 });
    }
    
    const numPlayers = participants.length;
    const fixed = participants[0];
    const rotating = participants.slice(1);
    
    const rotation = (roundNumber - 1) % rotating.length;
    const rotated = [
        ...rotating.slice(rotating.length - rotation),
        ...rotating.slice(0, rotating.length - rotation)
    ];
    
    const currentOrder = [fixed, ...rotated];
    const half = numPlayers / 2;
    
    const pairings = [];
    let bye = null;
    
    for (let i = 0; i < half; i++) {
        let p1 = currentOrder[i];
        let p2 = currentOrder[numPlayers - 1 - i];
        
        if (i === 0 && roundNumber % 2 === 0) {
            let temp = p1; p1 = p2; p2 = temp;
        } else if (i !== 0 && i % 2 === 1) {
            let temp = p1; p1 = p2; p2 = temp;
        }

        if (p1.id === 'dummy-bye') {
            bye = p2;
        } else if (p2.id === 'dummy-bye') {
            bye = p1;
        } else {
            pairings.push({ white: p1, black: p2 });
        }
    }
    
    return { pairings, bye };
};
