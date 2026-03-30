import React from 'react';

const ReportCardView = ({ player, rank, standings, rounds, tournamentMeta, onExit }) => {
    
    // Calculate player's individual round performance
    const matchHistory = [];
    let wins = 0, draws = 0, losses = 0;
    
    rounds.forEach(r => {
        let played = false;
        r.pairings.forEach((p, bIdx) => {
            if (p.white.id === player.id) {
                played = true;
                matchHistory.push({ round: r.number, board: bIdx+1, color: 'White', opponent: p.black, result: p.result });
                if (p.result === '1-0' || p.result === '+ -') wins++;
                else if (p.result === '0-1' || p.result === '- +') losses++;
                else if (p.result === '0.5-0.5') draws++;
            } else if (p.black.id === player.id) {
                played = true;
                matchHistory.push({ round: r.number, board: bIdx+1, color: 'Black', opponent: p.white, result: p.result });
                if (p.result === '0-1' || p.result === '- +') wins++;
                else if (p.result === '1-0' || p.result === '+ -') losses++;
                else if (p.result === '0.5-0.5') draws++;
            }
        });
        if (r.bye && r.bye.id === player.id) {
            matchHistory.push({ round: r.number, board: 'BYE', color: 'N/A', opponent: { name: '---', rating: '' }, result: '1 (BYE)' });
            wins++;
        }
    });

    const standingData = standings.find(s => s.id === player.id) || {};

    return (
        <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '2rem' }} className="fade-in">
            <div className="no-print" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '12px' }}>
                    <button className="btn-primary" onClick={() => window.print()} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>🖨️ Print Report</button>
                    <button className="btn-ghost" onClick={onExit} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem', color: '#fff' }}>Back to Standings</button>
                </div>
            </div>

            {/* Print Area A4 */}
            <div className="print-area" style={{ 
                margin: '0 auto', maxWidth: '800px', padding: '40px', background: '#fff', 
                border: '2px solid #ccc', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
            }}>
                <div style={{ borderBottom: '4px solid #0ea5e9', paddingBottom: '20px', marginBottom: '30px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', margin: '0', color: '#0f172a', textTransform: 'uppercase' }}>CHESS PERFORMANCE REPORT</h1>
                    <h2 style={{ color: '#0ea5e9', margin: '10px 0 0 0' }}>{tournamentMeta?.name || 'Tournament'}</h2>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                    <div style={{ fontSize: '1.2rem' }}>
                        <div style={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>Player Details</div>
                        <h2 style={{ fontSize: '2.5rem', margin: '10px 0', color: '#111' }}>{player.name}</h2>
                        <div style={{ fontWeight: 'bold' }}>FIDE Rating: <span style={{ color: '#0ea5e9' }}>{player.rating || 'Unrated'}</span></div>
                        <div style={{ fontWeight: 'bold' }}>Final Rank: <span style={{ fontSize: '1.8rem', color: rank <= 3 ? '#fbbf24' : '#111' }}>#{rank}</span></div>
                        <div style={{ fontWeight: 'bold' }}>Total Points: <span style={{ color: '#10b981', fontSize: '1.5rem' }}>{standingData.points || 0}</span></div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ width: '120px', height: '120px', border: '5px solid #0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', margin: '0 0 10px auto' }}>
                            {Math.round(((wins + draws*0.5) / Math.max(1, rounds.length)) * 100)}%
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#666' }}>Win Rate</div>
                        
                        <div style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{wins} W</span> / 
                            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}> {draws} D</span> / 
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}> {losses} L</span>
                        </div>
                    </div>
                </div>

                <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Match History Breakdown</h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '1.1rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Round</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Board</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Color</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Opponent</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Rating</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matchHistory.map((m, i) => {
                            let resColor = '#64748b';
                            if (m.result.includes('1-0') && m.color === 'White') resColor = '#10b981';
                            else if (m.result.includes('0-1') && m.color === 'Black') resColor = '#10b981';
                            else if (m.result.includes('0.5-0.5')) resColor = '#f59e0b';
                            else if (m.result !== 'vs' && m.result !== '1 (BYE)') resColor = '#ef4444';
                            
                            if (m.result === '1 (BYE)') resColor = '#10b981';

                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>R{m.round}</td>
                                    <td style={{ padding: '15px' }}>{m.board}</td>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: m.color === 'White' ? '#94a3b8' : '#0f172a' }}>{m.color}</td>
                                    <td style={{ padding: '15px' }}>{m.opponent.name}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>{m.opponent.rating || '-'}</td>
                                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: resColor }}>{m.result}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                
                <div style={{ marginTop: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <hr style={{ borderColor: '#f1f5f9', marginBottom: '20px' }} />
                    Generated automatically by ChessPairzzz Tournament Software
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body { background: #fff !important; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; }
                    @page { margin: 10mm; size: A4; }
                }
            `}} />
        </div>
    );
};

export default ReportCardView;
