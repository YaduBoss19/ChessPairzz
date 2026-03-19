import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, tenantId } from '../utils/firebase';
import { calculateStandings } from '../utils/pairing';

const LiveBroadcastView = () => {
    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [meta, setMeta] = useState({});
    const [standings, setStandings] = useState([]);
    const [liveTab, setLiveTab] = useState('pairings'); // default to pairings which they want to see via QR
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'chess_tournaments', tenantId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const p = data.players || [];
                const r = data.rounds || [];
                const m = data.tournamentMeta || {};
                
                setPlayers(p);
                setRounds(r);
                setMeta(m);
                
                if (r.length > 0) {
                    setStandings(calculateStandings(p, r, m.tieBreaks || []));
                }
            }
            setLoading(false);
        });
        return () => unsub(); // Clean up listener on unmount
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff' }}>
                <h2 style={{ animation: 'pulse 1.5s infinite' }}>🔴 Syncing Live Data...</h2>
            </div>
        );
    }

    const activeRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

    // Filter Logic based on Name or "Serial Number" (Initial Rating Rank or ID)
    // To make it super simple, we filter based on text entry
    const q = searchQuery.toLowerCase().trim();

    const filteredStandings = standings.filter((p, i) => {
        if (!q) return true;
        const serialNumber = (i + 1).toString();
        return p.name.toLowerCase().includes(q) || serialNumber === q;
    });

    const filteredPairings = activeRound ? activeRound.pairings.filter(p => {
        if (!q) return true;
        return p.white.name.toLowerCase().includes(q) || p.black.name.toLowerCase().includes(q) || p.white.id === q || p.black.id === q;
    }) : [];

    return (
        <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', color: '#f8fafc', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#0ea5e9', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔴 LIVE BROADCAST</div>
                <h1 style={{ margin: '0', fontSize: '1.8rem' }}>{meta.name || 'Chess Tournament'}</h1>
                <div style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {meta.rounds || '?'} Rounds • {players.length} Players
                </div>
            </div>

            {/* Massive Search Bar for Player / Serial Number */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Search name or serial number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                        width: '100%', 
                        padding: '1.2rem', 
                        borderRadius: '16px', 
                        border: '2px solid rgba(14, 165, 233, 0.4)', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: '#fff', 
                        fontSize: '1.1rem', 
                        outline: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setLiveTab('pairings')}
                    style={{ flex: 1, padding: '1rem', background: liveTab === 'pairings' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    My Pairing
                </button>
                <button
                    onClick={() => setLiveTab('standings')}
                    style={{ flex: 1, padding: '1rem', background: liveTab === 'standings' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Rankings
                </button>
            </div>

            {liveTab === 'pairings' && activeRound && (
                <div>
                    {q && <div style={{ marginBottom: '1rem', opacity: 0.7 }}>Showing your board for Round {activeRound.number}...</div>}
                    {!q && <div style={{ marginBottom: '1rem', opacity: 0.7, textAlign: 'center' }}>Round {activeRound.number} Pairings</div>}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredPairings.map((p, idx) => (
                            <div key={idx} style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{p.white.name}</div>
                                        <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Rtg: {p.white.rating}</div>
                                    </div>
                                    
                                    <div style={{ margin: '0 1rem', padding: '0.5rem 1rem', background: p.result ? 'rgba(14, 165, 233, 0.2)' : '#0f172a', border: p.result ? '1px solid #0ea5e9' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: 'bold', color: p.result ? '#0ea5e9' : '#fff', fontSize: '1rem' }}>
                                        {p.result === '1-0' || p.result === '+ -' ? '1 - 0' : p.result === '0-1' || p.result === '- +' ? '0 - 1' : p.result === '0.5-0.5' ? '½ - ½' : 'vs'}
                                    </div>
                                    
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{p.black.name}</div>
                                        <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Rtg: {p.black.rating}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredPairings.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No pairing found matching "{q}".</div>
                        )}
                    </div>
                </div>
            )}

            {liveTab === 'pairings' && !activeRound && (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                    The tournament has not started yet.
                </div>
            )}

            {liveTab === 'standings' && (
                <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>#</th>
                                <th style={{ padding: '1rem' }}>Player</th>
                                <th style={{ padding: '1rem', color: '#0ea5e9' }}>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStandings.map((p, i) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', color: i < 3 && !q ? '#0ea5e9' : '#fff', fontWeight: i < 3 && !q ? 'bold' : 'normal' }}>
                                        {q ? p.rank || i + 1 : i + 1}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.name}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#0ea5e9' }}>{p.points}</td>
                                </tr>
                            ))}
                            {filteredStandings.length === 0 && (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>No players found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LiveBroadcastView;
