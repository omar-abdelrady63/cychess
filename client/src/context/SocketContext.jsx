import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        if (socket && socket.connected) return;

        console.log('Initializing socket connection...');

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: { userId: user._id || user.id }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);

            newSocket.emit('authenticate', { userId: user._id || user.id });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };

    }, [user?._id, user?.id]);

    const value = {
        socket,
        isConnected
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};