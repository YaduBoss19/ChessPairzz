import React, { useState, useEffect } from 'react';
import { subscribeToTournament } from './firebase';
import './index.css';

function App() {
  const [tournamentData, setTournamentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read the tournament ID (slug) from the URL: e.g. live.chesspairzzz.com/my-tournament
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const slug = pathSegments[0] || 'demo'; // fall back to 'demo' if none provided

    const unsubscribe = subscribeToTournament(slug, (data) => {
      if (data) {
        setTournamentData(data);
        setError(null);
      } else {
        setError(`Tournament '${slug}' not found or inactive.`);
        setTournamentData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div><h1>Loading Live Standings...</h1></div>;
  }

  if (error) {
    return <div className="error-screen"><h1>{error}</h1><p>Please check the URL or ask the Arbiter if they have gone live.</p></div>;
  }

  const { tournamentMeta, standings } = tournamentData;

  return (
    <div className="web-portal">
      <nav className="top-nav">
        <div className="logo">CHESSPAIR<span>ZZZ</span> <span className="badge">LIVE</span></div>
      </nav>

      <header className="tournament-header">
        <h1>{tournamentMeta?.name || 'Live Tournament'}</h1>
        <div className="meta-info">
          <span>📅 {tournamentMeta?.date || '-'}</span>
          <span>📍 {tournamentMeta?.location || '-'}</span>
        </div>
      </header>

      <main className="portal-content">
        <div className="card">
          <h2>Official Standings</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player Name</th>
                  <th>Rating</th>
                  <th>Points</th>
                  <th>Buchholz</th>
                </tr>
              </thead>
              <tbody>
                {standings?.map((p, idx) => (
                  <tr key={idx} className={idx < 3 ? 'top-three' : ''}>
                    <td className="rank-cell">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="name-cell"><strong>{p.name}</strong></td>
                    <td className="rating-cell">{p.rating || 'UNR'}</td>
                    <td className="points-cell">{p.points}</td>
                    <td className="bh-cell">{p.buchholz || 0}</td>
                  </tr>
                ))}
                {!standings?.length && (
                  <tr><td colSpan="5" className="empty-state">No standings data available yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer>
        Powered by ChessPairzzz Cloud Server
      </footer>
    </div>
  );
}

export default App;
