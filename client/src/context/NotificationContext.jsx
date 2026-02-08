import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return ctx;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [popupQueue, setPopupQueue] = useState([]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
            const list = (data.notifications || []).map((n) => ({
                ...n,
                id: n.id || n._id?.toString?.() || n._id,
            }));
            setNotifications(list);
            setUnreadCount(data.unread_count ?? 0);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchNotifications();
        else {
            setNotifications([]);
            setUnreadCount(0);
            setPopupQueue([]);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_notification', (payload) => {
            const id = payload.id || payload._id?.toString?.() || payload._id;
            const notifId = typeof id === 'string' ? id : id?.toString?.();
            const notif = {
                _id: id,
                id: notifId,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                data: payload.data || {},
                is_read: false,
                created_at: new Date().toISOString(),
            };
            setPopupQueue(prev => [notif, ...prev].slice(0, 10));
            setNotifications(prev => [notif, ...prev].slice(0, 50));
            setUnreadCount(c => c + 1);
            setTimeout(() => {
                setPopupQueue(prev => prev.filter(n => (n.id || n._id) !== notifId));
            }, 8000);
        });
        return () => socket.off('new_notification');
    }, [socket]);

    const removePopup = useCallback((id) => {
        setPopupQueue(prev => prev.filter(n => (n.id || n._id) !== id));
    }, []);

    const acceptGameInvite = useCallback(async (notification) => {
        const notifId = (notification.id || notification._id?.toString?.() || notification._id)?.toString?.();
        const roomIdFromData = notification.data?.room_id;
        let roomId = roomIdFromData;

        if (notifId) {
            try {
                const res = await axios.post(
                    `${API_URL}/api/notifications/${notifId}/accept-game`,
                    {},
                    { withCredentials: true }
                );
                if (res.data?.room_id) roomId = res.data.room_id;
            } catch (err) {
                console.error('Accept game invite error:', err);
            }
        }

        if (roomId) {
            navigate(`/game/${roomId}`);
        }

        const idMatch = (n) => (n.id || n._id?.toString?.() || n._id)?.toString?.() === notifId;
        setNotifications(prev => prev.filter(n => !idMatch(n)));
        setPopupQueue(prev => prev.filter(n => !idMatch(n)));
        setUnreadCount(c => Math.max(0, c - 1));
    }, [navigate]);

    const markAsRead = useCallback(async (id) => {
        try {
            await axios.post(`${API_URL}/api/notifications/${id}/read`, {}, { withCredentials: true });
            setNotifications(prev => prev.map(n => (n.id || n._id) === id ? { ...n, is_read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (err) {
            console.error('Mark read error:', err);
        }
    }, []);

    const dismissPopup = useCallback((id) => {
        removePopup(id);
    }, [removePopup]);

    const value = {
        notifications,
        unreadCount,
        popupQueue,
        fetchNotifications,
        acceptGameInvite,
        markAsRead,
        removePopup: dismissPopup,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
