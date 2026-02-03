import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import './NotificationPopup.css';

const NotificationPopup = () => {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (notification) => {
                const popupNotification = {
                    ...notification,
                    id: notification.id || notification._id,
                    timestamp: Date.now()
                };

                setNotifications(prev => [popupNotification, ...prev]);

                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== popupNotification.id));
                }, 8000);
            });

            return () => {
                socket.off('new_notification');
            };
        }
    }, [socket]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = async (notification) => {
        if (notification.type === 'game_invite' && notification.id) {
            try {
                const res = await axios.post(
                    `${API_URL}/api/notifications/${notification.id}/accept-game`,
                    {},
                    { withCredentials: true }
                );

                if (res.data.success) {
                    navigate(`/game/${res.data.room_id}`);
                }
            } catch (error) {
                console.error('Accept invite error:', error);
                if (notification.data && notification.data.room_id) {
                    navigate(`/game/${notification.data.room_id}`);
                }
            }
        }

        removeNotification(notification.id);
    };

    if (notifications.length === 0) return null;

    return (
        <div className="notification-popup-container">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification-popup ${notification.type === 'game_invite' ? 'invite' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: notification.type === 'game_invite' ? 'pointer' : 'default' }}
                >
                    <div className="notification-popup-header">
                        <strong>{notification.title}</strong>
                        <button
                            className="notification-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                            }}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="notification-popup-message">
                        {notification.message}
                        {notification.type === 'game_invite' && (
                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#4ade80' }}>
                                <i className="fa-solid fa-play" style={{ marginRight: '4px' }}></i> Click to Join Game
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationPopup;
