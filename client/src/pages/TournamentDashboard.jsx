import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import TournamentLeaderboard from '../components/TournamentLeaderboard';

const TournamentDashboard = () => {
    const { tournamentId } = useParams();
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentMatches, setCurrentMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [advancing, setAdvancing] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchTournamentData();
    }, [tournamentId]);

    useEffect(() => {
        if (socket && tournamentId) {

            socket.emit('join_tournament_room', { tournament_id: tournamentId });

            socket.on('tournament_round_started', () => {
                fetchTournamentData(); 
            });

            socket.on('tournament_started', () => {
                fetchTournamentData(); 
            });

            socket.on('tournament_match_completed', () => {
                fetchTournamentData();
            });

            socket.on('tournament_leaderboard_update', () => {
                fetchLeaderboard();
            });

            socket.on('tournament_completed', () => {
                fetchTournamentData();
            });

            socket.on('match_started', (data) => {
                if (data.tournament_id === tournamentId) {
                    console.log('Match started, redirecting to:', data.room_id);
                    navigate(`/game/${data.room_id}?tournamentId=${tournamentId}`);
                }
            });

            return () => {
                socket.emit('leave_tournament_room', { tournament_id: tournamentId });
                socket.off('tournament_round_started');
                socket.off('tournament_started');
                socket.off('tournament_match_completed');
                socket.off('tournament_leaderboard_update');
                socket.off('tournament_completed');
                socket.off('match_started');
            };
        }
    }, [socket, tournamentId, navigate]);

    const fetchTournamentData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tournament/${tournamentId}`);
            setTournament(response.data.tournament);
            setParticipants(response.data.participants);
            setCurrentMatches(response.data.current_matches);

            const userMatch = response.data.current_matches.find(match => {
                const whitePlayerId = match.white_participant?.user_id?._id || match.white_participant?.user_id;
                const blackPlayerId = match.black_participant?.user_id?._id || match.black_participant?.user_id;
                const currentUserId = user?.id || user?._id;

                return (
                    whitePlayerId === currentUserId ||
                    blackPlayerId === currentUserId
                );
            });

            if (userMatch && userMatch.room_id && (userMatch.status === 'pending' || userMatch.status === 'active')) {

                setTimeout(() => {
                    navigate(`/game/${userMatch.room_id}?tournamentId=${tournamentId}`);
                }, 500);
            }
        } catch (err) {
            console.error('Fetch tournament error:', err);
            setError(err.response?.data?.error || 'Failed to load tournament');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tournament/${tournamentId}/leaderboard`);
            setParticipants(response.data.leaderboard.map(item => ({
                id: item.participant_id,
                user: item.user,
                total_points: item.total_points,
                wins: item.wins,
                draws: item.draws,
                losses: item.losses
            })));
        } catch (err) {
            console.error('Fetch leaderboard error:', err);
        }
    };

    const handleNextRound = async () => {
        setAdvancing(true);
        try {
            await axios.post(`${API_URL}/api/tournament/${tournamentId}/next-round`);

        } catch (err) {
            console.error('Next round error:', err);
            alert(err.response?.data?.error || 'Failed to advance to next round');
        } finally {
            setAdvancing(false);
        }
    };

    const handleSpectateMatch = (roomId) => {
        navigate(`/game/${roomId}?spectate=true&tournamentId=${tournamentId}`);
    };

    const handlePlayMatch = (roomId) => {
        navigate(`/game/${roomId}?tournamentId=${tournamentId}`);
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--accent)' }}></i>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>Loading tournament...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: '#ef4444' }}></i>
                <p style={{ marginTop: 'var(--spacing-md)', color: '#ef4444' }}>{error}</p>
                <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const isAdmin = tournament?.admin?.id === user?.id || tournament?.admin?._id === user?.id;
    const allMatchesComplete = currentMatches.every(m => m.status === 'completed');
    const isCompleted = tournament?.status === 'completed';

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            {}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <i className="fa-solid fa-trophy" style={{ marginRight: '10px', color: 'var(--accent)' }}></i>
                    {tournament?.name}
                </h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-chess-board" style={{ marginRight: '6px' }}></i>
                        Round {tournament?.current_round} of {tournament?.rounds_count}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i>
                        {tournament?.time_control?.initial / 60}+{tournament?.time_control?.increment}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-users" style={{ marginRight: '6px' }}></i>
                        {participants.length} Players
                    </div>
                    {isCompleted && (
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#22c55e',
                            fontWeight: 'bold'
                        }}>
                            <i className="fa-solid fa-flag-checkered" style={{ marginRight: '6px' }}></i>
                            Tournament Completed
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 'var(--spacing-xl)' }}>
                {}
                <div>
                    <div className="card">
                        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>
                            {isCompleted ? 'Final Results' : `Round ${tournament?.current_round} Matches`}
                        </h2>

                        {currentMatches.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: 'var(--spacing-xl)',
                                color: 'var(--text-secondary)'
                            }}>
                                No matches in this round
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {currentMatches.map((match) => {
                                    const whitePlayer = match.white_participant?.user_id;
                                    const blackPlayer = match.black_participant?.user_id;
                                    const currentUserId = user?.id || user?._id;

                                    const isUserMatch =
                                        (whitePlayer?.id === currentUserId || whitePlayer?._id === currentUserId) ||
                                        (blackPlayer?.id === currentUserId || blackPlayer?._id === currentUserId);

                                    return (
                                        <div
                                            key={match.id}
                                            style={{
                                                padding: 'var(--spacing-md)',
                                                backgroundColor: isUserMatch ? 'rgba(var(--accent), 0.05)' : 'var(--bg-tertiary)',
                                                borderRadius: '8px',
                                                border: isUserMatch ? '2px solid var(--accent)' : 'none'
                                            }}
                                        >
                                            {match.is_bye ? (
                                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                    <i className="fa-solid fa-person-walking" style={{ marginRight: '8px' }}></i>
                                                    {whitePlayer?.username} received a bye (+1 point)
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                <i className="fa-solid fa-chess-king" style={{ marginRight: '6px', color: '#fff' }}></i>
                                                                {whitePlayer?.username}
                                                            </div>
                                                        </div>
                                                        <div style={{ padding: '0 var(--spacing-md)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                            VS
                                                        </div>
                                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {blackPlayer?.username}
                                                                <i className="fa-solid fa-chess-king" style={{ marginLeft: '6px', color: '#000' }}></i>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginTop: 'var(--spacing-sm)'
                                                    }}>
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            {match.status === 'completed' ? (
                                                                <span style={{ color: '#22c55e' }}>
                                                                    <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                                                                    {match.result === 'white_win' ? 'White wins' :
                                                                        match.result === 'black_win' ? 'Black wins' : 'Draw'}
                                                                </span>
                                                            ) : match.status === 'active' ? (
                                                                <span style={{ color: 'var(--accent)' }}>
                                                                    <i className="fa-solid fa-circle fa-beat" style={{ marginRight: '4px' }}></i>
                                                                    In Progress
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                                    <i className="fa-regular fa-circle" style={{ marginRight: '4px' }}></i>
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>

                                                        {match.room_id && (
                                                            <button
                                                                onClick={() => isUserMatch ? handlePlayMatch(match.room_id) : handleSpectateMatch(match.room_id)}
                                                                className="btn-outline"
                                                                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                                            >
                                                                <i className={`fa-solid fa-${isUserMatch ? 'chess-board' : 'eye'}`} style={{ marginRight: '4px' }}></i>
                                                                {isUserMatch ? 'Play' : 'Spectate'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {}
                    {isAdmin && !isCompleted && (
                        <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Admin Controls</h3>
                            <button
                                onClick={handleNextRound}
                                className="btn-primary w-full"
                                disabled={!allMatchesComplete || advancing}
                            >
                                {advancing ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                        Advancing...
                                    </>
                                ) : tournament?.current_round >= tournament?.rounds_count ? (
                                    <>
                                        <i className="fa-solid fa-flag-checkered" style={{ marginRight: '8px' }}></i>
                                        Complete Tournament
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-forward" style={{ marginRight: '8px' }}></i>
                                        Next Round
                                    </>
                                )}
                            </button>
                            {!allMatchesComplete && (
                                <div style={{
                                    marginTop: 'var(--spacing-sm)',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    textAlign: 'center'
                                }}>
                                    All matches must be completed first
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {}
                <div className="card" style={{ height: 'fit-content', maxHeight: 'calc(100vh - 200px)', position: 'sticky', top: '20px' }}>
                    <TournamentLeaderboard
                        participants={participants}
                        currentUserId={user?.id}
                    />
                </div>
            </div>
        </div>
    );
};

export default TournamentDashboard;
