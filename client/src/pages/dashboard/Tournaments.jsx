import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TournamentCreate from '../../components/TournamentCreate';
import LoginRequiredModal from '../../components/LoginRequiredModal';
import { useAuth } from '../../context/AuthContext';

const Tournaments = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showTournamentCreate, setShowTournamentCreate] = useState(false);
    const [tournamentInviteCode, setTournamentInviteCode] = useState('');
    const [joiningTournament, setJoiningTournament] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleJoinTournament = async () => {
        if (user?.isGuest) {
            setShowLoginModal(true);
            return;
        }
        if (!tournamentInviteCode.trim()) {
            alert('Please enter a tournament invite code');
            return;
        }
        setJoiningTournament(true);
        try {
            const response = await axios.post(`${API_URL}/api/tournament/join/${tournamentInviteCode.trim()}`);
            if (response.data.success) {
                navigate(`/tournament/${response.data.tournament_id}/lobby`);
            }
        } catch (error) {
            console.error('Join tournament error:', error);
            alert(error.response?.data?.error || 'Failed to join tournament');
        } finally {
            setJoiningTournament(false);
        }
    };

    const cardBase = 'rounded-2xl border border-white/10 bg-secondary/80 backdrop-blur-xl shadow-xl';

    return (
        <div className="space-y-8 pb-8">
            {showTournamentCreate ? (
                <TournamentCreate onClose={() => setShowTournamentCreate(false)} />
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    { }
                    <div className={`${cardBase} relative overflow-hidden min-h-[380px] flex items-center`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/15 to-purple-900/30 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-[url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none" />
                        <div className="relative z-10 p-8 md:p-14 w-full md:max-w-[65%]">
                            <span className="inline-block px-3 py-1 rounded-full border border-accent/40 text-accent text-xs font-semibold mb-4 bg-black/30">
                                Competitive
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 leading-tight">
                                Host a <span className="text-accent">tournament</span>
                            </h2>
                            <p className="text-text-secondary opacity-80 text-lg mb-8 max-w-lg">
                                Gather players, set the rules, and crown the champion in a Swiss-system bracket.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (user?.isGuest) {
                                        setShowLoginModal(true);
                                    } else {
                                        setShowTournamentCreate(true);
                                    }
                                }}
                                className="btn-primary flex items-center gap-3"
                            >
                                Create event
                                <i className="fa-solid fa-arrow-right" />
                            </button>
                        </div>
                    </div>

                    { }
                    <div className={`${cardBase} p-6 sm:p-10 flex flex-col md:flex-row items-center gap-10 md:gap-14`}>
                        <div className="flex-1 w-full">
                            <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-3">
                                <span className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                                    <i className="fa-solid fa-ticket" />
                                </span>
                                Have an invite code?
                            </h2>
                            <p className="text-text-secondary opacity-80 mb-6 pl-14">
                                Enter your 6-digit access code to join a private tournament lobby.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-xl pl-0 md:pl-14">
                                <input
                                    type="text"
                                    placeholder="Code"
                                    value={tournamentInviteCode}
                                    onChange={(e) => setTournamentInviteCode(e.target.value.toUpperCase())}
                                    className="flex-1 rounded-xl bg-black/30 border border-white/10 py-4 px-5 text-xl font-mono text-text-primary text-center tracking-widest focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none placeholder:text-white/30"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={handleJoinTournament}
                                    disabled={joiningTournament || !tournamentInviteCode.trim()}
                                    className="btn-primary min-w-[140px] flex items-center justify-center gap-2"
                                >
                                    {joiningTournament ? (
                                        <i className="fa-solid fa-circle-notch fa-spin" />
                                    ) : (
                                        <>
                                            Join
                                            <i className="fa-solid fa-arrow-right" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-40 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        <div className="md:w-1/3 text-center opacity-80">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                                <i className="fa-solid fa-users-viewfinder text-4xl text-text-secondary" />
                            </div>
                            <p className="text-sm text-text-secondary opacity-80">Spectator mode available</p>
                        </div>
                    </div>
                </div>
            )}
            <LoginRequiredModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                message="Join the community to participate in tournaments and compete for the top spot."
                actionLabel="Sign In to Compete"
            />
        </div>
    );
};

export default Tournaments;
