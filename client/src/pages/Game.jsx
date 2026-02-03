import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Game.css';

const moveSound = new Audio('/assets/sounds/move.mp3');
const captureSound = new Audio('/assets/sounds/capture.mp3');
const castleSound = new Audio('/assets/sounds/castle.mp3');
const checkSound = new Audio('/assets/sounds/check.mp3');
const finishSound = new Audio('/assets/sounds/finish.mp3');
const notifySound = new Audio('/assets/sounds/notify.mp3');

const getAvatar = (username) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`;

const ChessTimer = ({ time, isTurn }) => {
    const [displayTime, setDisplayTime] = useState(time);

    useEffect(() => setDisplayTime(time), [time]);

    useEffect(() => {
        let interval;
        if (isTurn && displayTime > 0) {
            interval = setInterval(() => {
                setDisplayTime(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTurn, displayTime]);

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className={`timer ${isTurn ? 'active-timer' : ''}`}>
            {formatTime(displayTime)}
        </div>
    );
};

// Simple countdown for abandonment
const AbandonmentTimer = ({ seconds, reason }) => {
    const [count, setCount] = useState(seconds);

    useEffect(() => {
        setCount(seconds);
    }, [seconds]);

    useEffect(() => {
        if (count <= 0) return;
        const interval = setInterval(() => setCount(c => c - 1), 1000);
        return () => clearInterval(interval);
    }, [count]);

    const reasonText = reason === 'disconnect' ? 'Auto-Resign in' : 'Inactivity Auto-Loss in';

    return (
        <div style={{ color: 'red', fontWeight: 'bold', marginLeft: '10px' }}>
            {reasonText}: {count}s
        </div>
    );
};

const Game = () => {
    const { roomId } = useParams();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Check if spectating from URL
    const [searchParams] = useState(new URLSearchParams(window.location.search));
    const isSpectatorFromURL = searchParams.get('spectate') === 'true';
    const [isSpectator, setIsSpectator] = useState(isSpectatorFromURL);

    const [game, setGame] = useState(null);
    const [chess] = useState(new Chess());
    const [reviewChess] = useState(new Chess());
    const [fen, setFen] = useState('start');
    const [orientation, setOrientation] = useState('white');
    const [loading, setLoading] = useState(true);
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [turn, setTurn] = useState('white');
    const [gameStatus, setGameStatus] = useState('waiting');
    const [resultMessage, setResultMessage] = useState('');

    const [friends, setFriends] = useState([]);
    const [inviteStatus, setInviteStatus] = useState('');
    const [drawOffered, setDrawOffered] = useState(false);

    // Abandonment State
    const [abandonmentWarning, setAbandonmentWarning] = useState(null); // { player_color: 'white', seconds: 30 }

    const [reviewMode, setReviewMode] = useState(false);
    const [reviewMoveIndex, setReviewMoveIndex] = useState(null);
    const [movesList, setMovesList] = useState([]);
    const [optionSquares, setOptionSquares] = useState({});
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [promotionMove, setPromotionMove] = useState(null);

    // Inactivity State
    const lastInteractionRef = useRef(Date.now());
    const [inactivityWarning, setInactivityWarning] = useState(null); // Local warning for user
    const [inactivityWarningSent, setInactivityWarningSent] = useState(false);


    useEffect(() => {
        const updateInteraction = () => {
            lastInteractionRef.current = Date.now();
            if (inactivityWarning) setInactivityWarning(null); // Clear local warning immediately on interaction
        };

        window.addEventListener('mousemove', updateInteraction);
        window.addEventListener('mousedown', updateInteraction);
        window.addEventListener('keypress', updateInteraction);
        window.addEventListener('touchstart', updateInteraction);
        window.addEventListener('click', updateInteraction);

        return () => {
            window.removeEventListener('mousemove', updateInteraction);
            window.removeEventListener('mousedown', updateInteraction);
            window.removeEventListener('keypress', updateInteraction);
            window.removeEventListener('touchstart', updateInteraction);
            window.removeEventListener('click', updateInteraction);
        };
    }, [inactivityWarning]);

    // Check for inactivity every 1s
    useEffect(() => {
        const checkInactivity = setInterval(() => {
            if (gameStatus !== 'active' || turn !== orientation) {
                // If not my turn or game over, ensure no warnings persist and state is clean
                if (inactivityWarningSent) {
                    setInactivityWarningSent(false);
                    socket.emit('active_inactivity_end', { room_id: roomId });
                }
                setInactivityWarning(null);
                return;
            }

            const now = Date.now();
            const elapsed = now - lastInteractionRef.current;
            const inactivityThreshold = 10000; // 10s
            const abandonmentThreshold = 70000; // 10s + 60s countdown

            if (elapsed > abandonmentThreshold) {
                // Time up, abandon game
                socket.emit('client_game_abandoned', { room_id: roomId });
                console.log('Abandoned due to inactivity');
            } else if (elapsed > inactivityThreshold) {
                // Warning Zone
                const remaining = Math.ceil((abandonmentThreshold - elapsed) / 1000);
                setInactivityWarning(remaining);

                if (!inactivityWarningSent) {
                    setInactivityWarningSent(true);
                    socket.emit('active_inactivity_start', { room_id: roomId });
                }
            } else {
                // Active Zone
                if (inactivityWarningSent) {
                    setInactivityWarningSent(false);
                    socket.emit('active_inactivity_end', { room_id: roomId });
                }
            }
        }, 1000);

        return () => clearInterval(checkInactivity);
    }, [gameStatus, turn, orientation, inactivityWarningSent, roomId, socket]);

    useEffect(() => {
        const initGame = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/game/${roomId}`);
                const g = data.game;

                console.log("Game Data Loaded:", g);

                setGame(g);
                setFen(g.fen);
                setTurn(g.current_turn);
                setWhiteTime(g.white_time);
                setBlackTime(g.black_time);
                setGameStatus(g.status);
                chess.load(g.fen);

                let userSide = 'spectator';
                const userId = user?.id || user?._id;

                if (userId && g.white_player?._id?.toString() === userId.toString()) userSide = 'white';
                else if (userId && g.black_player?._id?.toString() === userId.toString()) userSide = 'black';

                console.log(" User ID:", userId, "UserSide:", userSide); // DEBUG

                if (!isSpectatorFromURL && userSide === 'spectator' && g.status === 'waiting' && (!g.white_player || !g.black_player)) {
                    const joinRes = await axios.post(`${API_URL}/api/game/join`, { room_id: roomId });
                    if (joinRes.data.success) {
                        userSide = joinRes.data.your_color;
                        const updated = await axios.get(`${API_URL}/api/game/${roomId}`);
                        setGame(updated.data.game);
                        setIsSpectator(false);
                    }
                } else if (userSide === 'spectator' || isSpectatorFromURL) {
                    setIsSpectator(true);
                }

                setOrientation(userSide === 'black' ? 'black' : 'white');
                console.log(" Orientation set to:", userSide === 'black' ? 'black' : 'white'); // DEBUG

                setLoading(false);

            } catch (error) {
                console.error("Game Load Error:", error);
                navigate('/');
            }
        };

        if (user) initGame();
        fetchFriends();
        fetchMoves();
    }, [roomId, user, navigate, API_URL]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Emit appropriate event based on spectator status
        if (isSpectator) {
            socket.emit('spectate_game', { room_id: roomId });
        } else {
            socket.emit('join_game', { room_id: roomId });
        }

        const handleMoveMade = (data) => {
            console.log("Move Made:", data);
            let moveAttempt = null;
            try {
                moveAttempt = chess.move(data.move, { sloppy: true });
            } catch (e) {
            }

            chess.load(data.fen);
            setFen(data.fen);
            setTurn(data.current_turn);
            setWhiteTime(data.white_time);
            setBlackTime(data.black_time);

            fetchMoves();

            if (data.new_ratings) {
                setGame(prev => ({
                    ...prev,
                    white_player: { ...prev.white_player, rating: data.new_ratings.white_new_rating },
                    black_player: { ...prev.black_player, rating: data.new_ratings.black_new_rating }
                }));
            }

            if (data.game_over) {
                finishSound.play().catch(() => { });
                setGameStatus('completed');
                handleGameOver(data.result, data.termination_reason);

            } else if (chess.isCheck()) {
                checkSound.play().catch(() => { });

            } else if (moveAttempt && moveAttempt.san.includes('O-O')) {
                castleSound.play().catch(() => { });

            } else if (moveAttempt && moveAttempt.captured) {
                captureSound.play().catch(() => { });

            } else {
                moveSound.play().catch(() => { });
            }
        };

        const handleGameOverEvent = (data) => {
            finishSound.play().catch(() => { });
            setGameStatus('completed');

            if (data.new_ratings) {
                setGame(prev => ({
                    ...prev,
                    white_player: { ...prev.white_player, rating: data.new_ratings.white_new_rating },
                    black_player: { ...prev.black_player, rating: data.new_ratings.black_new_rating }
                }));
            }

            handleGameOver(data.result, data.reason);
        };

        const handlePlayerJoined = (data) => {
            notifySound.play().catch(() => { });
            setGame(prev => ({
                ...prev,
                white_player: data.white_player,
                black_player: data.black_player,
                status: data.game_status
            }));
            if (data.game_status === 'active') setGameStatus('active');
        };

        socket.on('move_made', handleMoveMade);
        socket.on('game_over', handleGameOverEvent);
        socket.on('player_joined', handlePlayerJoined);
        socket.on('game_start', (data) => {
            setGame(prev => ({
                ...prev,
                white_player: data.white_player,
                black_player: data.black_player,
                status: 'active',
                white_time: data.white_time,
                black_time: data.black_time
            }));
            setWhiteTime(data.white_time);
            setBlackTime(data.black_time);
            setGameStatus('active');
            setAbandonmentWarning(null);
        });

        socket.on('abandonment_warning', (data) => {
            console.log('Abandonment warning:', data);
            setAbandonmentWarning({
                player_color: data.player_color,
                seconds: data.seconds_remaining,
                reason: 'disconnect'
            });
        });

        socket.on('abandonment_canceled', () => {
            console.log('Abandonment canceled');
            setAbandonmentWarning(null);
        });

        socket.on('opponent_inactivity_warning', (data) => {
            setAbandonmentWarning({
                player_color: turn,
                seconds: 59,
                reason: 'inactivity'
            });
        });

        socket.on('opponent_inactivity_canceled', () => {
            setAbandonmentWarning(null);
        });

        socket.on('spectator_joined', (data) => {
            console.log('Spectator joined game:', data);
            setGame(prev => ({
                ...prev,
                white_player: data.white_player,
                black_player: data.black_player,
                status: data.game_status
            }));
            setFen(data.fen);
            setWhiteTime(data.white_time);
            setBlackTime(data.black_time);
            setTurn(data.current_turn);
            setGameStatus(data.game_status);
            if (data.result) {
                handleGameOver(data.result, data.termination_reason);
            }
        });

        return () => {
            if (isSpectator) {
                socket.emit('leave_spectate', { room_id: roomId });
            }

            socket.off('move_made', handleMoveMade);
            socket.off('game_over', handleGameOverEvent);
            socket.off('player_joined', handlePlayerJoined);
            socket.off('game_start');
            socket.off('abandonment_warning');
            socket.off('abandonment_canceled');
            socket.off('opponent_inactivity_warning');
            socket.off('opponent_inactivity_canceled');
            socket.off('spectator_joined');
        };
    }, [socket, isConnected, roomId, chess, isSpectator]);

    useEffect(() => {
        if (!socket) return;
        socket.on('draw_offered', (data) => {
            if (data.sender_id && data.sender_id !== user.id) {
                setDrawOffered(true);
            }
        });
        return () => socket.off('draw_offered');
    }, [socket, user]);

    const handleGameOver = (result, reason) => {
        let msg = '';
        if (result === 'draw') msg = `Game Drawn by ${reason}`;
        else if (result === 'white_win') msg = `White Wins by ${reason}`;
        else if (result === 'black_win') msg = `Black Wins by ${reason}`;
        setResultMessage(msg);
        setAbandonmentWarning(null);
    };

    function onMouseOverSquare(square) {
        if (isSpectator || reviewMode || gameStatus !== 'active' || turn !== orientation) return;
        if (selectedSquare) return;

        const moves = chess.moves({
            square: square,
            verbose: true
        });

        if (moves.length === 0) return;

        const newSquares = {};
        moves.map((move) => {
            newSquares[move.to] = {
                background:
                    chess.get(move.to) && chess.get(move.to).color !== chess.get(square).color
                        ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                        : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%'
            };
            return move;
        });
        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)'
        };
        setOptionSquares(newSquares);
    }

    function onMouseOutSquare() {
        if (!selectedSquare) {
            setOptionSquares({});
        }
    }

    function onSquareClick(square) {
        if (isSpectator || reviewMode || gameStatus !== 'active' || turn !== orientation) return;

        const piece = chess.get(square);
        if (!selectedSquare) {
            if (piece && piece.color === (orientation === 'white' ? 'w' : 'b')) {
                setSelectedSquare(square);
                const moves = chess.moves({ square, verbose: true });
                const newSquares = {};
                moves.forEach((move) => {
                    newSquares[move.to] = {
                        background:
                            chess.get(move.to) && chess.get(move.to).color !== piece.color
                                ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                                : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                        borderRadius: '50%'
                    };
                });
                newSquares[square] = {
                    background: 'rgba(255, 255, 0, 0.6)'
                };
                setOptionSquares(newSquares);
            }
        } else {
            if (square === selectedSquare) {
                setSelectedSquare(null);
                setOptionSquares({});
            } else {
                const moveAttempt = onDrop(selectedSquare, square);
                setSelectedSquare(null);
                setOptionSquares({});
            }
        }
    }

    const onDrop = (sourceSquare, targetSquare) => {
        if (isSpectator || reviewMode || gameStatus !== 'active' || turn !== orientation) return false;

        const piece = chess.get(sourceSquare);
        const isPromotion = piece?.type === 'p' &&
            ((piece.color === 'w' && targetSquare[1] === '8') ||
                (piece.color === 'b' && targetSquare[1] === '1'));

        if (isPromotion) {
            setPromotionMove({ from: sourceSquare, to: targetSquare });
            return false;
        }

        return makeMove(sourceSquare, targetSquare, 'q');
    };

    const makeMove = (sourceSquare, targetSquare, promotion = 'q') => {
        try {
            const move = chess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: promotion
            });

            if (!move) return false;
            setFen(chess.fen());
            setTurn(turn === 'white' ? 'black' : 'white');

            socket.emit('make_move', {
                room_id: roomId,
                move: move.from + move.to + (move.promotion || '')
            });
            return true;
        } catch (e) { return false; }
    };

    const handlePromotion = (piece) => {
        if (promotionMove) {
            makeMove(promotionMove.from, promotionMove.to, piece);
            setPromotionMove(null);
        }
    };

    const handleResign = () => {
        if (gameStatus === 'completed') return;
        if (confirm('Are you sure you want to resign?')) {
            socket.emit('resign', { room_id: roomId });
        }
    };
    const handleOfferDraw = () => {
        if (gameStatus === 'completed') return;
        socket.emit('offer_draw', { room_id: roomId });
    };
    const copyPGN = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/game/${game.id}/pgn`);
            await navigator.clipboard.writeText(response.data.pgn);
        } catch (error) {
            console.error('Error copying PGN:', error);
        }
    };

    const fetchFriends = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/friends`);
            setFriends(res.data.friends || []);
        } catch (e) { console.error(e); }
    };

    const fetchMoves = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/game/${roomId}/moves`);
            setMovesList(res.data.moves || []);
        } catch (e) { console.error('Error fetching moves:', e); }
    };

    const handleInvite = async (friendId) => {
        setInviteStatus('Sending...');
        try {
            await axios.post(`${API_URL}/api/game/invite/${friendId}`, { room_id: roomId });
            setInviteStatus('Sent!');
            setTimeout(() => setInviteStatus(''), 2000);
        } catch (e) { setInviteStatus('Failed'); }
    };

    const handleAcceptDraw = () => {
        socket.emit('accept_draw', { room_id: roomId });
        setDrawOffered(false);
    };

    const handleDeclineDraw = () => {
        setDrawOffered(false);
    };

    const handleMoveClick = (index) => {
        if (index < 0 || index >= movesList.length) return;

        const move = movesList[index];
        setReviewMode(true);
        setReviewMoveIndex(index);
        setFen(move.fen);
    };

    const handleBackToLive = () => {
        setReviewMode(false);
        setReviewMoveIndex(null);
        setFen(chess.fen());
    };

    if (loading) return <div className="loading-spinner">Loading Board...</div>;

    return (
        <div className="container game-container">
            {promotionMove && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Choose Promotion Piece</h3>
                        <div className="promotion-options">
                            <button onClick={() => handlePromotion('q')} className="btn-promotion"><i className="fa-solid fa-chess-queen"></i></button>
                            <button onClick={() => handlePromotion('r')} className="btn-promotion"><i className="fa-solid fa-chess-rook"></i></button>
                            <button onClick={() => handlePromotion('b')} className="btn-promotion"><i className="fa-solid fa-chess-bishop"></i></button>
                            <button onClick={() => handlePromotion('n')} className="btn-promotion"><i className="fa-solid fa-chess-knight"></i></button>
                        </div>
                    </div>
                </div>
            )}

            {inactivityWarning && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
                    <div className="modal-content" style={{ border: '2px solid red' }}>
                        <h3 style={{ color: 'red', fontSize: '1.5rem' }}><i className="fa-solid fa-triangle-exclamation"></i> INACTIVITY WARNING <i className="fa-solid fa-triangle-exclamation"></i></h3>
                        <p>You have been inactive for too long.</p>
                        <p style={{ fontSize: '1.2rem' }}>Auto-Forfeit in: <strong>{inactivityWarning}s</strong></p>
                        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Move your cursor or tap to continue playing.</p>
                    </div>
                </div>
            )}


            {drawOffered && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Opponent offers a draw</h3>
                        <div className="modal-actions">
                            <button onClick={handleAcceptDraw} className="btn-primary">Accept</button>
                            <button onClick={handleDeclineDraw} className="btn-secondary">Decline</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="game-grid">
                <div className="board-wrapper">
                    <div className="player-info top">
                        <div className="avatar-row">
                            <img
                                src={game?.black_player?.avatar || getAvatar(game?.black_player?.username || 'Opponent')}
                                alt="black" className="avatar-sm"
                            />
                            <span>
                                {game?.black_player?.username || 'Waiting for opponent...'}
                                {game?.black_player?.rating ? ` (${game.black_player.rating})` : ''}
                            </span>
                            {abandonmentWarning && abandonmentWarning.player_color === 'black' && (
                                <AbandonmentTimer seconds={abandonmentWarning.seconds} reason={abandonmentWarning.reason} />
                            )}
                        </div>
                        <ChessTimer time={blackTime} isTurn={gameStatus === 'active' && turn === 'black'} />
                    </div>

                    <Chessboard
                        position={fen}
                        onPieceDrop={onDrop}
                        onSquareClick={onSquareClick}
                        onMouseOverSquare={onMouseOverSquare}
                        onMouseOutSquare={onMouseOutSquare}
                        customSquareStyles={optionSquares}
                        boardOrientation={orientation}
                        animationDuration={200}
                    />

                    <div className="player-info bottom">
                        <div className="avatar-row">
                            <img
                                src={game?.white_player?.avatar || getAvatar(game?.white_player?.username || 'You')}
                                alt="white" className="avatar-sm"
                            />
                            <span>
                                {game?.white_player?.username || 'You'}
                                {game?.white_player?.rating ? ` (${game.white_player.rating})` : ''}
                            </span>
                            {abandonmentWarning && abandonmentWarning.player_color === 'white' && (
                                <AbandonmentTimer seconds={abandonmentWarning.seconds} reason={abandonmentWarning.reason} />
                            )}
                        </div>
                        <ChessTimer time={whiteTime} isTurn={gameStatus === 'active' && turn === 'white'} />
                    </div>
                </div>

                <div className="sidebar">
                    <div className="game-status-card">
                        <h2>{gameStatus === 'active' ? `${turn.toUpperCase()} to move` : gameStatus.toUpperCase()}</h2>
                        {isSpectator && (
                            <div style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid #3b82f6',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#3b82f6'
                            }}>
                                <i className="fa-solid fa-eye"></i>
                                <span>Spectator Mode</span>
                            </div>
                        )}
                        {resultMessage && <div className="result-alert">{resultMessage}</div>}
                    </div>

                    <div className="controls">
                        {!isSpectator && gameStatus === 'active' && (
                            <>
                                <button onClick={handleResign} className="btn btn-danger"> Resign</button>
                                <button onClick={handleOfferDraw} className="btn btn-secondary">Offer Draw</button>
                            </>
                        )}
                        {gameStatus === 'completed' && (
                            <button onClick={copyPGN} className="btn btn-primary"> Copy PGN</button>
                        )}
                    </div>

                    {movesList.length > 0 && (
                        <div className="moves-section">
                            <div className="moves-header">
                                <h3>Moves</h3>
                                {reviewMode && (
                                    <button onClick={handleBackToLive} className="btn-back-live">
                                        <i className="fa-solid fa-rotate-left" style={{ marginRight: '5px' }}></i> Back to Live
                                    </button>
                                )}
                            </div>
                            <div className="moves-grid">
                                {movesList.map((move, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleMoveClick(index)}
                                        className={`move-btn ${reviewMoveIndex === index ? 'active' : ''}`}
                                    >
                                        {move.move_number}. {move.san}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {gameStatus === 'waiting' && (
                        <div className="invite-section">
                            <h3>Invite Friends</h3>
                            {inviteStatus && <p>{inviteStatus}</p>}
                            <div className="friends-list">
                                {friends
                                    // .filter(f => f.status === 'online')
                                    .map(f => (
                                        <div key={f.id} className="friend-item">
                                            <span>{f.username}</span>
                                            <button onClick={() => handleInvite(f.id)}>+</button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Game;
