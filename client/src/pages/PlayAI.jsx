import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import stockfishService from '../services/stockfish-service';
import '../styles/PlayAI.css';

// ─── Sounds ───────────────────────────────────────────────────────────────────
const moveSound = new Audio('/assets/sounds/move.mp3');
const captureSound = new Audio('/assets/sounds/capture.mp3');
const castleSound = new Audio('/assets/sounds/castle.mp3');
const checkSound = new Audio('/assets/sounds/check.mp3');
const finishSound = new Audio('/assets/sounds/finish.mp3');

// ─── Avatar SVGs ───────────────────────────────────────────────────────────────
const AVATAR_SVGS = {
    sehs: `<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="52" width="20" height="18" rx="3" fill="#f5e6d8"/>
        <rect x="4" y="66" width="72" height="40" rx="8" fill="#2d3a4a"/>
        <ellipse cx="40" cy="32" rx="32" ry="34" fill="#f5e6d8"/>
        <ellipse cx="9" cy="34" rx="7" ry="9" fill="#f5e6d8"/>
        <ellipse cx="71" cy="34" rx="7" ry="9" fill="#f5e6d8"/>
        <ellipse cx="40" cy="14" rx="32" ry="20" fill="#8B6347"/>
        <rect x="8" y="12" width="64" height="18" fill="#8B6347"/>
        <ellipse cx="40" cy="28" rx="30" ry="8" fill="#8B6347"/>
        <rect x="14" y="27" width="20" height="13" rx="3" fill="none" stroke="#444" stroke-width="2"/>
        <rect x="46" y="27" width="20" height="13" rx="3" fill="none" stroke="#444" stroke-width="2"/>
        <line x1="34" y1="33" x2="46" y2="33" stroke="#444" stroke-width="2"/>
        <ellipse cx="24" cy="33" rx="5" ry="5" fill="#4a3728"/>
        <ellipse cx="56" cy="33" rx="5" ry="5" fill="#4a3728"/>
        <line x1="32" y1="52" x2="48" y2="52" stroke="#c8a090" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="40" cy="44" rx="4" ry="3" fill="#e8c8b8"/>
    </svg>`,

    khaled: `<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="52" width="20" height="18" rx="3" fill="#e8d0b8"/>
        <rect x="4" y="66" width="72" height="40" rx="8" fill="#1a2a3a"/>
        <ellipse cx="40" cy="32" rx="32" ry="34" fill="#e8d0b8"/>
        <ellipse cx="9" cy="34" rx="7" ry="9" fill="#e8d0b8"/>
        <ellipse cx="71" cy="34" rx="7" ry="9" fill="#e8d0b8"/>
        <ellipse cx="40" cy="14" rx="32" ry="22" fill="#1a1a1a"/>
        <rect x="8" y="12" width="64" height="16" fill="#1a1a1a"/>
        <ellipse cx="26" cy="33" rx="6" ry="6" fill="#1a1a1a"/>
        <ellipse cx="54" cy="33" rx="6" ry="6" fill="#1a1a1a"/>
        <path d="M30 50 Q40 57 50 50" fill="none" stroke="#c8a090" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="40" cy="44" rx="4" ry="3" fill="#d8b8a0"/>
    </svg>`,

    yahia: `<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="52" width="20" height="18" rx="3" fill="#f0dcc8"/>
        <rect x="2" y="66" width="76" height="40" rx="8" fill="#2a3550"/>
        <ellipse cx="40" cy="32" rx="32" ry="34" fill="#f0dcc8"/>
        <ellipse cx="9" cy="34" rx="7" ry="9" fill="#f0dcc8"/>
        <ellipse cx="71" cy="34" rx="7" ry="9" fill="#f0dcc8"/>
        <ellipse cx="40" cy="14" rx="34" ry="24" fill="#8B6347"/>
        <rect x="6" y="12" width="68" height="20" fill="#8B6347"/>
        <ellipse cx="7" cy="38" rx="10" ry="26" fill="#8B6347"/>
        <ellipse cx="73" cy="38" rx="10" ry="26" fill="#8B6347"/>
        <path d="M8 22 Q0 30 8 38 Q16 44 8 50" fill="none" stroke="#6B4327" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M72 22 Q80 30 72 38 Q64 44 72 50" fill="none" stroke="#6B4327" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M24 16 Q18 22 24 26" fill="none" stroke="#6B4327" stroke-width="2" stroke-linecap="round"/>
        <path d="M50 15 Q56 22 50 26" fill="none" stroke="#6B4327" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="27" cy="33" rx="6" ry="6" fill="#3a2a1a"/>
        <ellipse cx="53" cy="33" rx="6" ry="6" fill="#3a2a1a"/>
        <path d="M28 50 Q40 60 52 50" fill="none" stroke="#c8a090" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="40" cy="44" rx="4" ry="3" fill="#e0c0a8"/>
    </svg>`,
};

// ─── Difficulty Config ────────────────────────────────────────────────────────
const LEVELS = [
    {
        id: 'sehs',
        label: 'Sehs',
        subtitle: 'Beginner',
        rating: 450,
        avatarSvg: AVATAR_SVGS.sehs,
        depth: 2,
        skillLevel: 1,
        moveTime: 500,
        errorRate: 0.45,
        speechChance: 0.35,
        color: '#4ade80',
        icon: 'fa-seedling',
        gradient: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        border: '#4ade80',
        description: 'Perpetually unbothered. Will blunder his queen and shrug.',
        thinkingLines: [
            '...',
            'sure i guess',
            'hold on',
            'idk',
        ],
        moveLines: [
            'k',
            'whatever',
            'sure',
            'fine',
            'ok',
            'moving on',
        ],
        winLines: ['oh. won. ok.', 'huh.'],
        lossLines: ['k', 'sure', 'whatever'],
    },
    {
        id: 'khaled',
        label: 'Khaled',
        subtitle: 'Intermediate',
        rating: 1050,
        avatarSvg: AVATAR_SVGS.khaled,
        depth: 8,
        skillLevel: 10,
        moveTime: 1000,
        errorRate: 0.15,
        speechChance: 0.4,
        color: '#f59e0b',
        icon: 'fa-fire',
        gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
        border: '#f59e0b',
        description: 'Ruthlessly competitive. Will make it personal.',
        thinkingLines: [
            'I see it.',
            'obvious.',
            'found it.',
            "you're already losing.",
        ],
        moveLines: [
            'come on.',
            'is that it?',
            'really?',
            'pathetic.',
            'next.',
            "that's your move?",
        ],
        winLines: ["called it.", "easy."],
        lossLines: ["rematch.", "luck.", "I wasn't focused."],
    },
    {
        id: 'yahia',
        label: 'Yahia',
        subtitle: 'Expert',
        rating: 1600,
        avatarSvg: AVATAR_SVGS.yahia,
        depth: 18,
        skillLevel: 20,
        moveTime: 1500,
        errorRate: 0,
        speechChance: 0.45,
        color: '#f43f5e',
        icon: 'fa-skull',
        gradient: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
        border: '#f43f5e',
        description: 'strong. Also somehow hilarious. Will give you unsolicited advice.',
        thinkingLines: [
            'wait...',
            'hold on let me cook',
            'ok so...',
            'I see like 5 ways to end you right now',
        ],
        moveLines: [
            "there you go",
            "that's gonna hurt",
            "don't panic but...",
            "chess is easy when you're good",
            "ok next problem",
        ],
        adviceLines: [
            'your rook would be better on an open file',
            'castle soon bro',
            "that knight is hanging by the way",
            'bishops like open diagonals. just saying.',
            "might want to think about your king safety",
        ],
        winLines: ["gg", "knew it"],
        lossLines: ["ok fine", "that's actually impressive", "alright you earned that"],
    },
];

// ─── Timer Component ──────────────────────────────────────────────────────────
const ChessTimer = ({ time, isTurn }) => {
    const [displayTime, setDisplayTime] = useState(time);

    useEffect(() => setDisplayTime(time), [time]);
    useEffect(() => {
        if (!isTurn || displayTime <= 0) return;
        const id = setInterval(() => setDisplayTime(p => Math.max(0, p - 1)), 1000);
        return () => clearInterval(id);
    }, [isTurn, displayTime]);

    const mins = Math.floor(displayTime / 60);
    const secs = displayTime % 60;
    const isLow = displayTime < 30;
    return (
        <div className={`ai-timer ${isTurn ? 'active' : ''} ${isLow && isTurn ? 'low' : ''}`}>
            {mins}:{secs < 10 ? '0' : ''}{secs}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PlayAI = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Screen state: 'select' | 'playing' | 'result'
    const [screen, setScreen] = useState('select');
    const [selectedLevel, setSelectedLevel] = useState(null);
    const selectedLevelRef = useRef(null);   // always current, safe inside useCallback
    const [playerColor, setPlayerColor] = useState('white');

    // Game state
    const chessRef = useRef(new Chess());
    const [fen, setFen] = useState('start');
    const [turn, setTurn] = useState('white');
    const [gameStatus, setGameStatus] = useState('playing');
    const [resultMessage, setResultMessage] = useState('');
    const [movesList, setMovesList] = useState([]);
    const [optionSquares, setOptionSquares] = useState({});
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [promotionMove, setPromotionMove] = useState(null);
    const [isThinking, setIsThinking] = useState(false);
    const [engineReady, setEngineReady] = useState(false);
    const [engineError, setEngineError] = useState(null);
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [orientation, setOrientation] = useState('white');
    const [aiSpeech, setAiSpeech] = useState('');
    const [gameSaved, setGameSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const speechTimerRef = useRef(null);

    // Pick a random line
    const pickLine = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const showSpeech = useCallback((line, duration = 3500) => {
        setAiSpeech(line);
        clearTimeout(speechTimerRef.current);
        speechTimerRef.current = setTimeout(() => setAiSpeech(''), duration);
    }, []);

    useEffect(() => () => clearTimeout(speechTimerRef.current), []);

    const isAiTurnRef = useRef(false);

    // ── Init Stockfish once ──────────────────────────────────────────────────
    useEffect(() => {
        stockfishService.init()
            .then(() => setEngineReady(true))
            .catch(err => setEngineError(err.message));
    }, []);

    // ── Start Game ───────────────────────────────────────────────────────────
    const startGame = () => {
        if (!selectedLevel) return;
        selectedLevelRef.current = selectedLevel;   // sync ref before game starts
        const color = playerColor === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : playerColor;

        chessRef.current = new Chess();
        setFen('start');
        setTurn('white');
        setMovesList([]);
        setGameStatus('playing');
        setResultMessage('');
        setWhiteTime(600);
        setBlackTime(600);
        setOrientation(color);
        setScreen('playing');
        isAiTurnRef.current = false;
        setGameSaved(false);

        // If player is black, AI moves first
        if (color === 'black') {
            setTimeout(() => triggerAIMove(selectedLevel), 500);
        }
    };

    // ── AI Move Logic ────────────────────────────────────────────────────────
    const triggerAIMove = useCallback(async (level) => {
        if (isAiTurnRef.current) return;
        isAiTurnRef.current = true;
        setIsThinking(true);

        try {
            const chess = chessRef.current;
            const currentFen = chess.fen();
            let bestMove = null;

            // Show thinking speech (only sometimes)
            if (level.thinkingLines && Math.random() < (level.speechChance ?? 0.4)) {
                showSpeech(pickLine(level.thinkingLines), level.moveTime + 800);
            }

            // Randomly play a bad move at lower difficulties
            const legalMoves = chess.moves({ verbose: true });
            if (legalMoves.length === 0) {
                setIsThinking(false);
                isAiTurnRef.current = false;
                return;
            }

            if (Math.random() < level.errorRate) {
                // Pick a random legal move (simulates mistakes)
                const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                bestMove = randomMove.from + randomMove.to + (randomMove.promotion || '');
            } else {
                const result = await stockfishService.analyzePosition(currentFen, level.depth, 10000);
                bestMove = result.bestMove;
            }

            // Simulate thinking delay
            await new Promise(r => setTimeout(r, level.moveTime));

            if (!bestMove || bestMove === '(none)') {
                setIsThinking(false);
                isAiTurnRef.current = false;
                return;
            }

            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            const promotion = bestMove.length > 4 ? bestMove[4] : 'q';

            const moveResult = chess.move({ from, to, promotion });
            if (!moveResult) {
                setIsThinking(false);
                isAiTurnRef.current = false;
                return;
            }

            // Play sound
            if (chess.isCheckmate() || chess.isStalemate() || chess.isDraw()) {
                finishSound.play().catch(() => { });
            } else if (chess.isCheck()) {
                checkSound.play().catch(() => { });
            } else if (moveResult.san.includes('O-O')) {
                castleSound.play().catch(() => { });
            } else if (moveResult.captured) {
                captureSound.play().catch(() => { });
            } else {
                moveSound.play().catch(() => { });
            }

            setFen(chess.fen());
            const newTurn = chess.turn() === 'w' ? 'white' : 'black';
            setTurn(newTurn);

            setMovesList(prev => [...prev, {
                san: moveResult.san,
                fen: chess.fen(),
                move_number: Math.ceil((prev.length + 1) / 2),
            }]);

            // Show post-move speech randomly
            if (Math.random() < (level.speechChance ?? 0.4)) {
                const pool = level.adviceLines && Math.random() < 0.35
                    ? level.adviceLines
                    : level.moveLines;
                if (pool) setTimeout(() => showSpeech(pickLine(pool)), 200);
            }

            checkGameOver(chess);
        } catch (err) {
            console.error('AI move error:', err);
            setResultMessage('AI Error: ' + err.message);
            setGameStatus('completed');
        } finally {
            setIsThinking(false);
            isAiTurnRef.current = false;
        }
    }, [showSpeech, pickLine]);

    // ── Check game over ──────────────────────────────────────────────────────
    const checkGameOver = (chess) => {
        if (chess.isCheckmate()) {
            finishSound.play().catch(() => { });
            const winner = chess.turn() === 'w' ? 'Black' : 'White';
            setResultMessage(`${winner} wins by Checkmate!`);
            setGameStatus('completed');
        } else if (chess.isStalemate()) {
            finishSound.play().catch(() => { });
            setResultMessage('Draw by Stalemate');
            setGameStatus('completed');
        } else if (chess.isDraw()) {
            finishSound.play().catch(() => { });
            setResultMessage('Draw');
            setGameStatus('completed');
        }
    };

    // ── Player Move ──────────────────────────────────────────────────────────
    const makePlayerMove = useCallback((from, to, promotion = 'q') => {
        const chess = chessRef.current;
        const playerSide = orientation === 'white' ? 'w' : 'b';
        if (chess.turn() !== playerSide || gameStatus !== 'playing') return false;

        try {
            const move = chess.move({ from, to, promotion });
            if (!move) return false;

            // Play sound
            if (chess.isCheck()) {
                checkSound.play().catch(() => { });
            } else if (move.san.includes('O-O')) {
                castleSound.play().catch(() => { });
            } else if (move.captured) {
                captureSound.play().catch(() => { });
            } else {
                moveSound.play().catch(() => { });
            }

            setFen(chess.fen());
            setTurn(chess.turn() === 'w' ? 'white' : 'black');
            setMovesList(prev => [...prev, {
                san: move.san,
                fen: chess.fen(),
                move_number: Math.ceil((prev.length + 1) / 2),
            }]);
            setOptionSquares({});
            setSelectedSquare(null);

            if (checkGameOver(chess)) return true;

            // Trigger AI using the ref so we always get the live level
            setTimeout(() => triggerAIMove(selectedLevelRef.current), 100);
            return true;
        } catch {
            return false;
        }
    }, [orientation, gameStatus, selectedLevel, triggerAIMove]);

    const onDrop = (sourceSquare, targetSquare) => {
        const chess = chessRef.current;
        const piece = chess.get(sourceSquare);
        const isPromotion = piece?.type === 'p' &&
            ((piece.color === 'w' && targetSquare[1] === '8') ||
                (piece.color === 'b' && targetSquare[1] === '1'));

        if (isPromotion) {
            setPromotionMove({ from: sourceSquare, to: targetSquare });
            return false;
        }
        return makePlayerMove(sourceSquare, targetSquare);
    };

    const onSquareClick = (square) => {
        const chess = chessRef.current;
        const playerSide = orientation === 'white' ? 'w' : 'b';
        if (chess.turn() !== playerSide || gameStatus !== 'playing') return;

        const piece = chess.get(square);
        if (!selectedSquare) {
            if (piece && piece.color === playerSide) {
                setSelectedSquare(square);
                const moves = chess.moves({ square, verbose: true });
                const sq = {};
                moves.forEach(m => {
                    sq[m.to] = {
                        background: chess.get(m.to) && chess.get(m.to).color !== piece.color
                            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                        borderRadius: '50%',
                    };
                });
                sq[square] = { background: 'rgba(255, 255, 0, 0.6)' };
                setOptionSquares(sq);
            }
        } else {
            if (square === selectedSquare) {
                setSelectedSquare(null);
                setOptionSquares({});
            } else {
                makePlayerMove(selectedSquare, square);
            }
        }
    };

    const onMouseOverSquare = (square) => {
        const chess = chessRef.current;
        const playerSide = orientation === 'white' ? 'w' : 'b';
        if (chess.turn() !== playerSide || gameStatus !== 'playing' || selectedSquare) return;
        const moves = chess.moves({ square, verbose: true });
        if (!moves.length) return;
        const sq = {};
        moves.forEach(m => {
            sq[m.to] = {
                background: chess.get(m.to) && chess.get(m.to).color !== chess.get(square)?.color
                    ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%',
            };
        });
        sq[square] = { background: 'rgba(255, 255, 0, 0.4)' };
        setOptionSquares(sq);
    };

    const onMouseOutSquare = () => {
        if (!selectedSquare) setOptionSquares({});
    };

    const handlePromotion = (piece) => {
        if (promotionMove) {
            makePlayerMove(promotionMove.from, promotionMove.to, piece);
            setPromotionMove(null);
        }
    };

    const handleResign = () => {
        if (gameStatus !== 'playing') return;
        if (!confirm('Resign this game?')) return;
        finishSound.play().catch(() => { });
        setResultMessage(`${orientation === 'white' ? 'Black' : 'White'} wins by Resignation`);
        setGameStatus('completed');
    };

    const handleNewGame = () => {
        setScreen('select');
        setSelectedLevel(null);
    };

    // ── Build PGN from the played game ───────────────────────────────────────
    const buildPgn = () => {
        // chess.js tracks the full history — just export it with player headers
        const chess = chessRef.current;
        const playerName = user?.username || 'You';
        const aiName = selectedLevel?.label || 'AI';
        const whitePlayer = orientation === 'white' ? playerName : aiName;
        const blackPlayer = orientation === 'black' ? playerName : aiName;
        // Inject PGN headers then get the full PGN string
        const tempChess = new Chess();
        const moves = chess.history();
        moves.forEach(m => tempChess.move(m));
        const raw = tempChess.pgn();
        return `[White "${whitePlayer}"]
[Black "${blackPlayer}"]
[Event "vs AI (${selectedLevel?.subtitle})"]

${raw}`;
    };

    const handleAnalyze = () => {
        const pgn = buildPgn();
        const playerName = user?.username || 'You';
        const aiName = selectedLevel?.label || 'AI';
        navigate('/analysis', {
            state: {
                pgn,
                white_player: orientation === 'white' ? { username: playerName } : { username: aiName },
                black_player: orientation === 'black' ? { username: playerName } : { username: aiName },
            }
        });
    };

    // ── Save AI game to server history ──────────────────────────────────────
    const handleSaveGame = async () => {
        if (gameSaved || isSaving || !user || user.isGuest) return;
        setIsSaving(true);
        try {
            const pgn = buildPgn();
            // Derive result code from resultMessage
            let result = '1/2-1/2';
            if (resultMessage.includes('White wins')) result = '1-0';
            else if (resultMessage.includes('Black wins')) result = '0-1';

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/game/save-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    pgn,
                    result,
                    termination_reason: resultMessage.includes('Resign') ? 'resignation' : 'normal',
                    opponent_name: selectedLevel?.label,
                    player_color: orientation,
                }),
            });
            setGameSaved(true);
        } catch (e) {
            console.error('Save failed', e);
        } finally {
            setIsSaving(false);
        }
    };

    const level = selectedLevel;

    // ─── SELECT SCREEN ───────────────────────────────────────────────────────
    if (screen === 'select') {
        return (
            <div className="playai-select-screen">
                <div className="playai-header">
                    <button className="playai-back-btn" onClick={() => navigate('/dashboard')}>
                        <i className="fa-solid fa-arrow-left" /> Dashboard
                    </button>
                    <h1 className="playai-title">
                        <i className="fa-solid fa-robot" /> Play vs AI
                    </h1>
                    <p className="playai-subtitle">Choose your opponent and color, then face off.</p>
                </div>

                {engineError && (
                    <div className="playai-engine-error">
                        <i className="fa-solid fa-triangle-exclamation" /> Engine failed to load: {engineError}
                    </div>
                )}

                {!engineReady && !engineError && (
                    <div className="playai-engine-loading">
                        <i className="fa-solid fa-circle-notch fa-spin" /> Loading Stockfish engine...
                    </div>
                )}

                <div className="playai-levels-grid">
                    {LEVELS.map(lv => (
                        <button
                            key={lv.id}
                            className={`playai-level-card ${selectedLevel?.id === lv.id ? 'selected' : ''}`}
                            style={{ '--lv-color': lv.color, '--lv-border': lv.border, '--lv-gradient': lv.gradient }}
                            onClick={() => setSelectedLevel(lv)}
                        >
                            <div className="playai-level-glow" />

                            {/* Character avatar */}
                            <div className="playai-level-avatar-wrap" style={{ borderColor: lv.color + '66' }}>
                                <div
                                    className="playai-level-avatar"
                                    style={{ width: '80%', height: '80%' }}
                                    dangerouslySetInnerHTML={{ __html: lv.avatarSvg }}
                                />
                            </div>

                            <div className="playai-level-name">{lv.label}</div>

                            {/* Rating */}
                            <div className="playai-level-rating" style={{ color: lv.color }}>
                                <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }} />
                                {lv.rating}
                            </div>

                            <div className="playai-level-badge">{lv.subtitle}</div>
                            <div className="playai-level-desc">{lv.description}</div>

                            {/* Sample quote */}
                            <div className="playai-level-quote" style={{ borderColor: lv.color + '44' }}>
                                <i className="fa-solid fa-quote-left" style={{ fontSize: '0.6rem', opacity: 0.5, marginRight: 4 }} />
                                {lv.moveLines?.[0]}
                            </div>

                            {selectedLevel?.id === lv.id && (
                                <div className="playai-level-check">
                                    <i className="fa-solid fa-circle-check" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="playai-color-section">
                    <h3>Play as</h3>
                    <div className="playai-color-opts">
                        {[
                            { id: 'white', label: 'White', icon: 'fa-chess-king' },
                            { id: 'random', label: 'Random', icon: 'fa-shuffle' },
                            { id: 'black', label: 'Black', icon: 'fa-chess-king' },
                        ].map(c => (
                            <button
                                key={c.id}
                                className={`playai-color-btn ${playerColor === c.id ? 'active' : ''} color-${c.id}`}
                                onClick={() => setPlayerColor(c.id)}
                            >
                                <i className={`fa-solid ${c.icon}`} />
                                <span>{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    className="playai-start-btn"
                    onClick={startGame}
                    disabled={!selectedLevel || !engineReady}
                >
                    {!engineReady ? (
                        <><i className="fa-solid fa-circle-notch fa-spin" /> Loading Engine...</>
                    ) : (
                        <><i className="fa-solid fa-play" /> Start Game</>
                    )}
                </button>
            </div>
        );
    }

    // ─── GAME SCREEN ─────────────────────────────────────────────────────────
    const playerName = user?.username || 'You';
    const aiName = level?.label || 'AI';
    const playerIsWhite = orientation === 'white';
    const aiIsWhite = !playerIsWhite;
    const aiTurn = turn !== orientation;

    return (
        <div className="playai-game-container">
            {/* Promotion Modal */}
            {promotionMove && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Choose Promotion Piece</h3>
                        <div className="promotion-options">
                            {['q', 'r', 'b', 'n'].map(p => (
                                <button key={p} onClick={() => handlePromotion(p)} className="btn-promotion">
                                    <i className={`fa-solid fa-chess-${p === 'q' ? 'queen' : p === 'r' ? 'rook' : p === 'b' ? 'bishop' : 'knight'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {gameStatus === 'completed' && (
                <div className="modal-overlay">
                    <div className="modal-content playai-result-modal">
                        <div className="playai-result-icon">
                            {resultMessage.includes('You win') || resultMessage.includes(orientation === 'white' ? 'White wins' : 'Black wins')
                                ? <i className="fa-solid fa-trophy" style={{ color: '#f59e0b' }} />
                                : resultMessage.includes('Draw')
                                    ? <i className="fa-solid fa-handshake" style={{ color: '#6b7280' }} />
                                    : <i className="fa-solid fa-skull" style={{ color: '#f43f5e' }} />
                            }
                        </div>
                        <h2 className="playai-result-title">{resultMessage}</h2>
                        <div className="playai-result-stats">
                            <span>{movesList.length} moves played</span>
                        </div>
                        <div className="modal-actions">
                            <button onClick={startGame} className="btn-primary">
                                <i className="fa-solid fa-rotate-right" /> Rematch
                            </button>
                            <button
                                onClick={handleAnalyze}
                                className="btn-secondary"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)', color: '#000', fontWeight: 'bold', border: 'none' }}
                            >
                                <i className="fa-solid fa-chart-line" /> Analyze
                            </button>
                            {user && !user.isGuest && (
                                <button
                                    onClick={handleSaveGame}
                                    disabled={gameSaved || isSaving}
                                    className="btn-secondary"
                                    style={{ background: gameSaved ? '#166534' : 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', fontWeight: 'bold', border: 'none', opacity: gameSaved ? 0.8 : 1 }}
                                >
                                    {isSaving
                                        ? <><i className="fa-solid fa-circle-notch fa-spin" /> Saving...</>
                                        : gameSaved
                                            ? <><i className="fa-solid fa-check" /> Saved!
                                            </>
                                            : <><i className="fa-solid fa-floppy-disk" /> Save to History</>
                                    }
                                </button>
                            )}
                            <button onClick={handleNewGame} className="btn-secondary">
                                <i className="fa-solid fa-list" /> Choose Opponent
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="playai-game-grid">
                <div className="playai-board-wrapper">
                    {/* Opponent (AI) */}
                    <div className="playai-player-bar">
                        <div className="playai-player-info">
                            <div className="playai-avatar-wrap">
                                <div
                                    className="playai-avatar"
                                    style={{ border: `2px solid ${level?.color}` }}
                                    dangerouslySetInnerHTML={{ __html: level?.avatarSvg }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="playai-player-name">
                                    {aiName}
                                    <span className="playai-difficulty-badge" style={{ background: level?.color + '22', color: level?.color, border: `1px solid ${level?.color}44` }}>
                                        {level?.subtitle}
                                    </span>
                                    {level?.rating && (
                                        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            ({level.rating})
                                        </span>
                                    )}
                                </div>
                                <div className="playai-player-sub">
                                    {isThinking && aiTurn
                                        ? <><i className="fa-solid fa-circle-notch fa-spin" /> Thinking...</>
                                        : 'Computer'
                                    }
                                </div>
                                {/* Speech bubble */}
                                {aiSpeech && (
                                    <div className="playai-speech-bubble" style={{ borderColor: level?.color + '66' }}>
                                        {aiSpeech}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>{/* end AI player bar */}

                    <div className="playai-board">
                        <Chessboard
                            position={fen}
                            onPieceDrop={onDrop}
                            onSquareClick={onSquareClick}
                            onMouseOverSquare={onMouseOverSquare}
                            onMouseOutSquare={onMouseOutSquare}
                            customSquareStyles={optionSquares}
                            boardOrientation={orientation}
                            animationDuration={200}
                            arePiecesDraggable={!isThinking && gameStatus === 'playing' && turn === orientation}
                        />
                    </div>

                    {/* Player */}
                    <div className="playai-player-bar">
                        <div className="playai-player-info">
                            <img
                                src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${playerName}`}
                                alt={playerName}
                                className="playai-avatar"
                                style={{ border: '2px solid var(--accent)' }}
                            />
                            <div>
                                <div className="playai-player-name">{playerName} <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.8rem' }}>(You)</span></div>
                                <div className="playai-player-sub">Rating: {user?.rating || '?'}</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Sidebar */}
                <div className="playai-sidebar">
                    {/* Level badge */}
                    <div className="playai-sidebar-level" style={{ background: level?.gradient, border: `1px solid ${level?.color}44` }}>
                        <i className={`fa-solid ${level?.icon}`} />
                        <span>{level?.label}</span>
                        <span className="playai-sidebar-sublabel">{level?.subtitle}</span>
                    </div>

                    {/* Status */}
                    <div className="playai-status-card">
                        {gameStatus === 'playing' ? (
                            isThinking && aiTurn ? (
                                <><i className="fa-solid fa-robot" style={{ color: level?.color }} /> AI is thinking...</>
                            ) : (
                                <><i className={`fa-solid fa-chess-${turn === 'white' ? 'king' : 'king'}`} /> {turn.toUpperCase()} to move</>
                            )
                        ) : (
                            <><i className="fa-solid fa-flag-checkered" /> Game Over</>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="playai-controls">
                        {gameStatus === 'playing' && (
                            <button onClick={handleResign} className="btn-danger playai-ctrl-btn">
                                <i className="fa-solid fa-flag" /> Resign
                            </button>
                        )}
                        <button onClick={handleNewGame} className="btn-secondary playai-ctrl-btn">
                            <i className="fa-solid fa-list" /> New Opponent
                        </button>
                        {gameStatus === 'completed' && (
                            <>
                                <button onClick={startGame} className="btn-primary playai-ctrl-btn">
                                    <i className="fa-solid fa-rotate-right" /> Rematch
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    className="playai-ctrl-btn"
                                    style={{
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        border: 'none'
                                    }}
                                >
                                    <i className="fa-solid fa-chart-line" /> Analyze Game
                                </button>
                            </>
                        )}
                    </div>

                    {/* Move list */}
                    {movesList.length > 0 && (
                        <div className="playai-moves-section">
                            <h4>Moves</h4>
                            <div className="playai-moves-grid">
                                {movesList.map((m, i) => (
                                    <div key={i} className={`playai-move-item ${i % 2 === 0 ? 'white-move' : 'black-move'}`}>
                                        {i % 2 === 0 && <span className="playai-move-num">{m.move_number}.</span>}
                                        <span>{m.san}</span>
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

export default PlayAI;