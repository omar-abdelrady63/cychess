import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const GameRejoinHandler = () => {
    const { socket } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        const handleActiveGameFound = (data) => {
            console.log('Active game found! Redirecting to:', data.room_id);
            navigate(`/game/${data.room_id}`);
        };

        socket.on('active_game_found', handleActiveGameFound);

        return () => {
            socket.off('active_game_found', handleActiveGameFound);
        };
    }, [socket, navigate]);

    return null;
};

export default GameRejoinHandler;
