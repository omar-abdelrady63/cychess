import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';

const TIME_OPTIONS = [
    { value: 1, label: '1 min', sub: 'Bullet' },
    { value: 3, label: '3 min', sub: 'Blitz' },
    { value: 5, label: '5 min', sub: 'Blitz' },
    { value: 10, label: '10 min', sub: 'Rapid' },
    { value: 30, label: '30 min', sub: 'Classical' },
    { value: 60, label: '60 min', sub: 'Classical' },
];

const ActiveGames = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [timeControl, setTimeControl] = useState(10);
    const [preferredColor, setPreferredColor] = useState('white');
    const [loading, setLoading] = useState(false);

    const [matchmakingTimeControl, setMatchmakingTimeControl] = useState(10);
    const [isSearching, setIsSearching] = useState(false);
    const [searchDuration, setSearchDuration] = useState(0);
    const [currentRatingRange, setCurrentRatingRange] = useState({ min: 0, max: 0 });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (socket) {
            socket.on('queue_joined', () => {});
            socket.on('match_found', (data) => {
                setIsSearching(false);
                navigate(`/game/${data.room_id}`);
            });
            socket.on('match_cancelled', (data) => {
                setIsSearching(false);
                alert(data.message || 'No players found');
            });
            socket.on('rating_range_update', (data) => {
                setCurrentRatingRange({ min: data.minRating, max: data.maxRating });
            });
            socket.on('queue_left', () => setIsSearching(false));
            return () => {
                socket.off('queue_joined');
                socket.off('match_found');
                socket.off('match_cancelled');
                socket.off('rating_range_update');
                socket.off('queue_left');
            };
        }
    }, [socket, navigate]);

    useEffect(() => {
        let interval;
        if (isSearching) {
            setSearchDuration(0);
            interval = setInterval(() => setSearchDuration((prev) => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isSearching]);

    const handleCreateGame = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/game/create`, {
                time_control: timeControl,
                preferred_color: preferredColor
            });
            await navigator.clipboard.writeText(`${window.location.origin}/game/${response.data.room_id}`);
            navigate(`/game/${response.data.room_id}`);
        } catch (error) {
            console.error('Error creating game:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFindGame = () => {
        if (!socket) {
            alert('Not connected to server');
            return;
        }
        setIsSearching(true);
        setCurrentRatingRange({ min: user.rating - 50, max: user.rating + 50 });
        socket.emit('join_matchmaking_queue', { timeControl: matchmakingTimeControl });
    };

    const handleCancelSearch = () => {
        if (socket) socket.emit('leave_matchmaking_queue');
        setIsSearching(false);
        setSearchDuration(0);
    };

    const cardBase = 'rounded-2xl border border-white/10 bg-secondary/80 backdrop-blur-xl shadow-xl p-6 sm:p-8';
    const selectClass =
        'w-full rounded-xl bg-black/40 border border-white/10 py-3 px-4 pr-10 text-text-primary font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors cursor-pointer text-left appearance-none';

    return (
        <div className="space-y-8 pb-8">
            {}
            {isSearching && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className={`${cardBase} max-w-lg w-full text-center relative overflow-hidden`}>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

                        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center justify-center gap-3">
                            <i className="fa-solid fa-circle-notch fa-spin text-accent text-3xl" />
                            Finding opponent
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <span className="text-xs font-medium text-text-secondary opacity-80 block mb-1">Time control</span>
                                <span className="text-2xl font-bold text-text-primary">{matchmakingTimeControl} min</span>
                            </div>
                            {currentRatingRange.min !== 0 && (
                                <div className="rounded-xl border border-accent/20 bg-accent/10 p-4">
                                    <span className="text-xs font-medium text-accent opacity-90 block mb-1">Rating range</span>
                                    <span className="text-xl font-bold text-text-primary">
                                        {Math.round(currentRatingRange.min)} – {Math.round(currentRatingRange.max)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-5xl font-mono font-bold text-text-primary tabular-nums mb-8">
                            {Math.floor(searchDuration / 60)}:{(searchDuration % 60).toString().padStart(2, '0')}
                        </div>

                        <button
                            type="button"
                            onClick={handleCancelSearch}
                            className="w-full py-3 px-6 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 text-text-primary hover:text-red-400 hover:border-red-500/40 font-medium transition-all"
                        >
                            Cancel search
                        </button>
                    </div>
                </div>
            )}

            {}
            <div className={`${cardBase} relative overflow-hidden min-h-0`}>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-60 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-14">
                    <div className="flex-1 w-full min-w-0 space-y-6">
                        <div>
                            <span className="inline-block px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold mb-3">
                                Ranked matchmaking
                            </span>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary leading-tight">
                                Find a <span className="text-accent">worthy opponent</span>
                            </h1>
                            <p className="text-text-secondary opacity-80 mt-2 max-w-lg">
                                Enter the arena and test your skills against players worldwide.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-4 pt-2">
                            <div className="w-full sm:max-w-[200px]">
                                <label className="block text-sm font-medium text-text-secondary opacity-80 mb-2">Time control</label>
                                <div className="relative">
                                    <select
                                        value={matchmakingTimeControl}
                                        onChange={(e) => setMatchmakingTimeControl(Number(e.target.value))}
                                        className={selectClass}
                                        aria-label="Time control"
                                    >
                                        {TIME_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label} · {opt.sub}
                                            </option>
                                        ))}
                                    </select>
                                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm" aria-hidden="true" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleFindGame}
                                disabled={isSearching}
                                className="btn-primary min-w-[180px] h-[48px] flex items-center justify-center gap-2"
                            >
                                {isSearching ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin" />
                                        Searching…
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-play" />
                                        Play ranked
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className={`${cardBase} relative overflow-hidden min-h-0`}>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-14">
                    <div className="flex-1 w-full min-w-0">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
                            Casual play
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Friendly match</h2>
                        <p className="text-text-secondary opacity-80 mb-6 max-w-md">
                            Create a game room and share the link. No rating changes.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary opacity-80 mb-2">Time</label>
                                <div className="relative">
                                    <select
                                        value={timeControl}
                                        onChange={(e) => setTimeControl(Number(e.target.value))}
                                        className={selectClass}
                                        aria-label="Game time"
                                    >
                                        {[1, 3, 5, 10, 30, 60].map((t) => (
                                            <option key={t} value={t}>{t} min</option>
                                        ))}
                                    </select>
                                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm" aria-hidden="true" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary opacity-80 mb-2">Color</label>
                                <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 gap-0.5">
                                    {[
                                        { id: 'white', icon: 'fa-chess-pawn', iconClass: 'text-white/90' },
                                        { id: 'random', icon: 'fa-shuffle', iconClass: 'text-text-secondary' },
                                        { id: 'black', icon: 'fa-chess-pawn', iconClass: 'text-gray-800' },
                                    ].map(({ id, icon, iconClass }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setPreferredColor(id)}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${preferredColor === id ? 'bg-white/15 text-text-primary border border-white/20 shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                                        >
                                            <i className={`fa-solid ${icon} ${iconClass}`} />
                                            <span className="capitalize">{id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCreateGame}
                            disabled={loading}
                            className="btn-secondary w-full sm:max-w-sm flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-link" />
                            Create invite link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveGames;
