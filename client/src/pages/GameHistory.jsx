import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const GameHistory = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    useEffect(() => {
        fetchGames();
    }, [page]);

    const fetchGames = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/game/history?page=${page}&per_page=10`);
            setGames(response.data.games || []);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching game history:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyPGN = async (gameId) => {
        try {
            const response = await axios.get(`${API_URL}/api/game/${gameId}/pgn`);
            await navigator.clipboard.writeText(response.data.pgn);
            alert('PGN copied to clipboard!');
        } catch (error) {
            console.error('Error copying PGN:', error);
            alert('Failed to copy PGN');
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="page-title">Game History</h1>
            <p className="page-subtitle">View your past games</p>

            {games.length === 0 ? (
                <div className="card">
                    <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No games played yet. Create a game to get started!
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid">
                        {games.map((game) => (
                            <div key={game.id} className="card">
                                <h3>
                                    {game.white_player_username} vs {game.black_player_username}
                                </h3>
                                <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                                    <div>Result: <strong>{game.result?.replace('_', ' ')}</strong></div>
                                    <div>Date: {new Date(game.created_at).toLocaleDateString()}</div>
                                </div>
                                <button
                                    className="btn-outline w-full"
                                    style={{ marginTop: 'var(--spacing-md)' }}
                                    onClick={() => copyPGN(game.id)}
                                >
                                    Copy PGN
                                </button>
                            </div>
                        ))}
                    </div>

                    {pagination && pagination.pages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                            <button
                                className="btn-outline"
                                onClick={() => setPage(p => p - 1)}
                                disabled={!pagination.has_prev}
                            >
                                Previous
                            </button>
                            <span style={{ padding: 'var(--spacing-md)' }}>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                className="btn-outline"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!pagination.has_next}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GameHistory;
