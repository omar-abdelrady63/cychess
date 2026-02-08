import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Trophy, XCircle, MinusCircle, Clock } from 'lucide-react';

const MatchHistory = ({ history }) => {
    const navigate = useNavigate();

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-10 text-text-secondary">
                <p>No matches played yet.</p>
            </div>
        );
    }

    const getResultIcon = (result) => {
        switch (result) {
            case 'win':
                return <Trophy className="text-yellow-500" size={18} />;
            case 'loss':
                return <XCircle className="text-red-500" size={18} />;
            case 'draw':
                return <MinusCircle className="text-gray-400" size={18} />;
            default:
                return <MinusCircle className="text-gray-400" size={18} />;
        }
    };

    const getResultText = (result) => {
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const getResultColor = (result) => {
        switch (result) {
            case 'win': return 'text-green-400 bg-green-400/10';
            case 'loss': return 'text-red-400 bg-red-400/10';
            case 'draw': return 'text-gray-400 bg-gray-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-text-secondary text-sm border-b border-white/10">
                        <th className="p-4 font-medium">Result</th>
                        <th className="p-4 font-medium">Opponent</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium hidden md:table-cell">Moves</th>
                        <th className="p-4 font-medium text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((game) => (
                        <tr
                            key={game.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                        >
                            <td className="p-4">
                                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm font-medium ${getResultColor(game.result)}`}>
                                    {getResultIcon(game.result)}
                                    <span>{getResultText(game.result)}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => navigate(`/profile/${game.opponent.username}`)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                                        <img
                                            src={game.opponent.avatar || `https://ui-avatars.com/api/?name=${game.opponent.username}&background=random`}
                                            alt={game.opponent.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white group-hover:text-accent transition-colors">
                                            {game.opponent.username}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {game.opponent.rating}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-text-secondary text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    {formatDate(game.date)}
                                </div>
                            </td>
                            <td className="p-4 text-text-secondary text-sm hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono">{game.moves_count}</span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => navigate(`/game/${game.room_id}`)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary-hover text-white text-sm rounded-lg transition-colors border border-white/10"
                                >
                                    <Play size={14} />
                                    View Game
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MatchHistory;
