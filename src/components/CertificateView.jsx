import React from 'react';

const CertificateView = ({ player, tournamentMeta, onClose }) => {
    return (
        <div className="certificate-modal fade-in">
            <div className="certificate-container">
                <div className="certificate-border">
                    <div className="certificate-inner-border">
                        <div className="certificate-header">
                            <h2 className="certificate-title">Certificate of Achievement</h2>
                            <p className="certificate-subtitle">Awarded to</p>
                        </div>
                        
                        <div className="certificate-recipient">
                            <h1 className="recipient-name">{player.name}</h1>
                            <div className="recipient-underline"></div>
                        </div>
                        
                        <div className="certificate-body">
                            <p>For participating in and demonstrating excellence at the</p>
                            <h3 className="tournament-name">{tournamentMeta.name || 'Chess Tournament'}</h3>
                            <p>Organized by <strong>{tournamentMeta.organizer || 'the Academy'}</strong></p>
                            
                            <div className="certificate-details">
                                <div className="detail-item">
                                    <span className="detail-label">Rank</span>
                                    <span className="detail-value">{player.rank}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Points</span>
                                    <span className="detail-value">{player.points}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Date</span>
                                    <span className="detail-value">{tournamentMeta.date || new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="certificate-footer">
                            <div className="signature-box">
                                <div className="signature-line"></div>
                                <span>{tournamentMeta.arbiter || 'Chief Arbiter'}</span>
                            </div>
                            <div className="certificate-stamp">
                                <div className="seal">CP</div>
                            </div>
                            <div className="signature-box">
                                <div className="signature-line"></div>
                                <span>{tournamentMeta.director || 'Tournament Director'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="certificate-actions no-print">
                    <button onClick={() => window.print()} className="btn-certificate-print">Print Certificate</button>
                    <button onClick={onClose} className="btn-ghost">Close</button>
                </div>
            </div>
        </div>
    );
};

export default CertificateView;
