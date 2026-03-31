import React, { useEffect, useRef } from 'react';

const TVModeView = ({ activeRound, standings, onExit }) => {
    const scrollContainerRef = useRef(null);

    // Auto-scrolling logic for TV Mode
    useEffect(() => {
        let scrollInterval;
        let distance = 0;
        
        if (scrollContainerRef.current) {
            scrollInterval = setInterval(() => {
                const element = scrollContainerRef.current;
                distance += 1.5; // Scroll speed
                if (distance > element.scrollHeight - element.clientHeight + 200) {
                    distance = 0; // Reset scroll instantly or smoothly
                    element.scrollTo({ top: 0, behavior: 'auto' });
                } else {
                    element.scrollTo({ top: distance, behavior: 'auto' });
                }
            }, 30);
        }
        
        return () => clearInterval(scrollInterval);
    }, []);

    if (!activeRound) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#fff' }}>
            <h2>No active round available for TV display.</h2>
            <button className="btn-ghost" onClick={onExit} style={{position: 'absolute', top: 20, left: 20}}>Exit TV Mode</button>
        </div>
    );

    return (
        <div style={{ background: '#020617', color: '#fff', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 99999 }}>
            {/* Header */}
            <div style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to bottom, #0ea5e9, #020617)' }}>
                <div>
                    <button className="btn-ghost" onClick={onExit} style={{ position: 'absolute', top: '10px', left: '10px', padding: '5px 10px', fontSize: '0.8rem', opacity: 0.5 }}>◂ Exit TV</button>
                    <h1 style={{ fontSize: '4rem', margin: '10px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 20px rgba(14, 165, 233, 0.8)' }}>
                        Round {activeRound.number} Pairings
                    </h1>
                </div>
                <div>
                    <div style={{ fontSize: '1.2rem', textAlign: 'right', opacity: 0.8 }}>Please find your board</div>
                    <div className="neon-text" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>AUTO-SCROLLING</div>
                </div>
            </div>

            {/* Scrolling Content Area */}
            <div ref={scrollContainerRef} style={{ height: 'calc(100vh - 150px)', overflowY: 'hidden', padding: '2rem 4rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '2.5rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(56, 189, 248, 0.2)', textTransform: 'uppercase', color: '#38bdf8' }}>
                            <th style={{ padding: '2rem', textAlign: 'center', width: '15%', borderBottom: '2px solid #38bdf8' }}>Board</th>
                            <th style={{ padding: '2rem', textAlign: 'right', width: '35%', borderBottom: '2px solid #38bdf8' }}>White <span style={{fontSize: '1.5rem', opacity: 0.7}}>●</span></th>
                            <th style={{ padding: '2rem', textAlign: 'center', width: '10%', borderBottom: '2px solid #38bdf8' }}>Result</th>
                            <th style={{ padding: '2rem', textAlign: 'left', width: '35%', borderBottom: '2px solid #38bdf8' }}><span style={{fontSize: '1.5rem', opacity: 0.7}}>○</span> Black</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeRound.pairings.map((p, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '2rem', textAlign: 'center', fontWeight: 'bold', color: '#0ea5e9' }}>{idx + 1}</td>
                                <td style={{ padding: '2rem', textAlign: 'right', fontWeight: 'bold' }}>{p.white.name} <span style={{fontSize: '1.2rem', opacity: 0.5}}>{p.white.rating || ''}</span></td>
                                <td style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>{p.result || 'vs'}</td>
                                <td style={{ padding: '2rem', textAlign: 'left', fontWeight: 'bold', color: '#cbd5e1' }}>{p.black.name} <span style={{fontSize: '1.2rem', opacity: 0.5}}>{p.black.rating || ''}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ height: '50vh' }}></div> {/* Spacer to let the last item scroll up completely */}
            </div>
            
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>
        </div>
    );
};

export default TVModeView;
