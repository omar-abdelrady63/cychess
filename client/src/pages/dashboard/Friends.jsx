import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const Friends = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const searchRef = useRef(null);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('friend_list_update', () => {
                fetchFriends();
                fetchPendingRequests();
            });
            socket.on('friend_status_update', (data) => {
                setFriends(prev => prev.map(friend =>
                    friend.id === data.user_id
                        ? { ...friend, status: data.status, is_online: data.is_online }
                        : friend
                ));
            });
            return () => {
                socket.off('friend_list_update');
                socket.off('friend_status_update');
            };
        }
    }, [socket]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchFocused(false);
                setTimeout(() => setSearchResults([]), 150);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/friends`);
            setFriends(response.data.friends || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/friends/pending`);
            setPendingRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };

    const searchUsers = async () => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const response = await axios.get(`${API_URL}/api/friends/search?q=${searchQuery}`);
            setSearchResults(response.data.users || []);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const sendFriendRequest = async (receiverId) => {
        try {
            await axios.post(`${API_URL}/api/friends/send-request`, { receiver_id: receiverId });
            setSearchQuery('');
            setSearchResults([]);
            alert('Friend request sent!');
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert(error.response?.data?.error || 'Failed to send request');
        }
    };

    const acceptFriendRequest = async (requestId) => {
        try {
            await axios.post(`${API_URL}/api/friends/accept/${requestId}`);
            fetchPendingRequests();
            fetchFriends();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const rejectFriendRequest = async (requestId) => {
        try {
            await axios.post(`${API_URL}/api/friends/reject/${requestId}`);
            fetchPendingRequests();
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    };

    const handleDeleteFriend = async (friendId, e) => {
        e?.stopPropagation();
        if (!window.confirm('Remove this friend?')) return;
        try {
            await axios.delete(`${API_URL}/api/friends/delete/${friendId}`);
            fetchFriends();
        } catch (error) {
            console.error('Error deleting friend:', error);
        }
    };

    const handleBlockFriend = async (friendId, e) => {
        e?.stopPropagation();
        if (!window.confirm('Block this user? They will be removed from your friends and cannot contact you.')) return;
        try {
            await axios.post(`${API_URL}/api/friends/block/${friendId}`);
            fetchFriends();
        } catch (error) {
            console.error('Error blocking user:', error);
            alert(error.response?.data?.error || 'Failed to block');
        }
    };

    const handleSpectate = async (friendId, e) => {
        e?.stopPropagation();
        try {
            const response = await axios.get(`${API_URL}/api/game/friend/${friendId}/active-game`);
            if (response.data.room_id) {
                navigate(`/game/${response.data.room_id}?spectate=true`);
            } else {
                alert('Friend is not in an active game');
            }
        } catch (error) {
            console.error('Error getting friend game:', error);
            alert('Could not find active game');
        }
    };

    const cardBase = 'rounded-2xl border border-white/10 bg-secondary/80 backdrop-blur-xl shadow-xl p-4 sm:p-6';

    return (
        <div className="space-y-6 sm:space-y-8 pb-8">
            {}
            <div ref={searchRef} className="w-full">
                <div className="relative w-full max-w-2xl">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length >= 2) searchUsers();
                            else setSearchResults([]);
                        }}
                        onFocus={() => setSearchFocused(true)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors text-base"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-accent/80 pointer-events-none" aria-hidden="true" />

                    {searchFocused && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-secondary/95 backdrop-blur-xl shadow-xl overflow-hidden z-30 max-h-[280px] overflow-y-auto">
                            {searchResults.map((userResult) => (
                                <div key={userResult.id} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 flex items-center justify-between gap-3 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-text-primary font-semibold border border-white/10 shrink-0">
                                            {userResult.username[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-text-primary truncate">{userResult.full_name || userResult.username}</div>
                                            <div className="text-xs text-text-secondary opacity-80 truncate">@{userResult.username}</div>
                                        </div>
                                    </div>
                                    {userResult.id !== user?.id && (
                                        <button
                                            type="button"
                                            onClick={() => sendFriendRequest(userResult.id)}
                                            className="btn-primary text-sm py-2 px-4 flex items-center gap-2 shrink-0"
                                        >
                                            <i className="fa-solid fa-plus" />
                                            Add
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {}
            {pendingRequests.length > 0 && (
                <div className={cardBase}>
                    <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                        Incoming requests
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="rounded-xl border border-white/10 bg-black/30 p-3 sm:p-4 flex items-center justify-between gap-2 hover:border-accent/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-text-primary border border-white/10 shrink-0">
                                        {request.sender_username[0].toUpperCase()}
                                    </div>
                                    <span className="font-medium text-text-primary truncate">{request.sender_username}</span>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button type="button" onClick={() => acceptFriendRequest(request.id)} className="w-9 h-9 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center border border-green-500/30" title="Accept"><i className="fa-solid fa-check" /></button>
                                    <button type="button" onClick={() => rejectFriendRequest(request.id)} className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center border border-red-500/30" title="Decline"><i className="fa-solid fa-xmark" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                <button
                    type="button"
                    onClick={() => searchRef.current?.querySelector('input')?.focus()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 hover:border-accent/50 bg-white/5 hover:bg-white/10 p-6 sm:p-8 min-h-[200px] sm:min-h-[260px] transition-all group"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-3 sm:mb-4 group-hover:scale-105 transition-transform border border-accent/30">
                        <i className="fa-solid fa-plus text-lg sm:text-xl" />
                    </div>
                    <span className="font-semibold text-text-secondary group-hover:text-text-primary transition-colors text-sm">Add friend</span>
                </button>

                {friends.map((friend) => (
                    <div
                        key={friend.id}
                        className={`${cardBase} hover:border-white/20 transition-all cursor-pointer group/card flex flex-col relative overflow-hidden`}
                        onClick={() => navigate(`/profile/${friend.username}`)}
                    >
                        <div className={`absolute top-0 left-0 right-0 h-1 ${friend.status === 'in_game' ? 'bg-gradient-to-r from-orange-500 to-red-500' : friend.is_online ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-white/10'}`} />

                        <div className="flex items-start justify-between gap-2 mb-4 pt-1">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 flex items-center justify-center text-lg sm:text-xl font-bold text-text-primary overflow-hidden border border-white/10">
                                        {friend.avatar ? (
                                            <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            friend.username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-secondary ${friend.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base sm:text-lg font-semibold text-text-primary truncate">{friend.full_name || friend.username}</h3>
                                    <p className="text-xs text-text-secondary opacity-80 mt-0.5">
                                        {friend.status === 'in_game' ? <span className="text-orange-400">In match</span> : friend.is_online ? <span className="text-green-400">Online</span> : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <button type="button" onClick={(e) => handleBlockFriend(friend.id, e)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-text-secondary hover:text-red-400 transition-colors" title="Block"><i className="fa-solid fa-ban text-sm" /></button>
                                <button type="button" onClick={(e) => handleDeleteFriend(friend.id, e)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-red-400 transition-colors" title="Remove friend"><i className="fa-solid fa-trash-can text-sm" /></button>
                            </div>
                        </div>

                        <div className="mt-auto pt-2 space-y-2">
                            {friend.status === 'in_game' ? (
                                <button type="button" onClick={(e) => handleSpectate(friend.id, e)} className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-eye" /> Spectate
                                </button>
                            ) : (
                                <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${friend.username}`); }} className="btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2">
                                    View profile
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Friends;
