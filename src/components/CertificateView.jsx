import React from 'react';

const CertificateView = ({ players, tournamentMeta, onClose }) => {
    // If a single player is passed, wrap it in an array for backward compatibility
    const playerList = Array.isArray(players) ? players : [players];

    return (
        <div className="certificate-modal fade-in" style={{ padding: '0', display: 'block', overflowY: 'auto', background: '#e2e8f0' }}>
            
            <div className="certificate-actions no-print" style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', zIndex: 100, borderBottom: '2px solid #0ea5e9', backdropFilter: 'blur(10px)' }}>
                <h3 className="neon-text" style={{ margin: 0 }}>Certificate Generator ({playerList.length})</h3>
                <div>
                    <button onClick={() => window.print()} className="btn-certificate-print" style={{ marginRight: '1rem' }}>🖨️ Print All Certificates</button>
                    <button onClick={onClose} className="btn-ghost">Close View</button>
                </div>
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4rem' }}>
                {playerList.map((player, idx) => (
                    <div key={idx} style={{ pageBreakAfter: idx < playerList.length - 1 ? 'always' : 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <div className="certificate-container" style={{ maxWidth: '1000px', width: '100%' }}>
                            <div className="certificate-border" style={{ background: '#fdfbf7', padding: '1rem', border: '15px solid #0f172a', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                                <div className="certificate-inner-border" style={{ border: '4px double #cbd5e1', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#1e293b' }}>
                                    
                                    <div className="certificate-header">
                                        <h2 className="certificate-title" style={{ fontFamily: 'Syncopate, sans-serif', fontSize: '3rem', color: '#0ea5e9', margin: '0 0 1rem 0', letterSpacing: '3px', textTransform: 'uppercase' }}>
                                            Certificate of Achievement
                                        </h2>
                                        <p className="certificate-subtitle" style={{ fontSize: '1.4rem', fontStyle: 'italic', letterSpacing: '2px', color: '#64748b' }}>
                                            This certificate is proudly awarded to
                                        </p>
                                    </div>
                                    
                                    <div className="certificate-recipient" style={{ width: '100%', margin: '2rem 0' }}>
                                        <h1 className="recipient-name" style={{ fontSize: '4.5rem', fontWeight: '800', fontFamily: 'serif', color: '#0f172a', borderBottom: '2px solid #0ea5e9', display: 'inline-block', padding: '0 3rem 1rem 3rem' }}>
                                            {player.name}
                                        </h1>
                                    </div>
                                    
                                    <div className="certificate-body" style={{ fontSize: '1.3rem', lineHeight: '1.8', maxWidth: '700px' }}>
                                        <p>In recognition of demonstrating outstanding skill, participation, and competitive excellence at the</p>
                                        <h3 className="tournament-name" style={{ fontSize: '2rem', color: '#0284c7', margin: '1.5rem 0', textTransform: 'uppercase' }}>
                                            {tournamentMeta.name || 'Official Chess Tournament'}
                                        </h3>
                                        <p>Organized globally by <strong>{tournamentMeta.organizer || 'the Grand Chess Academy'}</strong></p>
                                        
                                        <div className="certificate-details" style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '3rem', background: 'rgba(14, 165, 233, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                            <div className="detail-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                                <span className="detail-label" style={{fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px'}}>Final Rank</span>
                                                <span className="detail-value" style={{fontSize: '2rem', fontWeight: '900', color: '#0f172a'}}>#{player.rank || '-'}</span>
                                            </div>
                                            <div style={{width: '2px', background: 'rgba(14, 165, 233, 0.2)'}}></div>
                                            <div className="detail-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                                <span className="detail-label" style={{fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px'}}>Total Points</span>
                                                <span className="detail-value" style={{fontSize: '2rem', fontWeight: '900', color: '#0f172a'}}>{player.points || '-'}</span>
                                            </div>
                                            <div style={{width: '2px', background: 'rgba(14, 165, 233, 0.2)'}}></div>
                                            <div className="detail-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                                <span className="detail-label" style={{fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px'}}>Official Date</span>
                                                <span className="detail-value" style={{fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', paddingTop: '0.3rem'}}>{tournamentMeta.date || new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="certificate-footer" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '5rem', padding: '0 2rem' }}>
                                        <div className="signature-box" style={{ width: '250px', textAlign: 'center' }}>
                                            <div className="signature-line" style={{ borderBottom: '2px solid #1e293b', marginBottom: '1rem', height: '50px' }}></div>
                                            <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{tournamentMeta.arbiter || 'Chief Arbiter'}</span><br/>
                                            <span style={{fontSize: '0.9rem', color: '#64748b'}}>Chief Arbiter</span>
                                        </div>
                                        
                                        <div className="certificate-stamp" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '6px double #0ea5e9', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(14, 165, 233, 0.1) inset' }}>
                                            <div style={{textAlign: 'center', color: '#0ea5e9'}}>
                                                <div style={{fontSize: '1rem', fontWeight: '900', letterSpacing: '1px'}}>CHESS</div>
                                                <div style={{fontSize: '0.8rem', letterSpacing: '3px'}}>SEAL</div>
                                            </div>
                                        </div>
                                        
                                        <div className="signature-box" style={{ width: '250px', textAlign: 'center' }}>
                                            <div className="signature-line" style={{ borderBottom: '2px solid #1e293b', marginBottom: '1rem', height: '50px' }}></div>
                                            <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{tournamentMeta.director || 'Tournament Director'}</span><br/>
                                            <span style={{fontSize: '0.9rem', color: '#64748b'}}>Tournament Director</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CertificateView;
