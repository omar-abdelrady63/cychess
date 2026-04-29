import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';
import { analyzeGame, getAnalysisSummary } from '../services/analysis-engine';
import MysticTimeline from '../components/MysticTimeline';
import AnimationOverlay from '../components/AnimationOverlay';
import '../styles/mystic-animations.css';
import '../styles/Game.css';

const GameAnalysis = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [game, setGame] = useState(null);
    const [pgn, setPgn] = useState('');
    const [analyzedMoves, setAnalyzedMoves] = useState([]);
    const [summary, setSummary] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [chess] = useState(new Chess());
    const [fen, setFen] = useState('start');
    const [orientation, setOrientation] = useState('white');
    const [currentAnimation, setCurrentAnimation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGame = async () => {

            if (!gameId && location.state) {
                const { pgn: customPgn, fen: customFen, white_player, black_player } = location.state;

                if (customPgn) {
                    setPgn(customPgn);

                    setGame({
                        white_player: white_player || { username: 'White' },
                        black_player: black_player || { username: 'Black' }
                    });
                } else if (customFen) {
                    setFen(customFen);

                    setGame({
                        white_player: white_player || { username: 'White' },
                        black_player: black_player || { username: 'Black' }
                    });

                }
                setLoading(false);
                return;
            }

            if (!gameId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/api/game/id/${gameId}`);
                setGame(data.game);

                const pgnResponse = await axios.get(`${API_URL}/api/game/${gameId}/pgn`);
                setPgn(pgnResponse.data.pgn);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching game:', err);
                setError('Failed to load game data');
                setLoading(false);
            }
        };

        fetchGame();
    }, [gameId, API_URL, location.state]);

    const [paused, setPaused] = useState(false);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            import('../services/stockfish-service').then((module) => {
                const stockfishService = module.default;
                stockfishService.quit();
                console.log('🧹 Stockfish worker cleaned up on unmount');
            }).catch((err) => {
                console.warn('Error cleaning up Stockfish:', err);
            });
        };
    }, []);

    const startAnalysis = async (startIndex = 0) => {
        if (!pgn) return;

        try {
            setAnalyzing(true);
            setPaused(false);
            setError(null);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const tempChess = new Chess();
            tempChess.loadPgn(pgn);
            const totalMoves = tempChess.history().length;
            setProgress({ current: startIndex, total: totalMoves });

            await analyzeGame(
                pgn,
                (moveData, index) => {

                    setAnalyzedMoves(prev => {
                        const newMoves = [...prev];
                        if (index >= newMoves.length) {
                            newMoves.push(moveData);
                        } else {
                            newMoves[index] = moveData;
                        }
                        return newMoves;
                    });

                    setProgress(prev => ({ ...prev, current: index + 1 }));
                },
                abortControllerRef.current.signal,
                startIndex
            );

            if (abortControllerRef.current.signal.aborted) {
                console.log('Analysis manually stopped/paused');
                setPaused(true);
            } else {
                console.log('Analysis completed successfully');
                setPaused(false);

                setAnalyzedMoves(moves => {

                    if (startIndex === 0 && moves.length > 0) {
                        chess.reset();
                        setFen(chess.fen());
                    }
                    return moves;
                });
            }

            setAnalyzing(false);

        } catch (err) {
            if (err.name === 'AbortError' || err.message.includes('aborted')) {
                console.log('Analysis paused/stopped');
                setPaused(true);
            } else {
                console.error('Analysis error:', err);
                setError('Failed to analyze game: ' + err.message);
            }
            setAnalyzing(false);
        }
    };

    const stopAnalysis = () => {
        console.log('Stopping analysis manually...');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setPaused(true);
        setAnalyzing(false);
    };

    const resumeAnalysis = () => {
        startAnalysis(analyzedMoves.length);
    };

    useEffect(() => {
        if (analyzedMoves.length > 0) {
            setSummary(getAnalysisSummary(analyzedMoves));
        }
    }, [analyzedMoves]);

    useEffect(() => {
        if (pgn && analyzedMoves.length === 0 && !analyzing && !paused && !error) {
            startAnalysis(0);
        } else if (fen && !pgn && analyzedMoves.length === 0 && !analyzing) {

        }
    }, [pgn, fen]);

    const handleMoveClick = (index) => {
        if (index < 0 || index >= analyzedMoves.length) return;

        setCurrentMoveIndex(index);

        chess.reset();
        for (let i = 0; i <= index; i++) {
            const move = analyzedMoves[i];

            chess.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion || 'q' 
            });
        }
        setFen(chess.fen());

        const move = analyzedMoves[index];
        triggerAnimation(move.classificationType, move.sound);
    };

    const handleMoveHover = (index, move) => {
        if (index === null || !move) return;

    };

    const triggerAnimation = (type, sound) => {
        setCurrentAnimation({ type, sound });
    };

    const handleAnimationEnd = () => {
        setCurrentAnimation(null);
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft' && currentMoveIndex > 0) {
                handleMoveClick(currentMoveIndex - 1);
            } else if (e.key === 'ArrowRight' && currentMoveIndex < analyzedMoves.length - 1) {
                handleMoveClick(currentMoveIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentMoveIndex, analyzedMoves.length]);

    if (loading) {
        return (
            <div className="container game-container">
                <div className="loading-spinner">Loading game data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container game-container">
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2 style={{ color: '#dc2626' }}>Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate('/game-history')}
                        className="btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        Back to Game History
                    </button>
                </div>
            </div>
        );
    }

    if (analyzing) {
        return (
            <div className="container game-container">
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2 style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        Analyzing Game with Stockfish...
                    </h2>
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                            Analyzing move {progress.current} of {progress.total}
                        </p>

                        <button
                            className="btn-secondary"
                            style={{ marginTop: '1rem' }}
                            onClick={stopAnalysis}
                        >
                            <i className="fa-solid fa-pause"></i> Pause Analysis
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentMove = analyzedMoves[currentMoveIndex];

    return (
        <div className="container game-container">
            <div className="game-grid">
                <div className="board-wrapper">
                    {}
                    <div className="player-info top">
                        <div className="avatar-row">
                            <img
                                src={game?.black_player?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${game?.black_player?.username}`}
                                alt="black"
                                className="avatar-sm"
                                crossOrigin="anonymous"
                            />
                            <span>
                                {game?.black_player?.username || 'Black'}
                                {game?.black_player?.rating ? ` (${game.black_player.rating})` : ''}
                            </span>
                        </div>
                    </div>

                    {}
                    <div style={{ position: 'relative' }}>
                        <Chessboard
                            position={fen}
                            boardOrientation={orientation}
                            animationDuration={200}
                            arePiecesDraggable={false}
                        />
                        {currentAnimation && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 10
                            }}>
                                <AnimationOverlay
                                    animation={currentAnimation}
                                    onAnimationEnd={handleAnimationEnd}
                                />
                            </div>
                        )}
                    </div>

                    {}
                    <div className="player-info bottom">
                        <div className="avatar-row">
                            <img
                                src={game?.white_player?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${game?.white_player?.username}`}
                                alt="white"
                                className="avatar-sm"
                                crossOrigin="anonymous"
                            />
                            <span>
                                {game?.white_player?.username || 'White'}
                                {game?.white_player?.rating ? ` (${game.white_player.rating})` : ''}
                            </span>
                        </div>
                    </div>

                    {}
                    <MysticTimeline
                        moves={analyzedMoves}
                        currentMoveIndex={currentMoveIndex}
                        onMoveClick={handleMoveClick}
                        onMoveHover={handleMoveHover}
                    />
                </div>

                {}
                <div className="sidebar">
                    <div className="game-status-card">
                        <h2 style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Mystic Analysis
                        </h2>
                        {currentMove && (
                            <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '8px',
                                    border: `2px solid var(--color-${currentMove.classificationColor})`
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {currentMove.classification}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Move: {currentMove.moveNumber}{currentMove.color === 'w' ? '.' : '...'} {currentMove.san}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>
                                        CP Loss: {currentMove.cpLoss > 0 ? '+' : ''}{currentMove.cpLoss}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Eval: {currentMove.evalAfter > 0 ? '+' : ''}{(currentMove.evalAfter / 100).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {}
                    {paused && analyzedMoves.length < progress.total && (
                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                onClick={resumeAnalysis}
                                className="btn-primary"
                                style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)', border: 'none' }}
                            >
                                <i className="fa-solid fa-play"></i> Continue Analysis ({analyzedMoves.length}/{progress.total})
                            </button>
                        </div>
                    )}

                    {}
                    <div className="controls">
                        <button
                            onClick={() => handleMoveClick(0)}
                            className="btn-secondary"
                            disabled={currentMoveIndex === 0}
                        >
                            <i className="fa-solid fa-backward-fast"></i> Start
                        </button>
                        <button
                            onClick={() => handleMoveClick(currentMoveIndex - 1)}
                            className="btn-secondary"
                            disabled={currentMoveIndex === 0}
                        >
                            <i className="fa-solid fa-backward"></i> Previous
                        </button>
                        <button
                            onClick={() => handleMoveClick(currentMoveIndex + 1)}
                            className="btn-secondary"
                            disabled={currentMoveIndex >= analyzedMoves.length - 1}
                        >
                            Next <i className="fa-solid fa-forward"></i>
                        </button>
                        <button
                            onClick={() => handleMoveClick(analyzedMoves.length - 1)}
                            className="btn-secondary"
                            disabled={currentMoveIndex >= analyzedMoves.length - 1}
                        >
                            End <i className="fa-solid fa-forward-fast"></i>
                        </button>
                    </div>

                    {}
                    {summary && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Game Summary</h3>
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '8px',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong>White:</strong>
                                    <div style={{ marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Avg CP Loss: {summary.white.avgCpLoss}
                                    </div>
                                    <div style={{ marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Blunders: {summary.white.finishHim + summary.white.fatality}
                                    </div>
                                </div>
                                <div>
                                    <strong>Black:</strong>
                                    <div style={{ marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Avg CP Loss: {summary.black.avgCpLoss}
                                    </div>
                                    <div style={{ marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Blunders: {summary.black.finishHim + summary.black.fatality}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    <button
                        onClick={() => navigate('/game-history')}
                        className="btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to History
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameAnalysis;
