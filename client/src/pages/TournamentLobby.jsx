import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const TournamentLobby = () => {
    const { tournamentId } = useParams();
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [starting, setStarting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchTournamentData();
    }, [tournamentId]);

    useEffect(() => {
        if (socket && tournamentId) {

            socket.emit('join_tournament_room', { tournament_id: tournamentId });

            socket.on('tournament_participant_joined', (data) => {
                setParticipants(prev => [...prev, data.participant]);
            });

            socket.on('tournament_started', () => {
                navigate(`/tournament/${tournamentId}`);
            });

            return () => {
                socket.emit('leave_tournament_room', { tournament_id: tournamentId });
                socket.off('tournament_participant_joined');
                socket.off('tournament_started');
            };
        }
    }, [socket, tournamentId, navigate]);

    const fetchTournamentData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tournament/${tournamentId}`);
            setTournament(response.data.tournament);
            setParticipants(response.data.participants);

            if (response.data.tournament.status === 'active') {
                navigate(`/tournament/${tournamentId}`);
            }
        } catch (err) {
            console.error('Fetch tournament error:', err);
            setError(err.response?.data?.error || 'Failed to load tournament');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTournament = async () => {
        setStarting(true);
        try {
            await axios.post(`${API_URL}/api/tournament/${tournamentId}/start`);

        } catch (err) {
            console.error('Start tournament error:', err);
            alert(err.response?.data?.error || 'Failed to start tournament');
            setStarting(false);
        }
    };

    const copyInviteLink = () => {
        const inviteCode = tournament?.invite_link;
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            alert(`Invite code copied: ${inviteCode}`);
        }
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

    return (
        <div className="container">
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <i className="fa-solid fa-trophy" style={{ marginRight: '10px', color: 'var(--accent)' }}></i>
                        {tournament?.name}
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Waiting for tournament to start...
                    </div>
                </div>

                {}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-xl)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rounds</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {tournament?.rounds_count}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Control</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {tournament?.time_control?.initial / 60}+{tournament?.time_control?.increment}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {tournament?.is_ranked ? 'Ranked' : 'Casual'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Players</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {participants.length}
                        </div>
                    </div>
                </div>

                {}
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(var(--accent), 0.1)',
                    borderRadius: '8px',
                    marginBottom: 'var(--spacing-xl)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Share this code with players:
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-md)'
                    }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            color: 'var(--accent)',
                            letterSpacing: '4px'
                        }}>
                            {tournament?.invite_link}
                        </div>
                        <button onClick={copyInviteLink} className="btn-outline" style={{ padding: '8px 16px' }}>
                            <i className="fa-solid fa-copy"></i>
                        </button>
                    </div>
                </div>

                {}
                <div>
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
                        Participants ({participants.length})
                    </h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {participants.map((participant, index) => (
                            <div
                                key={participant.id}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--bg-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-md)'
                                }}
                            >
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {participant.user?.username}
                                        {(participant.user?._id === tournament?.admin?.id || participant.user?._id === tournament?.admin?._id) && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '0.8rem',
                                                color: 'var(--accent)',
                                                fontWeight: 'normal'
                                            }}>
                                                <i className="fa-solid fa-crown"></i> Admin
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Rating: {participant.user?.rating || 1200}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {}
                {isAdmin && (
                    <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <button
                            onClick={handleStartTournament}
                            className="btn-primary w-full"
                            disabled={participants.length < 2 || starting}
                            style={{
                                fontSize: '1.1rem',
                                padding: 'var(--spacing-md) var(--spacing-lg)'
                            }}
                        >
                            {starting ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                    Starting Tournament...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-play" style={{ marginRight: '8px' }}></i>
                                    Start Tournament
                                </>
                            )}
                        </button>
                        {participants.length < 2 && (
                            <div style={{
                                marginTop: 'var(--spacing-sm)',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Need at least 2 participants to start
                            </div>
                        )}
                    </div>
                )}

                {}
                {!isAdmin && (
                    <div style={{
                        marginTop: 'var(--spacing-xl)',
                        textAlign: 'center',
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px'
                    }}>
                        <i className="fa-solid fa-clock" style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '8px' }}></i>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            Waiting for admin to start the tournament...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentLobby;
