import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, tenantId } from '../utils/firebase';
import { calculateStandings } from '../utils/pairing';

const LiveBroadcastView = () => {
    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [meta, setMeta] = useState({});
    const [standings, setStandings] = useState([]);
    const [liveTab, setLiveTab] = useState('standings'); // pairings, standings
    const [loading, setLoading] = useState(true);

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

    return (
        <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', color: '#f8fafc', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>🔴 LIVE RESULTS</span>
                <h1 style={{ margin: '0.5rem 0', fontSize: '1.8rem' }}>{meta.name || 'Chess Tournament'}</h1>
                <p style={{ opacity: 0.6, fontSize: '0.9rem', margin: 0 }}>
                    Location: {meta.location || 'Unknown'} • {meta.rounds || '?'} Rounds • {players.length} Players
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <button
                    onClick={() => setLiveTab('standings')}
                    style={{ flex: 1, padding: '0.8rem', background: liveTab === 'standings' ? '#0ea5e9' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                >
                    Standings
                </button>
                <button
                    onClick={() => setLiveTab('pairings')}
                    style={{ flex: 1, padding: '0.8rem', background: liveTab === 'pairings' ? '#0ea5e9' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                >
                    Current Round
                </button>
            </div>

            {liveTab === 'standings' && (
                <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>Rk</th>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Rtg</th>
                                <th style={{ padding: '1rem', color: '#0ea5e9' }}>Pts</th>
                                <th style={{ padding: '1rem' }}>BH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((p, i) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', color: i < 3 ? '#0ea5e9' : '#fff', fontWeight: i < 3 ? 'bold' : 'normal' }}>{i + 1}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.name}</td>
                                    <td style={{ padding: '1rem', opacity: 0.6 }}>{p.rating}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#0ea5e9' }}>{p.points}</td>
                                    <td style={{ padding: '1rem', opacity: 0.6 }}>{p.buchholzCut1}</td>
                                </tr>
                            ))}
                            {standings.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>No tournament data generated yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {liveTab === 'pairings' && activeRound && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center', color: '#0ea5e9' }}>Round {activeRound.number} of {meta.rounds}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {activeRound.pairings.map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{p.white.name} <div style={{ opacity: 0.5, fontWeight: 'normal', fontSize: '0.75rem' }}>Rtg: {p.white.rating}</div></div>
                                <div style={{ minWidth: '60px', textAlign: 'center', margin: '0 0.5rem', padding: '0.4rem 0.2rem', background: p.result ? 'rgba(14, 165, 233, 0.1)' : '#0f172a', border: p.result ? '1px solid #0ea5e9' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontWeight: 'bold', color: p.result ? '#0ea5e9' : '#fff', fontSize: '0.9rem' }}>
                                    {p.result === '1-0' || p.result === '+ -' ? '1 - 0' : p.result === '0-1' || p.result === '- +' ? '0 - 1' : p.result === '0.5-0.5' ? '½ - ½' : 'vs'}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left', fontWeight: 'bold' }}>{p.black.name} <div style={{ opacity: 0.5, fontWeight: 'normal', fontSize: '0.75rem' }}>Rtg: {p.black.rating}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {liveTab === 'pairings' && !activeRound && (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                    The tournament has not started the first round yet.
                </div>
            )}
        </div>
    );
};

export default LiveBroadcastView;
