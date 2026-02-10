import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chess } from 'chess.js';
import { useAuth } from '../../context/AuthContext';

const Analysis = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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

            if (user?.isGuest) {
                navigate('/analysis', { state: { pgn: type === 'pgn' ? pgn : null, fen: type === 'fen' ? fen : null } });
                return;
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
        <div className="max-w-[1600px] mx-auto pb-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-4 tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">Game Analysis</span>
                </h1>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed opacity-80">
                    Analyze your games, test positions, and improve your chess understanding with our powerful engine.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="bg-secondary/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <div className="flex space-x-2 bg-black/40 p-1.5 rounded-xl mb-8 border border-white/10 w-fit mx-auto sm:mx-0">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('pgn'); setError(''); }}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'pgn'
                                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                }`}
                        >
                            PGN Analysis
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('fen'); setError(''); }}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'fen'
                                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                }`}
                        >
                            FEN Analysis
                        </button>
                    </div>

                    <div className="space-y-8">
                        {activeTab === 'pgn' ? (
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider pl-1">
                                    PGN Data
                                </label>
                                <textarea
                                    value={pgn}
                                    onChange={(e) => setPgn(e.target.value)}
                                    placeholder={'[Event "Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5...'}
                                    className="w-full h-80 rounded-2xl bg-black/40 border border-white/10 p-6 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none font-mono text-sm leading-relaxed"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAnalysis('pgn')}
                                    disabled={analyzing || !pgn.trim()}
                                    className="btn-primary w-full py-5 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {analyzing ? (
                                        <>
                                            <i className="fa-solid fa-circle-notch fa-spin" />
                                            Starting Analysis...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-play" />
                                            Start Analysis
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider pl-1">
                                    FEN String
                                </label>
                                <input
                                    type="text"
                                    value={fen}
                                    onChange={(e) => setFen(e.target.value)}
                                    placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                                    className="w-full rounded-2xl bg-black/40 border border-white/10 p-6 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-mono text-sm leading-relaxed"
                                />
                                <p className="text-sm text-text-secondary opacity-80 px-1">
                                    Forsyth–Edwards Notation describes a single board position.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleAnalysis('fen')}
                                    disabled={analyzing || !fen.trim()}
                                    className="bg-accent hover:bg-accent-hover text-white w-full py-5 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {analyzing ? (
                                        <>
                                            <i className="fa-solid fa-circle-notch fa-spin" />
                                            Starting Analysis...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-chess-board" />
                                            Start Analysis
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 animate-pulse">
                                <i className="fa-solid fa-circle-exclamation shrink-0 text-lg" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info / Decoration Side */}
                <div className="hidden xl:flex flex-col gap-8">
                    <div className="bg-secondary/40 backdrop-blur-xl rounded-3xl border border-white/10 p-12 relative overflow-hidden min-h-[400px] flex flex-col justify-center text-center group hover:bg-secondary/60 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <i className="fa-solid fa-chart-line text-[12rem] text-white/5 absolute -top-10 -right-10 rotate-12 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110" />

                        <h3 className="text-4xl font-black text-white mb-6 relative z-10 drop-shadow-lg">Deep Insights</h3>
                        <p className="text-white/70 text-xl leading-relaxed relative z-10 max-w-md mx-auto">
                            Uncover the hidden truths of your games. Our engine sees 20 moves ahead to find the winning variation you missed.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-secondary/60 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center gap-4 hover:bg-secondary/80 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 mb-2 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                                <i className="fa-solid fa-check text-2xl" />
                            </div>
                            <span className="text-xl font-bold text-text-primary">Accuracy</span>
                        </div>
                        <div className="bg-secondary/60 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center gap-4 hover:bg-secondary/80 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                <i className="fa-solid fa-bolt text-2xl" />
                            </div>
                            <span className="text-xl font-bold text-text-primary">Speed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
