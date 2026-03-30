import React, { useState, useEffect } from 'react';
import { generateRound1, generateSubsequentRound, generateRoundRobinPairings, calculateStandings, RESULTS } from './utils/pairing';
import * as XLSX from 'xlsx';
import { saveToDB, loadFromDB, clearDB, syncToGoogleSheets } from './utils/storage';
import AuthView from './components/AuthView';
import PaymentGatewayView from './components/PaymentGatewayView';
import CertificateView from './components/CertificateView';
import MatchSlipsView from './components/MatchSlipsView';
import KioskModeView from './components/KioskModeView';
import PlayerBadgesView from './components/PlayerBadgesView';
import ReportCardView from './components/ReportCardView';

const App = () => {
    // --- Persistence (IndexedDB) ---
    const [dbInitialized, setDbInitialized] = useState(false);

    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [tournamentStarted, setTournamentStarted] = useState(false);
    const [tournamentMeta, setTournamentMeta] = useState({
        organizer: '', federation: '', director: '', arbiter: '', timeControl: '', location: '',
        rounds: 5, type: 'Swiss', calculation: 'FIDE', date: new Date().toISOString().split('T')[0],
        tieBreaks: ['Points', 'BH-C1', 'BH', 'Wins', 'Direct', 'SB', 'BW']
    });

    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [selectedCertificatePlayer, setSelectedCertificatePlayer] = useState(null);
    const [selectedReportPlayer, setSelectedReportPlayer] = useState(null);
    const [printingSlipsRound, setPrintingSlipsRound] = useState(null);
    
    // Feature States
    const [fideId, setFideId] = useState('');
    const [isFetchingFide, setIsFetchingFide] = useState(false);
    const [theme, setTheme] = useState('dark');

    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [playerRating, setPlayerRating] = useState('');
    const [playerAge, setPlayerAge] = useState('');
    const [bulkText, setBulkText] = useState('');
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [showBulkEntry, setShowBulkEntry] = useState(false);
    const [sortBy, setSortBy] = useState('default'); // 'default' or 'alpha'
    const [standings, setStandings] = useState([]);
    const [selectedRoundIndex, setSelectedRoundIndex] = useState(null);
    const [dashboardTab, setDashboardTab] = useState('ranking'); // ranking, alpha, stats, schedule

    useEffect(() => {
        const loadInitialData = async () => {
            const dbPlayers = await loadFromDB('players', []);
            const dbRounds = await loadFromDB('rounds', []);
            const dbStarted = await loadFromDB('tournamentStarted', false);
            const dbMeta = await loadFromDB('tournamentMeta', {
                organizer: '', federation: '', director: '', arbiter: '', timeControl: '', location: '',
                rounds: 5, type: 'Swiss', calculation: 'FIDE', date: new Date().toISOString().split('T')[0],
                tieBreaks: ['Points', 'BH-C1', 'BH', 'Wins', 'Direct', 'SB', 'BW']
            });
            const dbUsers = await loadFromDB('users', []);
            const dbCurrentUser = await loadFromDB('currentUser', null);
            const dbTheme = await loadFromDB('theme', 'dark');

            setPlayers(dbPlayers);
            setRounds(dbRounds);
            setTournamentStarted(dbStarted);
            setTournamentMeta(dbMeta);
            setUsers(dbUsers);
            setCurrentUser(dbCurrentUser);
            setTheme(dbTheme);
            setDbInitialized(true);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (!dbInitialized) return;

        saveToDB('players', players);
        saveToDB('rounds', rounds);
        saveToDB('tournamentStarted', tournamentStarted);
        saveToDB('tournamentMeta', tournamentMeta);
        saveToDB('users', users);
        saveToDB('currentUser', currentUser);
        saveToDB('theme', theme);

        document.body.className = theme === 'light' ? 'light' : '';

        if (tournamentStarted || rounds.length > 0) {
            setStandings(calculateStandings(players, rounds, tournamentMeta.tieBreaks || []));
        }
    }, [players, rounds, tournamentStarted, tournamentMeta, users, currentUser, theme, dbInitialized]);

    // --- Actions ---
    const enforceCapacity = (addingCount) => {
        if (!currentUser?.subscription || currentUser.subscription !== 'Pro License') {
            if (players.length + addingCount > 10) {
                alert(`Free Trial Limit Reached! You can only add up to 10 players on the free tier.\n\nPlease visit the Pricing tab to purchase a Lifetime License for unlimited players.`);
                return false;
            }
        }
        return true;
    };

    const addPlayer = (e) => {
        e.preventDefault();
        if (!playerName) return;
        if (!enforceCapacity(1)) return;

        const newPlayer = {
            id: Date.now().toString(),
            name: playerName,
            rating: parseInt(playerRating) || 0,
            age: parseInt(playerAge) || 0
        };
        setPlayers([...players, newPlayer]);
        setPlayerName('');
        setPlayerRating('');
        setPlayerAge('');
    };

    const bulkAddPlayers = () => {
        if (!bulkText.trim()) return;
        const lines = bulkText.split('\n');
        
        // Calculate valid lines before enforcing capacity
        const validLineCount = lines.filter(l => l.trim().length > 0).length;
        if (!enforceCapacity(validLineCount)) return;

        const newPlayersList = [...players];

        lines.forEach(line => {
            if (!line.trim()) return;
            // Support formats: "Name" or "Name, Rating"
            const parts = line.split(/[,,|]/);
            const name = parts[0].trim();
            const rating = parseInt(parts[1]) || 0;
            const age = parseInt(parts[2]) || 0;

            if (name) {
                newPlayersList.push({
                    id: (Date.now() + Math.random()).toString(),
                    name,
                    rating,
                    age
                });
            }
        });

        setPlayers(newPlayersList);
        setBulkText('');
    };

    const removePlayer = (id) => {
        if (window.confirm("Remove this player?")) {
            setPlayers(players.filter(p => p.id !== id));
        }
    };

    const updatePlayer = (id, newName, newRating) => {
        setPlayers(players.map(p =>
            p.id === id ? { ...p, name: newName, rating: parseInt(newRating) || 0 } : p
        ));
        setEditingPlayerId(null);
    };

    const startTournament = () => {
        if (players.length < 2) {
            alert("At least 2 players required");
            return;
        }
        const isRR = tournamentMeta.type === 'Round Robin';
        if (isRR) {
            const expectedRounds = players.length % 2 === 0 ? players.length - 1 : players.length;
            setTournamentMeta(prev => ({ ...prev, rounds: expectedRounds }));
        }

        const round1 = isRR ? generateRoundRobinPairings(players, 1) : generateRound1(players);
        setRounds([{ number: 1, pairings: round1.pairings, bye: round1.bye, completed: false }]);
        setTournamentStarted(true);
        setCurrentView('pairing');
    };

    const updateResult = (roundNum, pairIdx, result) => {
        const newRounds = [...rounds];
        const round = newRounds.find(r => r.number === roundNum);
        round.pairings[pairIdx].result = result;
        setRounds(newRounds);
    };

    const completeRound = (roundNum) => {
        const newRounds = [...rounds];
        const round = newRounds.find(r => r.number === roundNum);
        const allResultsEntered = round.pairings.every(p => p.result);
        if (!allResultsEntered) {
            alert("Please enter all results for this round");
            return;
        }
        round.completed = true;
        setRounds(newRounds);
    };

    const getAverageRating = () => {
        if (players.length === 0) return 0;
        const total = players.reduce((sum, p) => sum + p.rating, 0);
        return Math.round(total / players.length);
    };

    const getStartingRank = (id) => {
        const initialSeeding = [...players].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
        return initialSeeding.findIndex(p => p.id === id) + 1;
    };

    const nextRound = () => {
        const nextNum = rounds.length + 1;
        const isRR = tournamentMeta.type === 'Round Robin';
        const nextRoundData = isRR ? generateRoundRobinPairings(players, nextNum) : generateSubsequentRound(players, rounds);
        setRounds([...rounds, {
            number: nextNum,
            pairings: nextRoundData.pairings,
            bye: nextRoundData.bye,
            completed: false
        }]);
    };

    const resetTournament = () => {
        if (window.confirm("Are you sure you want to reset the tournament? This will clear all rounds and players.")) {
            clearDB().then(() => {
                setPlayers([]);
                setRounds([]);
                setTournamentStarted(false);
                setCurrentView('dashboard');
            });
        }
    };

    const handleSyncToSheets = async () => {
        let scriptUrl = localStorage.getItem('googleScriptUrl');
        if (!scriptUrl) {
            scriptUrl = window.prompt("To connect your Google Sheet Backend, please enter your Google Apps Script Web App URL:\n\nIf you don't have one, ask the developer for the Apps Script code snippet.");
            if (!scriptUrl) return;
            localStorage.setItem('googleScriptUrl', scriptUrl.trim());
        }
        
        const success = await syncToGoogleSheets(players, rounds, tournamentMeta, standings);
        if (success) {
            alert("Success! Your live data has been synced to your Google Sheet backend.");
        } else {
            alert("Sync Failed. Please check your Web App URL or internet connection.");
            localStorage.removeItem('googleScriptUrl'); // Allow them to reset it
        }
    };

    const exportPairingsToExcel = (round) => {
        if (!round) return;
        const data = round.pairings.map((pair, idx) => ({
            Board: idx + 1,
            'Name (White)': pair.white.name,
            'Rating (White)': pair.white.rating,
            Result: pair.result || 'vs',
            'Rating (Black)': pair.black.rating,
            'Name (Black)': pair.black.name
        }));
        if (round.bye) {
            data.push({
                Board: round.pairings.length + 1,
                'Name (White)': round.bye.name,
                'Rating (White)': round.bye.rating,
                Result: 'Bye',
                'Rating (Black)': '',
                'Name (Black)': '---'
            });
        }
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Round ${round.number}`);
        XLSX.writeFile(wb, `pairings_round_${round.number}.xlsx`);
    };

    const exportToExcel = () => {
        if (standings.length === 0) {
            alert("No standings to export yet.");
            return;
        }
        const data = standings.map((p, idx) => ({
            Rank: idx + 1,
            Name: p.name,
            Rating: p.rating,
            Age: p.age || '',
            Points: p.points,
            'BH-Cut1': p.buchholzCut1,
            'BH-Total': p.buchholz,
            Wins: p.wins || 0,
            'SB': Number(p.sonnebornBerger || 0).toFixed(2),
            BlackWins: p.blackWins || 0
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Standings");
        XLSX.writeFile(wb, `standings_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleProAction = (action) => {
        if (!currentUser?.subscription || currentUser.subscription !== 'Pro License') {
            alert("Upgrade to the Pro License to unlock this premium feature!");
            setCurrentView('pricing');
            return;
        }
        action();
    };

    const broadcastWhatsApp = (round) => {
        if (!round || !round.pairings) return;
        
        let text = `🏆 *${tournamentMeta.name || 'Tournament'}* - Round ${round.number} Pairings:\n\n`;
        round.pairings.forEach((p, idx) => {
            text += `Board ${idx+1}: ${p.white.name} ⚔️ ${p.black.name}\n`;
        });
        text += `\n🔴 Live Board Search: ${window.location.origin}/?live=true`;

        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const exportFideTRF = () => {
        if (standings.length === 0) return alert("No standings to export.");

        let trf = `012 ${tournamentMeta.name || 'Tournament'}\n`;
        trf += `022 ${tournamentMeta.location || 'Unknown'}\n`;
        trf += `042 ${tournamentMeta.date || ''}\n`;
        trf += `052 ${tournamentMeta.date || ''}\n`;
        trf += `062 ${players.length}\n`;
        trf += `122 ${tournamentMeta.timeControl || ''}\n`;
        
        standings.forEach((p, idx) => {
            const rank = (idx + 1).toString().padStart(4, ' ');
            const name = p.name.padEnd(33, ' ');
            const rtg = p.rating.toString().padStart(4, ' ');
            const pts = p.points.toString().padStart(4, ' ');
            trf += `001 ${rank}      NN ${name}${rtg} FIDE                 ${pts}\n`;
        });

        const blob = new Blob([trf], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${tournamentMeta.name || 'Tournament'}_FIDE.trf`;
        a.click();
    };

    const printReport = () => {
        window.print();
    };

    const handleLogin = (identifier, password) => {
        // Can login via email OR name
        const user = users.find(u => 
            (u.email.toLowerCase() === identifier.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase()) 
            && u.password === password
        );
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const handleRegister = (name, email, age, mobile, password) => {
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.mobile === mobile)) return false;
        const newUser = { id: Date.now().toString(), name, email, age, mobile, password };
        const newUsers = [...users, newUser];
        setUsers(newUsers);
        setCurrentUser(newUser);
        return true;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('dashboard');
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
    };

    const handlePaymentSuccess = (plan) => {
        const safeUser = currentUser || { id: 'guest', name: 'Guest User' };
        const updatedUsers = users.map(u =>
            u.id === safeUser.id ? { ...u, subscription: plan.name } : u
        );
        const updatedUser = { ...safeUser, subscription: plan.name };
        setUsers(updatedUsers);
        setCurrentUser(updatedUser);
        setSelectedPlan(null);
        setCurrentView('dashboard');
    };

    const fetchFidePlayer = async () => {
        if (!fideId) return;
        setIsFetchingFide(true);
        try {
            const res = await fetch(`https://fide-api.vercel.app/player_info/?fide_id=${fideId}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                setPlayerName(data.name || '');
                setPlayerRating(data.classical_rating || data.rapid_rating || data.blitz_rating || 0);
                setPlayerAge(data.birth_year ? (new Date().getFullYear() - parseInt(data.birth_year)) : 0);
                setFideId('');
            } else {
                alert("Could not fetch FIDE data. Network error or invalid ID.");
            }
        } catch (e) {
            alert("Error fetching FIDE data.");
        }
        setIsFetchingFide(false);
    };


    // --- Views ---
    const navItems = [
        { id: 'dashboard', label: 'Home' },
        { id: 'pairing', label: 'Pairing' },
        { id: 'standings', label: 'Standings' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'details', label: 'Details' },
        { id: 'about', label: 'About' }
    ];

    if (!currentUser) {
        return <AuthView onLogin={handleLogin} onRegister={handleRegister} />;
    }

    if (selectedPlan) {
        return (
            <PaymentGatewayView
                plan={selectedPlan}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={() => setSelectedPlan(null)}
            />
        );
    }

    if (currentView === 'kiosk') {
        return <KioskModeView rounds={rounds} onExit={() => setCurrentView('dashboard')} />;
    }

    if (currentView === 'badges') {
        return <PlayerBadgesView players={players} onExit={() => setCurrentView('dashboard')} />;
    }

    return (
        <div>
            <nav className="ribbon">
                <div
                    className="brand-logo"
                    style={{ cursor: 'pointer', fontWeight: '800' }}
                    onClick={() => setCurrentView('dashboard')}
                >
                    chesspair<span style={{ color: 'var(--primary)' }}>zzz</span>
                </div>

                <div className="ribbon-item dropdown">
                    File
                    <div className="ribbon-dropdown">
                        <div className="dropdown-item" onClick={() => setCurrentView('kiosk')} style={{ fontWeight: 'bold' }}>🖥️ Kiosk Mode (Players)</div>
                        <div className="dropdown-item" onClick={() => handleProAction(() => setCurrentView('badges'))}>🪪 Print Player Badges</div>
                        <hr style={{ opacity: 0.1, margin: '5px 0' }} />
                        <div className="dropdown-item" onClick={exportToExcel}>Export Standings (CSV)</div>
                        <div className="dropdown-item" onClick={() => handleProAction(exportFideTRF)} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Export FIDE TRF 🏆</div>
                        <div className="dropdown-item" onClick={handleSyncToSheets} style={{ color: '#10b981', fontWeight: 'bold' }}>Sync Live to Web/Sheets 🟢</div>
                        <div className="dropdown-item" onClick={printReport}>Print / Save as PDF</div>
                        <hr style={{ opacity: 0.1, margin: '5px 0' }} />
                        <div className="dropdown-item" onClick={resetTournament} style={{ color: '#ef4444' }}>Reset App</div>
                    </div>
                </div>

                {navItems.map(item => (
                    <div
                        key={item.id}
                        className={`ribbon-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => setCurrentView(item.id)}
                    >
                        {item.label}
                    </div>
                ))}

                <div className="profile-section">
                    <div className="user-badge">
                        <div className="user-avatar">{currentUser?.name?.charAt(0).toUpperCase() || 'G'}</div>
                        <span>{currentUser?.name || 'Guest User'}</span>
                    </div>
                    <button className="btn-icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ fontSize: '1.2rem', marginLeft: '0.5rem', border: 'none', background: 'transparent' }}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginLeft: '0.5rem' }}>Logout</button>
                </div>
            </nav>

            <div className="app-container" style={{ paddingBottom: '5rem' }}>
                {currentView === 'dashboard' && (
                    <DashboardView
                        tournamentMeta={tournamentMeta}
                        setCurrentView={setCurrentView}
                        players={players}
                        rounds={rounds}
                        getAverageRating={getAverageRating}
                        tournamentStarted={tournamentStarted}
                        startTournament={startTournament}
                        printReport={printReport}
                        exportToExcel={exportToExcel}
                        resetTournament={resetTournament}
                        dashboardTab={dashboardTab}
                        setDashboardTab={setDashboardTab}
                        standings={standings}
                        getStartingRank={getStartingRank}
                        setEditingPlayerId={setEditingPlayerId}
                        removePlayer={removePlayer}
                        addPlayer={addPlayer}
                        playerName={playerName}
                        setPlayerName={setPlayerName}
                        playerRating={playerRating}
                        setPlayerRating={setPlayerRating}
                        playerAge={playerAge}
                        setPlayerAge={setPlayerAge}
                        showBulkEntry={showBulkEntry}
                        setShowBulkEntry={setShowBulkEntry}
                        bulkText={bulkText}
                        setBulkText={setBulkText}
                        bulkAddPlayers={bulkAddPlayers}
                        onGenerateCertificate={(p, rank) => setSelectedCertificatePlayer({ ...p, rank })}
                        fideId={fideId}
                        setFideId={setFideId}
                        isFetchingFide={isFetchingFide}
                        fetchFidePlayer={fetchFidePlayer}
                    />
                )}
                {currentView === 'pairing' && (
                    <PairingView
                        tournamentStarted={tournamentStarted}
                        selectedRoundIndex={selectedRoundIndex}
                        rounds={rounds}
                        setSelectedRoundIndex={setSelectedRoundIndex}
                        nextRound={nextRound}
                        completeRound={completeRound}
                        getStartingRank={getStartingRank}
                        updateResult={updateResult}
                        standings={standings}
                        exportPairingsToExcel={exportPairingsToExcel}
                        onBroadcastWhatsApp={(round) => handleProAction(() => broadcastWhatsApp(round))}
                        onGenerateCertificate={(p, rank) => handleProAction(() => setSelectedCertificatePlayer({ ...p, rank }))}
                        setPrintingSlipsRound={setPrintingSlipsRound}
                        tournamentMeta={tournamentMeta}
                    />
                )}
                {currentView === 'standings' && (
                    <StandingsView
                        standings={standings}
                        handleSyncToSheets={handleSyncToSheets}
                        exportToExcel={exportToExcel}
                        onGenerateCertificate={(p, rank) => handleProAction(() => setSelectedCertificatePlayer({ ...p, rank }))}
                        onGenerateReport={(p, rank) => handleProAction(() => setSelectedReportPlayer({ ...p, rank }))}
                    />
                )}
                {currentView === 'about' && <AboutView />}
                {currentView === 'pricing' && <PricingView onPlanSelect={handlePlanSelect} currentUser={currentUser} />}
                {currentView === 'details' && (
                    <TournamentDetailsView
                        tournamentMeta={tournamentMeta}
                        setTournamentMeta={setTournamentMeta}
                        setCurrentView={setCurrentView}
                    />
                )}
            </div>

            {selectedCertificatePlayer && (
                <CertificateView
                    player={selectedCertificatePlayer}
                    tournamentMeta={tournamentMeta}
                    onClose={() => setSelectedCertificatePlayer(null)}
                />
            )}

            {selectedReportPlayer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: '#fff' }}>
                    <ReportCardView 
                        player={selectedReportPlayer} 
                        rank={selectedReportPlayer.rank} 
                        standings={standings} 
                        rounds={rounds} 
                        tournamentMeta={tournamentMeta} 
                        onExit={() => setSelectedReportPlayer(null)} 
                    />
                </div>
            )}
            
            {printingSlipsRound && (
                <MatchSlipsView
                    round={printingSlipsRound}
                    tournamentMeta={tournamentMeta}
                    onClose={() => setPrintingSlipsRound(null)}
                />
            )}
        </div>
    );
};

// --- Sub-View Components ---

const DashboardView = ({
    tournamentMeta, setCurrentView, players, rounds, getAverageRating,
    tournamentStarted, startTournament, printReport, exportToExcel,
    resetTournament, dashboardTab, setDashboardTab, standings,
    getStartingRank, setEditingPlayerId, removePlayer, addPlayer,
    playerName, setPlayerName, playerRating, setPlayerRating,
    playerAge, setPlayerAge,
    showBulkEntry, setShowBulkEntry, bulkText, setBulkText, bulkAddPlayers,
    onGenerateCertificate,
    fideId, setFideId, isFetchingFide, fetchFidePlayer
}) => {
    const [publicSheetUrl, setPublicSheetUrl] = React.useState(localStorage.getItem('googleSheetPublicUrl') || '');

    const handleSetUrl = () => {
        const url = prompt("Enter your public Google Sheet Share Link (so players can scan & view it):", publicSheetUrl);
        if (url !== null) {
            localStorage.setItem('googleSheetPublicUrl', url.trim());
            setPublicSheetUrl(url.trim());
        }
    };

    return (
    <div className="fade-in">
        <h1 className="hero-logo">chesspair<span>zzz</span></h1>

        <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div className="dashboard-sidebar">
                <div className="glass-card">
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="neon-text">Tournament Info</h3>
                        <button className="btn-ghost" onClick={() => setCurrentView('details')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Edit</button>
                    </div>
                    <div className="meta-list" style={{ fontSize: '0.85rem' }}>
                        <div className="meta-item"><span>Organizer:</span> <strong>{tournamentMeta.organizer || "---"}</strong></div>
                        <div className="meta-item"><span>Director:</span> <strong>{tournamentMeta.director || "---"}</strong></div>
                        <div className="meta-item"><span>Arbiter:</span> <strong>{tournamentMeta.arbiter || "---"}</strong></div>
                        <div className="meta-item"><span>Location:</span> <strong>{tournamentMeta.location || "---"}</strong></div>
                        <div className="meta-item"><span>Time Control:</span> <strong>{tournamentMeta.timeControl || "---"}</strong></div>
                        <div className="meta-item"><span>Date:</span> <strong>{tournamentMeta.date || "---"}</strong></div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                        {publicSheetUrl ? (
                            <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', marginBottom: '10px' }}>
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicSheetUrl)}`} alt="Live QR" style={{ display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px', textAlign: 'center', color: '#888' }}>
                                No Link Set
                            </div>
                        )}
                        <span style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '10px' }}>Scan for Live Results</span>
                        <button className="btn-ghost" style={{ fontSize: '0.7rem' }} onClick={handleSetUrl}>
                            {publicSheetUrl ? "Change Google Sheet Link" : "Set Google Sheet Link"}
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{ marginTop: '2rem' }}>
                    <h3 className="neon-text" style={{ marginBottom: '1rem' }}>Statistics</h3>
                    <div className="mini-stats">
                        <div className="mini-stat">
                            <span className="label">Total Players</span>
                            <span className="value">{players.length}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="label">Avg Rating</span>
                            <span className="value">{getAverageRating()}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="label">Rounds</span>
                            <span className="value">{rounds.length} / {tournamentMeta.rounds}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-main">
                {!tournamentStarted ? (
                    <div className="glass-card">
                        <h3 className="neon-text">Player Setup</h3>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '12px' }}>
                            <input type="number" placeholder="Optional: Fetch by FIDE ID" value={fideId} onChange={e => setFideId(e.target.value)} style={{ marginBottom: 0, flex: 1, border: 'none', background: 'transparent' }} />
                            <button type="button" onClick={fetchFidePlayer} disabled={isFetchingFide || !fideId} className="btn-ghost" style={{ padding: '0.5rem 1rem' }}>
                                {isFetchingFide ? 'Loading...' : '🔍 Fetch'}
                            </button>
                        </div>

                        <form onSubmit={addPlayer}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Player Name"
                                    value={playerName}
                                    onChange={e => setPlayerName(e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                                <input
                                    type="number"
                                    placeholder="Rating"
                                    value={playerRating}
                                    onChange={e => setPlayerRating(e.target.value)}
                                    style={{ marginBottom: 0, width: '100px' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Age"
                                    value={playerAge}
                                    onChange={e => setPlayerAge(e.target.value)}
                                    style={{ marginBottom: 0, width: '80px' }}
                                />
                                <button type="submit">Add</button>
                            </div>
                        </form>

                        <div className="flex-between" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.8rem', opacity: 0.5 }}>Quick Entry</h4>
                            <button className="btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => setShowBulkEntry(!showBulkEntry)}>
                                {showBulkEntry ? 'Hide' : 'Bulk Mode'}
                            </button>
                        </div>

                        {showBulkEntry && (
                            <div className="bulk-entry-container fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <textarea
                                    placeholder="Name, Rating (one per line)"
                                    value={bulkText}
                                    onChange={e => setBulkText(e.target.value)}
                                    style={{ minHeight: '80px', marginBottom: '1rem' }}
                                />
                                <button onClick={bulkAddPlayers} className="btn-ghost" style={{ width: '100%' }}>Import</button>
                            </div>
                        )}

                        <button
                            onClick={startTournament}
                            style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
                            disabled={players.length < 2}
                        >
                            🚀 Start Tournament
                        </button>
                    </div>
                ) : (
                    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                                Tournament Active
                            </h3>
                            <p style={{ opacity: 0.5, fontSize: '0.8rem', margin: '0.5rem 0 0' }}>Manage pairings or export standings from the top menu.</p>
                        </div>
                        <button onClick={() => setCurrentView('pairing')}>
                            📊 View Pairings
                        </button>
                    </div>
                )}

                <div className="glass-card" style={{ marginTop: '2rem' }}>
                    <div className="tab-group">
                        <button className={`tab-link ${dashboardTab === 'ranking' ? 'active' : ''}`} onClick={() => setDashboardTab('ranking')}>Starting Rank</button>
                        <button className={`tab-link ${dashboardTab === 'alpha' ? 'active' : ''}`} onClick={() => setDashboardTab('alpha')}>Alphabetical</button>
                        <button className={`tab-link ${dashboardTab === 'stats' ? 'active' : ''}`} onClick={() => setDashboardTab('stats')}>Adv. Stats</button>
                        <button className={`tab-link ${dashboardTab === 'categories' ? 'active' : ''}`} onClick={() => setDashboardTab('categories')}>Categories</button>
                        <button className={`tab-link ${dashboardTab === 'schedule' ? 'active' : ''}`} onClick={() => setDashboardTab('schedule')}>Schedule</button>
                    </div>

                    <div className="tab-content" style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                        {dashboardTab === 'ranking' && (
                            <table className="compact-table">
                                <thead>
                                    <tr><th>Sl. No</th><th>Name</th><th>Rating/Age</th><th>{tournamentStarted ? 'Pts' : ''}</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {[...players].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).map((p, idx) => (
                                        <tr key={p.id}>
                                            <td>{idx + 1}</td>
                                            <td><strong>{p.name}</strong></td>
                                            <td>{p.rating} / {p.age || '-'}</td>
                                            <td>{tournamentStarted ? (standings.find(s => s.id === p.id)?.points || 0) : ''}</td>
                                            <td>
                                                <button className="btn-icon" onClick={() => setEditingPlayerId(p.id)}>✎</button>
                                                <button className="btn-icon delete" onClick={() => removePlayer(p.id)}>✕</button>
                                                {tournamentStarted && (
                                                    <button
                                                        className="btn-icon"
                                                        style={{ marginLeft: '4px' }}
                                                        onClick={() => onGenerateCertificate(standings.find(s => s.id === p.id), getStartingRank(p.id))}
                                                    >
                                                        📜
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {dashboardTab === 'alpha' && (
                            <table className="compact-table">
                                <thead><tr><th>Name</th><th>Sl. No</th><th>Rating</th></tr></thead>
                                <tbody>
                                    {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                                        <tr key={p.id}>
                                            <td><strong>{p.name}</strong></td>
                                            <td>{getStartingRank(p.id)}</td>
                                            <td>{p.rating}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {dashboardTab === 'stats' && (
                            <div className="stats-pane">
                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="stat-box">
                                        <h4>Rating Distribution</h4>
                                        <ul>
                                            <li><strong>Max:</strong> {players.length > 0 ? Math.max(...players.map(p => p.rating)) : 0}</li>
                                            <li><strong>Min:</strong> {players.length > 0 ? Math.min(...players.map(p => p.rating)) : 0}</li>
                                            <li><strong>Average:</strong> {getAverageRating()}</li>
                                        </ul>
                                    </div>
                                    <div className="stat-box">
                                        <h4>Tournament Data</h4>
                                        <ul>
                                            <li><strong>Pairs:</strong> {rounds.reduce((sum, r) => sum + r.pairings.length, 0)}</li>
                                            <li><strong>Byes:</strong> {rounds.filter(r => r.bye).length}</li>
                                            <li><strong>Type:</strong> Swiss</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {dashboardTab === 'schedule' && (
                            <div className="schedule-pane">
                                {Array.from({ length: tournamentMeta.rounds }).map((_, i) => (
                                    <div key={i} className="schedule-row">
                                        <div className="round-label">Round {i + 1}</div>
                                        <div className="round-date">{tournamentMeta.date}</div>
                                        <div className={`round-status ${rounds[i]?.completed ? 'done' : 'next'}`}>
                                            {rounds[i] ? (rounds[i].completed ? '✓ Completed' : '▶ Current') : '○ Pending'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {dashboardTab === 'categories' && (
                            <div className="categories-pane">
                                {['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'Open'].map(cat => {
                                    const ageLimit = cat === 'Open' ? 999 : parseInt(cat.split('-')[1]);
                                    const catPlayers = standings
                                        .filter(p => p.age && p.age <= ageLimit)
                                        .slice(0, 3);
                                    
                                    if (catPlayers.length === 0 && cat !== 'Open') return null;

                                    return (
                                        <div key={cat} className="category-group" style={{ marginBottom: '2rem' }}>
                                            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                                {cat} Category Winners
                                            </h4>
                                            <table className="compact-table">
                                                <thead><tr><th>Rank</th><th>Name</th><th>Age</th><th>Pts</th></tr></thead>
                                                <tbody>
                                                    {catPlayers.map((p, i) => (
                                                        <tr key={p.id}>
                                                            <td>{i + 1}</td>
                                                            <td><strong>{p.name}</strong></td>
                                                            <td>{p.age}</td>
                                                            <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{p.points}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {players.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>
                                No players found. Add them in the setup section above.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

const PairingView = ({
    tournamentStarted, selectedRoundIndex, rounds, setSelectedRoundIndex,
    nextRound, completeRound, getStartingRank, updateResult, standings,
    exportPairingsToExcel, onGenerateCertificate, setPrintingSlipsRound, tournamentMeta, onBroadcastWhatsApp
}) => {
    if (!tournamentStarted || !rounds || rounds.length === 0) return null;
    const currentRoundIndex = (selectedRoundIndex !== null && selectedRoundIndex < rounds.length) ? selectedRoundIndex : rounds.length - 1;
    const activeRound = rounds[currentRoundIndex];
    if (!activeRound) return null;

    return (
        <div className="fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <h2 className="neon-text">Round {activeRound.number}</h2>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {rounds.map((r, i) => (
                            <button
                                key={i}
                                className={`btn-round-select ${currentRoundIndex === i ? 'active' : ''}`}
                                onClick={() => setSelectedRoundIndex(i)}
                            >
                                R{r.number}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <button className="btn-ghost" style={{ marginRight: '0.5rem', color: '#10b981', borderColor: '#10b981' }} onClick={() => onBroadcastWhatsApp(activeRound)}>💬 WhatsApp</button>
                    <button className="btn-ghost" style={{ marginRight: '0.5rem' }} onClick={() => setPrintingSlipsRound(activeRound)}>🖨 Slips</button>
                    <button className="btn-ghost" style={{ marginRight: '0.5rem' }} onClick={() => window.print()}>Print Pairings</button>
                    <button className="btn-ghost" style={{ marginRight: '1rem' }} onClick={() => exportPairingsToExcel(activeRound)}>Excel Pairings</button>
                    {activeRound.completed ? (
                        currentRoundIndex === rounds.length - 1 ? (
                            <button onClick={nextRound}>Generate Next Round</button>
                        ) : (
                            <span className="badge badge-draw">Round Locked</span>
                        )
                    ) : (
                        <button onClick={() => completeRound(activeRound.number)}>Complete Round</button>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0.5rem' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="pairing-table">
                        <thead>
                            <tr>
                                <th>Bo.</th>
                                <th>Sl. No</th>
                                <th>Name (White)</th>
                                <th>Rtg</th>
                                <th style={{ textAlign: 'center' }}>Result</th>
                                <th>Rtg</th>
                                <th>Name (Black)</th>
                                <th>Sl. No</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeRound.pairings.map((pair, idx) => (
                                <tr key={idx}>
                                    <td style={{ opacity: 0.5 }}>{idx + 1}</td>
                                    <td>{getStartingRank(pair.white.id)}</td>
                                    <td><strong>{pair.white.name}</strong></td>
                                    <td><span className="rating-dim">{pair.white.rating}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="result-selector">
                                            <button
                                                onClick={() => updateResult(activeRound.number, idx, RESULTS.WHITE_WIN)}
                                                className={pair.result === RESULTS.WHITE_WIN ? 'active white-win' : ''}
                                            >
                                                1 - 0
                                            </button>
                                            <button
                                                onClick={() => updateResult(activeRound.number, idx, RESULTS.DRAW)}
                                                className={pair.result === RESULTS.DRAW ? 'active draw' : ''}
                                            >
                                                ½ - ½
                                            </button>
                                            <button
                                                onClick={() => updateResult(activeRound.number, idx, RESULTS.BLACK_WIN)}
                                                className={pair.result === RESULTS.BLACK_WIN ? 'active black-win' : ''}
                                            >
                                                0 - 1
                                            </button>
                                            <button
                                                onClick={() => updateResult(activeRound.number, idx, RESULTS.WHITE_WALKOVER)}
                                                className={pair.result === RESULTS.WHITE_WALKOVER ? 'active white-win' : ''}
                                                title="White Walkover"
                                            >
                                                + -
                                            </button>
                                            <button
                                                onClick={() => updateResult(activeRound.number, idx, RESULTS.BLACK_WALKOVER)}
                                                className={pair.result === RESULTS.BLACK_WALKOVER ? 'active black-win' : ''}
                                                title="Black Walkover"
                                            >
                                                - +
                                            </button>
                                        </div>
                                    </td>
                                    <td><span className="rating-dim">{pair.black.rating}</span></td>
                                    <td><strong>{pair.black.name}</strong></td>
                                    <td>{getStartingRank(pair.black.id)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {activeRound.bye && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
                        Board {activeRound.pairings.length + 1}: <strong>{activeRound.bye.name}</strong> (Bye) ➔ <strong>1</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

const StandingsView = ({ standings, exportToExcel, handleSyncToSheets, onGenerateCertificate, onGenerateReport }) => (
    <div className="fade-in">
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <h2 className="neon-text">Tournament Final Standings</h2>
            <div>
                <button className="btn-ghost" onClick={handleSyncToSheets} style={{ marginRight: '0.5rem', borderColor: '#10b981', color: '#10b981' }}>Sync Live to Google Sheets</button>
                <button className="btn-ghost" onClick={exportToExcel}>Export to Excel</button>
            </div>
        </div>
        <div className="glass-card">
            <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '800px' }}>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Pts</th>
                            <th>BH-C1</th>
                            <th>BH</th>
                            <th>Wins</th>
                            <th>SB</th>
                            <th>BW</th>
                            <th className="no-print">Cert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((p, idx) => (
                            <tr key={p.id}>
                                <td>{idx + 1}</td>
                                <td>{p.name} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({p.rating || 0})</span></td>
                                <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{p.points || 0}</td>
                                <td>{p.buchholzCut1 || 0}</td>
                                <td>{p.buchholz || 0}</td>
                                <td>{p.wins || 0}</td>
                                <td>{Number(p.sonnebornBerger || 0).toFixed(1)}</td>
                                <td>{p.blackWins || 0}</td>
                                <td className="no-print">
                                    <button 
                                        className="btn-ghost" 
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginRight: '5px' }}
                                        onClick={() => onGenerateCertificate(p, idx + 1)}
                                    >
                                        Certificate
                                    </button>
                                    <button 
                                        className="btn-ghost" 
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                        onClick={() => onGenerateReport(p, idx + 1)}
                                    >
                                        Report
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {standings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>
                    No standings available yet. Start the tournament!
                </div>
            )}
        </div>
    </div>
);

const AboutView = () => (
    <div className="glass-card fade-in">
        <h2 className="neon-text">About chesspairzzz</h2>
        <p>This software implements a variant of the FIDE Swiss System pairing algorithm.</p>

        <h3 style={{ marginTop: '2rem' }}>The Swiss System</h3>
        <ul style={{ lineHeight: '1.6', opacity: 0.8 }}>
            <li>Players with similar scores are paired against each other in each round.</li>
            <li>No player meets the same opponent more than once.</li>
            <li>Color balancing: The system tries to give each player an equal number of White and Black games.</li>
            <li>Floaters: When players in a score group can't be paired within themselves, they are "floated" to the next score group.</li>
        </ul>

        <h3 style={{ marginTop: '2rem' }}>FIDE Tie-Break Rules</h3>
        <ul style={{ lineHeight: '1.6', opacity: 0.8 }}>
            <li><strong>Buchholz Cut 1 (BH-C1):</strong> Opponents' scores minus the lowest score.</li>
            <li><strong>Buchholz Total (BH):</strong> Sum of all opponents' scores.</li>
            <li><strong>Wins:</strong> Total number of victories.</li>
            <li><strong>Direct Encounter:</strong> Automatic head-to-head comparison for tied players.</li>
            <li><strong>Sonneborn-Berger (SB):</strong> Scoring based on the strength of defeated/drawn opponents.</li>
            <li><strong>Wins with Black (BW):</strong> Total number of victories playing as black.</li>
        </ul>
    </div>
);

const TournamentDetailsView = ({ tournamentMeta, setTournamentMeta, setCurrentView }) => (
    <div className="glass-card fade-in">
        <div className="flex-between">
            <h2 className="neon-text">Tournament Specifications</h2>
            <button className="btn-ghost" onClick={() => setCurrentView('dashboard')}>Save & Close</button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>Tournament System</label>
                <select value={tournamentMeta.type} onChange={e => setTournamentMeta({ ...tournamentMeta, type: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'inherit' }}>
                    <option style={{color:'#000'}} value="Swiss">Swiss System</option>
                    <option style={{color:'#000'}} value="Round Robin">Round Robin</option>
                </select>
                <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.7 }}>
                    Note: Changing this logic will apply to the next round generated.
                </small>
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Organizer(s)</label>
                <input value={tournamentMeta.organizer} onChange={e => setTournamentMeta({ ...tournamentMeta, organizer: e.target.value })} placeholder="e.g. FIDE, Local Club" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Federation</label>
                <input value={tournamentMeta.federation} onChange={e => setTournamentMeta({ ...tournamentMeta, federation: e.target.value })} placeholder="e.g. AICF, USCF" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Tournament Director</label>
                <input value={tournamentMeta.director} onChange={e => setTournamentMeta({ ...tournamentMeta, director: e.target.value })} placeholder="Name" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Chief Arbiter</label>
                <input value={tournamentMeta.arbiter} onChange={e => setTournamentMeta({ ...tournamentMeta, arbiter: e.target.value })} placeholder="Name" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Time Control</label>
                <input value={tournamentMeta.timeControl} onChange={e => setTournamentMeta({ ...tournamentMeta, timeControl: e.target.value })} placeholder="e.g. 90+30" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Location</label>
                <input value={tournamentMeta.location} onChange={e => setTournamentMeta({ ...tournamentMeta, location: e.target.value })} placeholder="City, Country" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Date</label>
                <input type="date" value={tournamentMeta.date} onChange={e => setTournamentMeta({ ...tournamentMeta, date: e.target.value })} />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Scheduled Rounds</label>
                <input type="number" value={tournamentMeta.rounds} onChange={e => setTournamentMeta({ ...tournamentMeta, rounds: parseInt(e.target.value) || 0 })} />
            </div>
        </div>

        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Implicit Details</h4>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.9rem' }}>
                <div><strong>Type:</strong> {tournamentMeta.type}</div>
                <div><strong>Calculation:</strong> {tournamentMeta.calculation}</div>
                <div><strong>Software:</strong> chesspairzzz</div>
            </div>
        </div>
    </div>
);

const PricingView = ({ onPlanSelect, currentUser }) => {
    const isPro = currentUser?.subscription === 'Pro License';
    
    return (
        <div className="fade-in" style={{ textAlign: 'center' }}>
            <h2 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                {isPro ? "You are Pro! 🏆" : "Upgrade Your Software"}
            </h2>
            <p style={{ opacity: 0.7, marginBottom: '3rem' }}>
                {isPro ? "Thank you for supporting ChessPairzzz. All limits are permanently unlocked." : "Unlock advanced pairing features and endless players for life."}
            </p>

            <div className="pricing-grid" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="glass-card pricing-card" style={{ maxWidth: '350px' }}>
                    <h3>Free Trial</h3>
                    <div className="price">$0<span>/forever</span></div>
                    <div className="inr-price">₹0</div>
                    <p style={{ opacity: 0.6 }}>Test out the software limitations</p>
                    <ul className="features-list">
                        <li>Maximum 10 Players</li>
                        <li>Basic Swiss Pairing</li>
                        <li>Round Robin Support</li>
                        <li>Excel Standings Export</li>
                    </ul>
                    <button className="btn-ghost" disabled>
                        Included Default
                    </button>
                </div>

                <div className="glass-card pricing-card popular" style={{ maxWidth: '350px' }}>
                    <div className="popular-badge">Lifetime Access</div>
                    <h3 className="neon-text">Pro License</h3>
                    <div className="price">$59<span>/once</span></div>
                    <div className="inr-price">₹4999<span>/life</span></div>
                    <p style={{ opacity: 0.6 }}>For serious organizers and clubs</p>
                    <ul className="features-list">
                        <li>Unlimited Tournament Players</li>
                        <li>Full FIDE Tie-Breaks</li>
                        <li>Printable Match Slips</li>
                        <li>Printable Certificates</li>
                        <li>Premium Cloud Syncing</li>
                    </ul>
                    {isPro ? (
                        <button className="pricing-btn" disabled style={{ background: '#10b981', color: '#fff', border: 'none' }}>
                            Activated ✅
                        </button>
                    ) : (
                        <button
                            className="pricing-btn"
                            onClick={() => onPlanSelect({ name: 'Pro License', price: '$59', inrPrice: '₹4999' })}
                        >
                            Buy Lifetime Access
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
