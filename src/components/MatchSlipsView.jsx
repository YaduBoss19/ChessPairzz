import React from 'react';

const MatchSlipsView = ({ round, tournamentMeta, onClose }) => {
    return (
        <div className="match-slips-modal fade-in">
            <div className="certificate-container" style={{ maxWidth: '800px', background: '#fff', color: '#000', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }} className="no-print">
                    <h2 style={{ margin: 0, color: '#000' }}>Print Match Slips</h2>
                    <div>
                        <button onClick={() => window.print()} className="btn-certificate-print" style={{ marginRight: '1rem' }}>Print Slips</button>
                        <button onClick={onClose} className="btn-ghost" style={{ border: '1px solid #000', color: '#000' }}>Close</button>
                    </div>
                </div>

                <div className="match-slips-grid">
                    {round.pairings.map((pair, idx) => (
                        <div key={idx} className="match-slip-card">
                            <div className="slip-header">
                                <strong>{tournamentMeta.name || "Chess Tournament"}</strong>
                                <span>Round {round.number} • Board {idx + 1}</span>
                            </div>
                            
                            <table className="slip-table">
                                <tbody>
                                    <tr>
                                        <td style={{ width: '40%' }}><strong>{pair.white.name}</strong><br/><small>{pair.white.rating}</small></td>
                                        <td style={{ width: '20%', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>vs</td>
                                        <td style={{ width: '40%', textAlign: 'right' }}><strong>{pair.black.name}</strong><br/><small>{pair.black.rating}</small></td>
                                    </tr>
                                    <tr>
                                        <td>Result: <span className="slip-box"></span></td>
                                        <td></td>
                                        <td style={{ textAlign: 'right' }}><span className="slip-box"></span> :Result</td>
                                    </tr>
                                    <tr>
                                        <td style={{ borderTop: '1px dotted #ccc', paddingTop: '10px' }}>White Signature</td>
                                        <td></td>
                                        <td style={{ borderTop: '1px dotted #ccc', paddingTop: '10px', textAlign: 'right' }}>Black Signature</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                    
                    {round.bye && (
                        <div className="match-slip-card">
                            <div className="slip-header">
                                <strong>{tournamentMeta.name || "Chess Tournament"}</strong>
                                <span>Round {round.number} • Board {round.pairings.length + 1}</span>
                            </div>
                            <table className="slip-table">
                                <tbody>
                                    <tr>
                                        <td><strong>{round.bye.name}</strong></td>
                                        <td style={{ textAlign: 'center' }}>Bye</td>
                                        <td></td>
                                    </tr>
                                    <tr><td colSpan="3" style={{ textAlign: 'center' }}><strong>1 - 0</strong></td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchSlipsView;
