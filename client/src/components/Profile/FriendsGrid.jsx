import { useNavigate } from 'react-router-dom';

const FriendsGrid = ({ friends }) => {
    const navigate = useNavigate();

    if (!friends || friends.length === 0) {
        return (
            <div className="text-center py-10 text-text-secondary">
                <p>No friends added yet.</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'in_game': return 'bg-yellow-500';
            case 'spectating': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = (status) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
                <div
                    key={friend.username}
                    onClick={() => navigate(`/profile/${friend.username}`)}
                    className="bg-black/20 p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer border border-white/5 group"
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary">
                            <img
                                src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&background=random`}
                                alt={friend.username}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-secondary ${getStatusColor(friend.is_online ? 'online' : 'offline')}`} />
                    </div>

                    <div>
                        <div className="font-semibold text-white group-hover:text-accent transition-colors">
                            {friend.username}
                        </div>
                        <div className="text-xs text-text-secondary">
                            {getStatusText(friend.is_online ? 'online' : 'offline')} • {friend.rating}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FriendsGrid;
