import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const Dashboard = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [timeControl, setTimeControl] = useState(10);
    const [preferredColor, setPreferredColor] = useState('white');
    const [friends, setFriends] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchFriends();
        fetchNotifications();
        fetchPendingRequests();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (notification) => {
                const normalizedNotification = {
                    ...notification,
                    _id: notification._id || notification.id
                };

                setNotifications(prev => [normalizedNotification, ...prev]);
                fetchPendingRequests();
            });

            socket.on('friend_list_update', () => {
                fetchFriends();
                fetchPendingRequests();
            });

            socket.on('friend_status_update', (data) => {
                setFriends(prev => prev.map(friend =>
                    friend.id === data.user_id
                        ? { ...friend, status: data.status }
                        : friend
                ));
            });

            return () => {
                socket.off('new_notification');
                socket.off('friend_list_update');
                socket.off('friend_status_update');
            };
        }
    }, [socket]);

    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/friends`);
            setFriends(response.data.friends || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/notifications`);
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
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

    const acceptFriendRequest = async (requestId) => {
        try {
            await axios.post(`${API_URL}/api/friends/accept/${requestId}`);
            fetchPendingRequests();
            fetchFriends();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const acceptGameInvite = async (notificationId) => {
        if (!notificationId) return; // Guard against undefined IDs
        try {
            const response = await axios.post(`${API_URL}/api/notifications/${notificationId}/accept-game`);
            navigate(`/game/${response.data.room_id}`);
        } catch (error) {
            console.error('Error accepting game invite:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.post(`${API_URL}/api/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, is_read: true } : n)
            );
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`${API_URL}/api/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
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

    const sendFriendRequest = async (userId) => {
        try {
            await axios.post(`${API_URL}/api/friends/send-request`, {
                receiver_id: userId
            });
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleCreateGame = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/game/create`, {
                time_control: timeControl,
                preferred_color: preferredColor
            });

            const gameLink = `${window.location.origin}/game/${response.data.room_id}`;
            await navigator.clipboard.writeText(gameLink);

            navigate(`/game/${response.data.room_id}`);
        } catch (error) {
            console.error('Error creating game:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFriend = async (friendId) => {
        if (confirm('Are you sure you want to delete this friend?')) {
            try {
                await axios.delete(`${API_URL}/api/friends/delete/${friendId}`);
                fetchFriends();
            } catch (error) {
                console.error('Error deleting friend:', error);
                alert('Failed to delete friend');
            }
        }
    };

    const handleBlockFriend = async (friendId) => {
        if (confirm('Are you sure you want to block this user?')) {
            try {
                await axios.post(`${API_URL}/api/friends/block/${friendId}`);
                fetchFriends();
            } catch (error) {
                console.error('Error blocking user:', error);
                alert('Failed to block user');
            }
        }
    };

    const handleSpectate = async (friendId) => {
        try {
            const response = await axios.get(`${API_URL}/api/game/friend/${friendId}/active-game`);
            if (response.data.room_id) {
                navigate(`/game/${response.data.room_id}?spectate=true`);
            }
        } catch (error) {
            console.error('Error getting friend game:', error);
            alert('Could not find active game');
        }
    };

    const renderStatus = (status) => {
        switch (status) {
            case 'online':
                return <><i className="fa-solid fa-circle" style={{ color: '#22c55e', fontSize: '0.6rem', marginRight: '4px', verticalAlign: 'middle' }}></i> Online</>;
            case 'offline':
                return <><i className="fa-regular fa-circle" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', marginRight: '4px', verticalAlign: 'middle' }}></i> Offline</>;
            case 'in_game':
                return <><i className="fa-solid fa-chess" style={{ color: '#f97316', fontSize: '0.6rem', marginRight: '4px', verticalAlign: 'middle' }}></i> In Game</>;
            case 'spectating':
                return <><i className="fa-solid fa-eye" style={{ color: '#3b82f6', fontSize: '0.6rem', marginRight: '4px', verticalAlign: 'middle' }}></i> Spectating</>;
            default:
                return <><i className="fa-regular fa-circle" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', marginRight: '4px', verticalAlign: 'middle' }}></i> Offline</>;
        }
    };

    return (
        <div className="container">
            <h1 className="page-title">Welcome, {user?.username}</h1>
            <p className="page-subtitle">Ready to play some chess?</p>

            {pendingRequests.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-xl)', backgroundColor: 'rgba(var(--accent), 0.1)', overflow: 'hidden' }}>
                    <h2>Pending Friend Requests ({pendingRequests.length})</h2>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--bg-tertiary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <strong>{request.sender_full_name}</strong>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => acceptFriendRequest(request.id)}
                                >
                                    Accept
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2>Add Friends</h2>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Search by username or username#discriminator"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length >= 2) {
                                searchUsers();
                            } else {
                                setSearchResults([]);
                            }
                        }}
                    />
                </div>

                {searching && <div className="text-center">Searching...</div>}

                {searchResults.length > 0 && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {searchResults.map((result) => (
                            <div
                                key={result.id}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--bg-tertiary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <strong>{result.full_name}</strong>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {renderStatus(result.status || (result.is_online ? 'online' : 'offline'))}
                                    </div>
                                </div>
                                {result.friend_status === 'none' && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => sendFriendRequest(result.id)}
                                    >
                                        Add Friend
                                    </button>
                                )}
                                {result.friend_status === 'sent' && (
                                    <span style={{ color: 'var(--text-secondary)' }}>Request Sent</span>
                                )}
                                {result.friend_status === 'friends' && (
                                    <span style={{ color: 'var(--accent)' }}>
                                        <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> Friends
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-2">
                <div className="card">
                    <h2>Create New Game</h2>

                    <div className="form-group">
                        <label>Time Control (minutes)</label>
                        <select value={timeControl} onChange={(e) => setTimeControl(e.target.value)}>
                            <option value="1">1 minute</option>
                            <option value="3">3 minutes</option>
                            <option value="5">5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">60 minutes</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Piece Color</label>
                        <select value={preferredColor} onChange={(e) => setPreferredColor(e.target.value)}>
                            <option value="white">White</option>
                            <option value="black">Black</option>
                            <option value="random">Random</option>
                        </select>
                        <small>Choose which color pieces you want to play with</small>
                    </div>

                    <button
                        className="btn-primary w-full"
                        onClick={handleCreateGame}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Game'}
                    </button>
                    <small style={{ display: 'block', marginTop: 'var(--spacing-sm)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Game link will be copied to clipboard
                    </small>
                </div>

                {/* Friends Card */}
                <div className="card">
                    <h2>Friends ({friends.length})</h2>
                    {friends.length === 0 ? (
                        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            No friends yet. Search for users to add friends!
                        </p>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
                            {friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        borderBottom: '1px solid var(--bg-tertiary)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <strong>{friend.full_name} {friend.rating ? `(${friend.rating})` : ''}</strong>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {renderStatus(friend.status || (friend.is_online ? 'online' : 'offline'))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {friend.status === 'in_game' && (
                                            <button
                                                className="btn-primary"
                                                onClick={() => handleSpectate(friend.id)}
                                                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                            >
                                                <i className="fa-solid fa-eye" style={{ marginRight: '4px' }}></i>
                                                Spectate
                                            </button>
                                        )}
                                        <button
                                            className="btn-outline"
                                            onClick={() => handleDeleteFriend(friend.id)}
                                            style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="btn-outline"
                                            onClick={() => handleBlockFriend(friend.id)}
                                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                        >
                                            Block
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <h2>Notifications ({notifications.filter(n => !n.is_read).length} unread)</h2>
                {notifications.length === 0 ? (
                    <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No notifications
                    </p>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {notifications.slice(0, 10).map((notification) => (
                            <div
                                key={notification._id || notification.id} // Fix Key
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--bg-tertiary)',
                                    backgroundColor: notification.is_read ? 'transparent' : 'rgba(var(--accent), 0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                                        {notification.title}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {notification.message}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                        {new Date(notification.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {notification.type === 'game_invite' && !notification.is_read && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => acceptGameInvite(notification._id)}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                        >
                                            Accept
                                        </button>
                                    )}
                                    {!notification.is_read && (
                                        <button
                                            className="btn-outline"
                                            onClick={() => markAsRead(notification._id)}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                            title="Mark as Read"
                                        >
                                            <i className="fa-solid fa-check"></i>
                                        </button>
                                    )}
                                    <button
                                        className="btn-outline"
                                        onClick={() => deleteNotification(notification._id)}
                                        style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }}
                                        title="Delete"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;