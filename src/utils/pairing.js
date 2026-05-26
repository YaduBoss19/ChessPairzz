
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
export const calculateStandings = (players, rounds, tieBreaks) => {
    if (!Array.isArray(players)) return [];
    if (!Array.isArray(rounds)) return [];
    // Ensure default tiebreaks if missing or empty
    if (!tieBreaks || tieBreaks.length === 0) {
        tieBreaks = ['Points', 'BH-C1', 'BH', 'Wins', 'Direct', 'SB', 'BW'];
    }

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
        lastColor: null,
        colorHistory: [], // Full history of colors: 'W', 'B', or 'BYE'
        whiteCount: 0,
        blackCount: 0
    }));

    const playerMap = standings.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
    }, {});

    rounds.forEach(round => {
        if (!round) return;

        // 1. First record history of all pairings (regardless of result)
        if (Array.isArray(round.pairings)) {
            round.pairings.forEach(game => {
                const whitePlayer = playerMap[game.white?.id];
                const blackPlayer = playerMap[game.black?.id];
                if (whitePlayer && blackPlayer) {
                    whitePlayer.colorHistory.push('W');
                    whitePlayer.whiteCount++;
                    blackPlayer.colorHistory.push('B');
                    blackPlayer.blackCount++;
                }
            });
        }
        if (round.bye) {
            const byePlayer = playerMap[round.bye?.id];
            if (byePlayer) {
                byePlayer.colorHistory.push('BYE');
            }
        }

        // 2. Now process actual game results for points, wins, tie-breaks
        if (Array.isArray(round.pairings)) {
            round.pairings.forEach(game => {
                if (!game.result) return;

                const whitePlayer = playerMap[game.white?.id];
                const blackPlayer = playerMap[game.black?.id];

                if (!whitePlayer || !blackPlayer) return;

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
        }

        if (round.bye) {
            const byePlayer = playerMap[round.bye?.id];
            if (byePlayer) {
                byePlayer.points += 1;
                byePlayer.wins += 1; // FIDE usually counts BYE as a win for tie-breaks
            }
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
/**
 * Helper to check if a player can play a specific color under FIDE constraints.
 */
const canPlayColor = (player, color, constraints) => {
    const whiteCount = player.whiteCount || 0;
    const blackCount = player.blackCount || 0;
    const colorHistory = player.colorHistory || [];

    if (color === 'W') {
        if (whiteCount - blackCount >= constraints.maxColorDiff) {
            return false;
        }
        const playedColors = colorHistory.filter(c => c !== 'BYE');
        if (playedColors.length >= constraints.maxConsecutiveColor) {
            const lastN = playedColors.slice(-constraints.maxConsecutiveColor);
            if (lastN.every(c => c === 'W')) {
                return false;
            }
        }
    } else if (color === 'B') {
        if (blackCount - whiteCount >= constraints.maxColorDiff) {
            return false;
        }
        const playedColors = colorHistory.filter(c => c !== 'BYE');
        if (playedColors.length >= constraints.maxConsecutiveColor) {
            const lastN = playedColors.slice(-constraints.maxConsecutiveColor);
            if (lastN.every(c => c === 'B')) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Assigns colors to a pair of players based on their history and preferences,
 * returning { white, black } or null if incompatible.
 */
const assignColors = (p1, p2, constraints) => {
    const p1WhiteP2Black = canPlayColor(p1, 'W', constraints) && canPlayColor(p2, 'B', constraints);
    const p1BlackP2White = canPlayColor(p1, 'B', constraints) && canPlayColor(p2, 'W', constraints);

    if (!p1WhiteP2Black && !p1BlackP2White) {
        return null; // Incompatible
    }
    if (p1WhiteP2Black && !p1BlackP2White) {
        return { white: p1, black: p2 };
    }
    if (!p1WhiteP2Black && p1BlackP2White) {
        return { white: p2, black: p1 };
    }

    // Both assignments are valid under constraints, decide by preference
    const getPreference = (p) => {
        const diff = (p.whiteCount || 0) - (p.blackCount || 0);
        if (diff < 0) return 'W';
        if (diff > 0) return 'B';
        const playedColors = (p.colorHistory || []).filter(c => c !== 'BYE');
        if (playedColors.length > 0) {
            return playedColors[playedColors.length - 1] === 'W' ? 'B' : 'W';
        }
        return null;
    };

    const pref1 = getPreference(p1);
    const pref2 = getPreference(p2);

    if (pref1 && pref2 && pref1 !== pref2) {
        if (pref1 === 'W') return { white: p1, black: p2 };
        return { white: p2, black: p1 };
    }

    if (pref1 && !pref2) {
        if (pref1 === 'W') return { white: p1, black: p2 };
        return { white: p2, black: p1 };
    }

    if (!pref1 && pref2) {
        if (pref2 === 'W') return { white: p2, black: p1 };
        return { white: p1, black: p2 };
    }

    // Same preference or no preference
    const strength1 = Math.abs((p1.whiteCount || 0) - (p1.blackCount || 0));
    const strength2 = Math.abs((p2.whiteCount || 0) - (p2.blackCount || 0));

    if (strength1 !== strength2) {
        const dominantPlayer = strength1 > strength2 ? p1 : p2;
        const submissivePlayer = strength1 > strength2 ? p2 : p1;
        const domPref = getPreference(dominantPlayer);
        if (domPref === 'W' || domPref === null) {
            // Dominant player gets White
            return dominantPlayer === p1 ? { white: p1, black: p2 } : { white: p2, black: p1 };
        } else {
            // Dominant player gets Black
            return dominantPlayer === p1 ? { white: p2, black: p1 } : { white: p1, black: p2 };
        }
    }

    // Tie-breaker: Rating
    const r1 = p1.rating || 0;
    const r2 = p2.rating || 0;
    const p1IsHigher = r1 >= r2;

    const commonPref = pref1 || 'W'; // default to White preference if both null
    if (commonPref === 'W') {
        return p1IsHigher ? { white: p1, black: p2 } : { white: p2, black: p1 };
    } else {
        return p1IsHigher ? { white: p2, black: p1 } : { white: p1, black: p2 };
    }
};

export const generateSubsequentRound = (players, rounds) => {
    if (!Array.isArray(players)) return { pairings: [], bye: null };
    if (!Array.isArray(rounds)) return { pairings: [], bye: null };
    const standings = calculateStandings(players, rounds);
    const n = standings.length;

    // Check who already had a bye
    const hadBye = new Set();
    rounds.forEach(r => { if (r.bye) hadBye.add(r.bye.id); });

    // History of who played whom
    const history = {};
    players.forEach(p => history[p.id] = new Set());
    rounds.forEach(r => {
        r.pairings.forEach(g => {
            if (g.white && g.black) {
                history[g.white.id].add(g.black.id);
                history[g.black.id].add(g.white.id);
            }
        });
    });

    // Compute floater history
    const floaterHistory = {};
    players.forEach(p => floaterHistory[p.id] = []);

    for (let k = 1; k <= rounds.length; k++) {
        const prevRounds = rounds.slice(0, k - 1);
        const standingsBeforeK = calculateStandings(players, prevRounds);
        const scoreMap = standingsBeforeK.reduce((acc, p) => {
            acc[p.id] = p.points;
            return acc;
        }, {});

        const round = rounds[k - 1];
        if (round) {
            if (Array.isArray(round.pairings)) {
                round.pairings.forEach(game => {
                    const p1 = game.white?.id;
                    const p2 = game.black?.id;
                    if (p1 && p2) {
                        const score1 = scoreMap[p1] || 0;
                        const score2 = scoreMap[p2] || 0;
                        if (score1 > score2) {
                            floaterHistory[p1].push('DOWN');
                            floaterHistory[p2].push('UP');
                        } else if (score1 < score2) {
                            floaterHistory[p1].push('UP');
                            floaterHistory[p2].push('DOWN');
                        } else {
                            floaterHistory[p1].push(null);
                            floaterHistory[p2].push(null);
                        }
                    }
                });
            }
            if (round.bye) {
                const byeId = round.bye.id;
                if (byeId) {
                    floaterHistory[byeId].push('DOWN');
                }
            }
        }
    }

    let availablePlayers = [...standings];
    let bye = null;

    // 1. Bye Assignment
    if (n % 2 !== 0) {
        // Find bye player
        const candidates = availablePlayers.filter(p => !hadBye.has(p.id));
        let byeIdx = -1;
        if (candidates.length > 0) {
            // Sort candidates: points ascending, then rating ascending
            candidates.sort((a, b) => {
                if (a.points !== b.points) return a.points - b.points;
                return (a.rating || 0) - (b.rating || 0);
            });
            const chosenBye = candidates[0];
            byeIdx = availablePlayers.findIndex(p => p.id === chosenBye.id);
        } else {
            // Fallback: lowest score, lowest rating
            const sortedAll = [...availablePlayers].sort((a, b) => {
                if (a.points !== b.points) return a.points - b.points;
                return (a.rating || 0) - (b.rating || 0);
            });
            const chosenBye = sortedAll[0];
            byeIdx = availablePlayers.findIndex(p => p.id === chosenBye.id);
        }

        if (byeIdx !== -1) {
            bye = availablePlayers.splice(byeIdx, 1)[0];
        } else {
            bye = availablePlayers.pop();
        }
    }

    // Ultimate fallback function
    const runOriginalGreedy = (playersList) => {
        const list = [...playersList];
        const pairings = [];
        while (list.length >= 2) {
            const p1 = list.shift();
            let partnerIdx = -1;
            for (let i = 0; i < list.length; i++) {
                if (!history[p1.id].has(list[i].id)) {
                    partnerIdx = i;
                    break;
                }
            }
            if (partnerIdx === -1) partnerIdx = 0;
            const p2 = list.splice(partnerIdx, 1)[0];
            if ((p1.colorCount || 0) <= (p2.colorCount || 0)) {
                pairings.push({ white: p1, black: p2 });
            } else {
                pairings.push({ white: p2, black: p1 });
            }
        }
        return pairings;
    };

    // If no players to pair, return
    if (availablePlayers.length === 0) {
        return { pairings: [], bye };
    }

    const relaxationStages = [
        // Stage 1: Strict FIDE (max diff 2, max consecutive 2)
        { maxColorDiff: 2, maxConsecutiveColor: 2, allowRepeatOpponents: false },
        // Stage 2: Relaxed colors (max diff 3, max consecutive 3)
        { maxColorDiff: 3, maxConsecutiveColor: 3, allowRepeatOpponents: false },
        // Stage 3: No color constraints, but no repeat opponents
        { maxColorDiff: Infinity, maxConsecutiveColor: Infinity, allowRepeatOpponents: false }
    ];

    const solvePairings = (playersList, constraints) => {
        // Group players by points
        const groupsMap = {};
        playersList.forEach(p => {
            const s = p.points;
            if (!groupsMap[s]) {
                groupsMap[s] = [];
            }
            groupsMap[s].push(p);
        });

        const uniqueScores = Object.keys(groupsMap).map(Number).sort((a, b) => b - a);
        const groups = uniqueScores.map(score => ({
            score,
            players: groupsMap[score]
        }));

        let searchSteps = 0;
        const MAX_STEPS = 5000;

        const pairRemaining = (unpairedInGroup, groupIndex, floatersToNext, currentPairings) => {
            searchSteps++;
            if (searchSteps > MAX_STEPS) {
                return 'TIMEOUT';
            }

            if (unpairedInGroup.length === 0) {
                if (groupIndex === groups.length - 1) {
                    if (floatersToNext.length === 0) {
                        return currentPairings;
                    }
                    return null;
                }
                const nextGroupPlayers = [...groups[groupIndex + 1].players, ...floatersToNext];
                const standingIds = standings.map(p => p.id);
                nextGroupPlayers.sort((a, b) => standingIds.indexOf(a.id) - standingIds.indexOf(b.id));

                return pairRemaining(nextGroupPlayers, groupIndex + 1, [], currentPairings);
            }

            if (unpairedInGroup.length % 2 !== 0) {
                const nativeSet = new Set(groups[groupIndex].players.map(p => p.id));
                const candidates = [...unpairedInGroup];
                candidates.sort((a, b) => {
                    const aNative = nativeSet.has(a.id);
                    const bNative = nativeSet.has(b.id);

                    const aFloatedLast = floaterHistory[a.id]?.[floaterHistory[a.id].length - 1] === 'DOWN';
                    const bFloatedLast = floaterHistory[b.id]?.[floaterHistory[b.id].length - 1] === 'DOWN';

                    if (aNative && !bNative) return -1;
                    if (!aNative && bNative) return 1;

                    if (!aFloatedLast && bFloatedLast) return -1;
                    if (aFloatedLast && !bFloatedLast) return 1;

                    const standingIds = standings.map(p => p.id);
                    return standingIds.indexOf(b.id) - standingIds.indexOf(a.id);
                });

                for (const candidate of candidates) {
                    const remaining = unpairedInGroup.filter(p => p.id !== candidate.id);
                    const nextFloaters = [...floatersToNext, candidate];

                    const result = pairRemaining(remaining, groupIndex, nextFloaters, currentPairings);
                    if (result === 'TIMEOUT') return 'TIMEOUT';
                    if (result !== null) return result;
                }

                if (groupIndex < groups.length - 1) {
                    const nextGroupPlayers = [...groups[groupIndex + 1].players, ...unpairedInGroup];
                    const standingIds = standings.map(p => p.id);
                    nextGroupPlayers.sort((a, b) => standingIds.indexOf(a.id) - standingIds.indexOf(b.id));
                    return pairRemaining(nextGroupPlayers, groupIndex + 1, floatersToNext, currentPairings);
                }

                return null;
            } else {
                const p1 = unpairedInGroup[0];
                const partnerCandidates = unpairedInGroup.slice(1).filter(p2 => {
                    return !history[p1.id].has(p2.id);
                });

                const standingIds = standings.map(p => p.id);
                const p1Idx = standingIds.indexOf(p1.id);
                partnerCandidates.sort((a, b) => {
                    const diffA = Math.abs(standingIds.indexOf(a.id) - p1Idx);
                    const diffB = Math.abs(standingIds.indexOf(b.id) - p1Idx);
                    return diffA - diffB;
                });

                for (const p2 of partnerCandidates) {
                    const colorAssignment = assignColors(p1, p2, constraints);
                    if (colorAssignment) {
                        const remaining = unpairedInGroup.filter(p => p.id !== p1.id && p.id !== p2.id);
                        const result = pairRemaining(remaining, groupIndex, floatersToNext, [...currentPairings, colorAssignment]);
                        if (result === 'TIMEOUT') return 'TIMEOUT';
                        if (result !== null) return result;
                    }
                }

                if (groupIndex < groups.length - 1) {
                    const nextGroupPlayers = [...groups[groupIndex + 1].players, ...unpairedInGroup];
                    const standingIds = standings.map(p => p.id);
                    nextGroupPlayers.sort((a, b) => standingIds.indexOf(a.id) - standingIds.indexOf(b.id));
                    return pairRemaining(nextGroupPlayers, groupIndex + 1, floatersToNext, currentPairings);
                }

                return null;
            }
        };

        const firstGroupPlayers = [...groups[0].players];
        const result = pairRemaining(firstGroupPlayers, 0, [], []);
        return result;
    };

    let pairings = null;
    for (const stage of relaxationStages) {
        const res = solvePairings(availablePlayers, stage);
        if (res && res !== 'TIMEOUT') {
            pairings = res;
            break;
        }
    }

    if (!pairings) {
        pairings = runOriginalGreedy(availablePlayers);
    }

    return { pairings, bye };
};

/**
 * Generates Round Robin pairings for a specific round
 */
export const generateRoundRobinPairings = (players, roundNumber) => {
    if (!Array.isArray(players)) return { pairings: [], bye: null };
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
