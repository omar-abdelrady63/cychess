import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GameHistory = () => {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
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
        fetchGames();
    }, [page, API_URL]);

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

    const cardBase = 'rounded-2xl border border-white/10 bg-secondary/80 backdrop-blur-xl shadow-xl p-6';

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Game history</h1>
                <p className="text-text-secondary opacity-80 mt-1">View your past games</p>
            </div>

            {games.length === 0 ? (
                <div className={`${cardBase} text-center`}>
                    <p className="text-text-secondary opacity-80">
                        No games played yet. Create a game to get started.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4">
                        {games.map((game) => (
                            <div key={game.id} className={`${cardBase} hover:border-white/20 transition-colors`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                                            {game.white_player_username} <span className="text-text-secondary font-normal">vs</span> {game.black_player_username}
                                        </h3>
                                        <div className="text-sm text-text-secondary opacity-80 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-trophy text-accent/80" />
                                                Result: <span className="font-medium text-text-primary capitalize">{game.result?.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="fa-regular fa-calendar" />
                                                {new Date(game.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => copyPGN(game.id)}
                                            className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2"
                                        >
                                            <i className="fa-solid fa-copy" />
                                            Copy PGN
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/game/${game.id}/analysis`)}
                                            className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2"
                                        >
                                            <i className="fa-solid fa-chart-line" />
                                            Analyze
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination && pagination.pages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                type="button"
                                onClick={() => setPage((p) => p - 1)}
                                disabled={!pagination.has_prev}
                                className="btn-secondary disabled:opacity-50"
                            >
                                <i className="fa-solid fa-chevron-left mr-1" />
                                Previous
                            </button>
                            <span className="text-text-secondary text-sm opacity-80">
                                Page <span className="font-semibold text-text-primary">{pagination.page}</span> of {pagination.pages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!pagination.has_next}
                                className="btn-secondary disabled:opacity-50"
                            >
                                Next
                                <i className="fa-solid fa-chevron-right ml-1" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GameHistory;
