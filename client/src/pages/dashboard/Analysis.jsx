import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chess } from 'chess.js';

const Analysis = () => {
    const navigate = useNavigate();
    const [pgn, setPgn] = useState('');
    const [fen, setFen] = useState('');
    const [error, setError] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('pgn');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleAnalysis = async (type) => {
        setError('');
        setAnalyzing(true);

        try {
            const chess = new Chess();

            if (type === 'pgn') {
                if (!pgn.trim()) throw new Error('Please enter a PGN');
                try {
                    chess.loadPgn(pgn);
                } catch (e) {
                    throw new Error('Invalid PGN format');
                }
            } else {
                if (!fen.trim()) throw new Error('Please enter a FEN string');
                try {
                    chess.load(fen);
                } catch (e) {
                    throw new Error('Invalid FEN format');
                }
            }

            const response = await axios.post(`${API_URL}/api/analysis/create`, {
                pgn: type === 'pgn' ? pgn : null,
                fen: type === 'fen' ? fen : null
            });

            if (response.data.analysisId) {
                navigate(`/analysis/${response.data.analysisId}`);
            } else {
                navigate(`/analysis/local`, { state: { pgn, fen } });
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Analysis could not be started');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-8">
            {}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Analysis</h1>
                <p className="text-text-secondary opacity-80 mt-1">
                    Analyze a game (PGN) or a position (FEN) with the engine.
                </p>
            </div>

            {}
            <div className="flex rounded-xl bg-black/30 p-1 border border-white/10 mb-6">
                <button
                    type="button"
                    onClick={() => { setActiveTab('pgn'); setError(''); }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pgn' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Game (PGN)
                </button>
                <button
                    type="button"
                    onClick={() => { setActiveTab('fen'); setError(''); }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'fen' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Position (FEN)
                </button>
            </div>

            {}
            <div className="rounded-2xl border border-white/10 bg-secondary/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
                {activeTab === 'pgn' ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-text-primary">Paste your game in PGN format</label>
                        <textarea
                            value={pgn}
                            onChange={(e) => setPgn(e.target.value)}
                            placeholder={'[Event "Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5...'}
                            className="w-full min-h-[220px] rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-text-primary placeholder:text-white/40 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-y font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => handleAnalysis('pgn')}
                            disabled={analyzing || !pgn.trim()}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {analyzing ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-play" />}
                            {analyzing ? 'Starting…' : 'Analyze game'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-text-primary">Enter a position in FEN notation</label>
                        <input
                            type="text"
                            value={fen}
                            onChange={(e) => setFen(e.target.value)}
                            placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-text-primary placeholder:text-white/40 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-mono text-sm"
                        />
                        <p className="text-xs text-text-secondary opacity-80">
                            Forsyth–Edwards Notation describes a single board position. The engine will suggest the best continuation.
                        </p>
                        <button
                            type="button"
                            onClick={() => handleAnalysis('fen')}
                            disabled={analyzing || !fen.trim()}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {analyzing ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-chess-board" />}
                            {analyzing ? 'Starting…' : 'Analyze position'}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analysis;
