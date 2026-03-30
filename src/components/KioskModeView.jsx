import React, { useState } from 'react';

const KioskModeView = ({ rounds, onExit }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPairing, setSelectedPairing] = useState(null);

    const activeRound = rounds.length > 0 && !rounds[rounds.length - 1].completed 
        ? rounds[rounds.length - 1] 
        : null;

    if (!activeRound) {
        return (
            <div className="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                <h1 className="neon-text" style={{ fontSize: '4rem', marginBottom: '1rem' }}>No Active Round</h1>
                <p style={{ opacity: 0.6, fontSize: '1.5rem', marginBottom: '2rem' }}>Please wait for the Arbiter to start the next round.</p>
                <button className="btn-ghost" onClick={onExit} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>Back to Organizer Dashboard</button>
            </div>
        );
    }

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setSelectedPairing(null);
    };

    const handleSelectPlayer = (pairing, isWhite, boardNum) => {
        setSelectedPairing({
            board: boardNum,
            player: isWhite ? pairing.white : pairing.black,
            playingAs: isWhite ? 'White' : 'Black',
            opponent: isWhite ? pairing.black : pairing.white,
            result: pairing.result
        });
        setSearchQuery('');
    };

    // Filter pairings loosely based on name search
    const filteredPairings = [];
    if (searchQuery.length > 1) {
        activeRound.pairings.forEach((p, idx) => {
            if (p.white.name.toLowerCase().includes(searchQuery)) {
                filteredPairings.push({ ...p, matchPlayer: 'white', boardNum: idx + 1 });
            }
            if (p.black.name.toLowerCase().includes(searchQuery)) {
                filteredPairings.push({ ...p, matchPlayer: 'black', boardNum: idx + 1 });
            }
        });
        if (activeRound.bye && activeRound.bye.name.toLowerCase().includes(searchQuery)) {
            filteredPairings.push({ bye: true, matchPlayer: 'white', player: activeRound.bye, boardNum: activeRound.pairings.length + 1 });
        }
    }

    return (
        <div className="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem' }}>
            
            <button className="btn-ghost" onClick={onExit} style={{ position: 'absolute', top: '2rem', left: '2rem', fontSize: '1rem' }}>Exit Kiosk Mode</button>
            
            <h1 className="hero-logo" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>CHESSPAIR<span style={{ color: 'var(--primary)' }}>ZZZ</span> KIOSK</h1>
            <div style={{ background: 'var(--primary)', color: '#0f172a', fontWeight: 'bold', padding: '0.5rem 2rem', borderRadius: '50px', fontSize: '1.5rem', marginBottom: '3rem' }}>
                ROUND {activeRound.number}
            </div>

            {!selectedPairing ? (
                <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center' }}>
                    <input
                        type="text"
                        placeholder="Type your name to find your board..."
                        value={searchQuery}
                        onChange={handleSearch}
                        style={{
                            width: '100%', padding: '2rem', fontSize: '2.5rem', borderRadius: '24px', border: '3px solid var(--primary)',
                            background: 'rgba(255,255,255,0.1)', color: '#fff', textAlign: 'center', outline: 'none', boxShadow: '0 0 40px rgba(14, 165, 233, 0.3)'
                        }}
                        autoFocus
                    />

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredPairings.map((p, idx) => (
                            <button 
                                key={idx}
                                className="glass-card" 
                                style={{ padding: '1.5rem', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.1)' } }}
                                onClick={() => p.bye ? handleSelectPlayer({ white: p.player, black: {name: 'BYE'}, result: '*' }, true, p.boardNum) : handleSelectPlayer(p, p.matchPlayer === 'white', p.boardNum)}
                            >
                                Tap here if you are <strong>{p.bye ? p.player.name : (p.matchPlayer === 'white' ? p.white.name : p.black.name)}</strong>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '800px', textAlign: 'center', padding: '4rem', border: selectedPairing.playingAs === 'White' ? '3px solid #fff' : '3px solid #333', background: selectedPairing.playingAs === 'White' ? 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' : 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4))' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: selectedPairing.playingAs === 'White' ? '#fff' : '#ccc' }}>Welcome, {selectedPairing.player.name}!</h2>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '3rem' }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', opacity: 0.7 }}>You are playing</div>
                            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: selectedPairing.playingAs === 'White' ? '#fff' : '#000', textShadow: selectedPairing.playingAs === 'White' ? '0 0 10px rgba(255,255,255,0.5)' : 'none', background: selectedPairing.playingAs === 'Black' ? '#fff' : 'transparent', padding: '0 1rem', borderRadius: '12px' }}>
                                {selectedPairing.playingAs.toUpperCase()}
                            </div>
                        </div>

                        <div style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', height: '100px', margin: '0 2rem' }}></div>
                        
                        <div>
                            <div style={{ fontSize: '1.5rem', opacity: 0.7 }}>Your Board Number is</div>
                            <div style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {selectedPairing.board}
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '2rem', background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '16px', display: 'inline-block' }}>
                        <span style={{ opacity: 0.7 }}>Against:</span> <strong>{selectedPairing.opponent.name} {selectedPairing.opponent.rating ? `(${selectedPairing.opponent.rating})` : ''}</strong>
                    </div>

                    <div style={{ marginTop: '4rem' }}>
                        <button className="btn-primary" onClick={() => setSelectedPairing(null)} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>DONE / OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KioskModeView;
