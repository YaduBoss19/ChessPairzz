import React from 'react';

const PlayerBadgesView = ({ players, onExit }) => {
    
    // Split players into chunks of 6 or 8 for A4 page breaks
    const itemsPerPage = 8;
    const pages = [];
    for (let i = 0; i < players.length; i += itemsPerPage) {
        pages.push(players.slice(i, i + itemsPerPage));
    }

    return (
        <div style={{ background: '#fff', color: '#000', minHeight: '100vh' }} className="fade-in">
            <div className="no-print" style={{ padding: '2rem', textAlign: 'center', background: '#0f172a', color: '#fff' }}>
                <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Player Badges Generator</h1>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Generates A4-sized printable grids containing ID cards for every player.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => window.print()} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>🖨️ Print Badges</button>
                    <button className="btn-ghost" onClick={onExit} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>Go Back</button>
                </div>
            </div>

            {/* Print Area */}
            <div className="print-area">
                {pages.map((page, pIdx) => (
                    <div key={pIdx} style={{ 
                        pageBreakAfter: 'always', 
                        width: '210mm', height: '297mm', // A4 Sizes
                        margin: '0 auto', padding: '10mm',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', 
                        gridAutoRows: '70mm', gap: '10mm', background: '#fff' 
                    }}>
                        {page.map(player => (
                            <div key={player.id} style={{
                                border: '2px solid #333', borderRadius: '12px', padding: '15px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ background: '#0ea5e9', position: 'absolute', top: 0, left: 0, right: 0, height: '20px' }}></div>
                                <h3 style={{ margin: '20px 0 5px 0', fontSize: '1.5rem', textAlign: 'center' }}>{player.name}</h3>
                                <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#555' }}>
                                    {player.rating > 0 ? `Rating: ${player.rating}` : 'Unrated'}
                                </p>
                                
                                {/* Generates unique QR per player using standard API */}
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('Player:'+player.id)}`} 
                                    alt="Player QR" 
                                    style={{ width: '80px', height: '80px', marginBottom: '10px' }}
                                />
                                
                                <div style={{ fontSize: '0.6rem', color: '#888', textAlign: 'center' }}>
                                    chesspairzzz official ID
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            
            {/* Inject simple print css explicitly just in case */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body { background: #fff !important; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print-area { display: block !important; }
                    @page { margin: 0; size: A4; }
                }
            `}} />
        </div>
    );
};

export default PlayerBadgesView;
