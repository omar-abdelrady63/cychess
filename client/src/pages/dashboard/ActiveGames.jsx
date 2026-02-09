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
            socket.on('queue_joined', () => { });
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

    const cardBase = 'rounded-3xl border border-white/10 bg-secondary/90 backdrop-blur-2xl shadow-2xl p-8 sm:p-12 transition-all duration-300 hover:border-white/20 hover:shadow-accent/5';
    const selectClass =
        'w-full rounded-xl bg-black/40 border border-white/10 py-4 px-5 pr-10 text-text-primary font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors cursor-pointer text-left appearance-none text-lg';

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-4 tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">Play Chess</span>
                </h1>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed opacity-80">
                    Challenge opponents worldwide or create a casual game for friends.
                </p>
            </div>

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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Ranked Panel */}
                <div className="bg-secondary/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-transparent opacity-50" />
                    <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                        <i className="fa-solid fa-trophy text-9xl text-accent rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 text-accent">
                                <i className="fa-solid fa-trophy text-xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">Ranked Match</h2>
                                <p className="text-text-secondary text-sm">Find a worthy opponent</p>
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-2xl p-6 border border-white/5 mb-8">
                            <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 pl-1">
                                Time Control
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TIME_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setMatchmakingTimeControl(opt.value)}
                                        className={`p-3 rounded-xl border transition-all text-center group/btn ${matchmakingTimeControl === opt.value
                                            ? 'bg-accent/20 border-accent/50 text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]'
                                            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="text-lg font-bold mb-0.5">{opt.label}</div>
                                        <div className={`text-xs font-medium ${matchmakingTimeControl === opt.value ? 'text-accent' : 'text-text-secondary/60'}`}>
                                            {opt.sub}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleFindGame}
                            disabled={isSearching}
                            className="w-full py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-lg shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 mt-auto"
                        >
                            {isSearching ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-play" />
                                    Find Match
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Casual Panel */}
                <div className="bg-secondary/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-xl flex flex-col h-full relative overflow-hidden group hover:bg-secondary/80 transition-colors">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-50" />
                    <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                        <i className="fa-solid fa-handshake text-9xl text-blue-500 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                                <i className="fa-solid fa-handshake text-xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">Casual Game</h2>
                                <p className="text-text-secondary text-sm">Play with a friend</p>
                            </div>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 pl-1">
                                    Time Control
                                </label>
                                <div className="relative">
                                    <select
                                        value={timeControl}
                                        onChange={(e) => setTimeControl(Number(e.target.value))}
                                        className={selectClass}
                                    >
                                        {[1, 3, 5, 10, 30, 60].map((t) => (
                                            <option key={t} value={t}>{t} min</option>
                                        ))}
                                    </select>
                                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 pl-1">
                                    Your Color
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'white', label: 'White', icon: 'fa-chess-pawn', color: 'text-white' },
                                        { id: 'random', label: 'Random', icon: 'fa-shuffle', color: 'text-text-secondary' },
                                        { id: 'black', label: 'Black', icon: 'fa-chess-pawn', color: 'text-gray-900' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setPreferredColor(opt.id)}
                                            className={`py-3 px-2 rounded-xl border transition-all flex flex-col items-center gap-2 ${preferredColor === opt.id
                                                ? 'bg-white/10 border-white/20 text-white shadow-sm'
                                                : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5'
                                                }`}
                                        >
                                            <i className={`fa-solid ${opt.icon} ${opt.color} text-lg`} />
                                            <span className="text-xs font-bold">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCreateGame}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-lg transition-all flex items-center justify-center gap-3 mt-auto"
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-link" />
                                    Create Invite Link
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveGames;
