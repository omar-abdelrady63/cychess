import { useState } from 'react';
import { UserPlus, UserCheck, MessageSquare, Clock, Trophy, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ProfileHeader = ({ user, friendStatus, onFriendAction }) => {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleFriendAction = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await onFriendAction();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFriendButton = () => {
        if (!currentUser || currentUser._id === user.id) return null;

        switch (friendStatus) {
            case 'friends':
                return (
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg cursor-default"
                        disabled
                    >
                        <UserCheck size={18} />
                        <span>Friends</span>
                    </button>
                );
            case 'sent':
                return (
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-gray-300 rounded-lg cursor-default"
                        disabled
                    >
                        <Clock size={18} />
                        <span>Request Sent</span>
                    </button>
                );
            case 'received':
                return (
                    <button
                        onClick={handleFriendAction}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        {loading ? '...' : (
                            <>
                                <UserPlus size={18} />
                                <span>Accept Request</span>
                            </>
                        )}
                    </button>
                );
            default:
                return (
                    <button
                        onClick={handleFriendAction}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        {loading ? '...' : (
                            <>
                                <UserPlus size={18} />
                                <span>Add Friend</span>
                            </>
                        )}
                    </button>
                );
        }
    };

    return (
        <div className="bg-secondary/30 rounded-xl p-6 border border-white/5 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
                {}
                <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-secondary shadow-xl">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                            alt={user.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {user.is_online && (
                        <div className="absolute bottom-2 right-2 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-secondary" title="Online" />
                    )}
                </div>

                {}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                            {user.username}
                            <span className="text-text-secondary text-lg md:text-xl font-normal ml-1">
                                #{user.discriminator}
                            </span>
                        </h1>
                        <span className="bg-background/50 text-accent px-3 py-1 rounded-full text-sm font-medium border border-accent/20 mx-auto md:mx-0">
                            {user.rating} Rating
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-text-secondary text-sm mb-6">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            <span>Last seen {formatDate(user.last_seen)}</span>
                        </div>
                    </div>

                    {}
                    <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto md:mx-0">
                        <div className="bg-black/20 p-3 rounded-lg text-center">
                            <div className="text-green-400 font-bold text-xl">{user.stats.wins}</div>
                            <div className="text-xs text-text-secondary uppercase tracking-wider">Wins</div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg text-center">
                            <div className="text-red-400 font-bold text-xl">{user.stats.losses}</div>
                            <div className="text-xs text-text-secondary uppercase tracking-wider">Losses</div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg text-center">
                            <div className="text-gray-400 font-bold text-xl">{user.stats.draws}</div>
                            <div className="text-xs text-text-secondary uppercase tracking-wider">Draws</div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-start gap-3">
                        {getFriendButton()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
