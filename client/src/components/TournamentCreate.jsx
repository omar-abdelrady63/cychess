import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TournamentCreate = ({ onClose }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        rounds_count: 3,
        time_control: 10,
        increment: 0,
        is_ranked: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/api/tournament/create`, formData);

            if (response.data.success) {
                navigate(`/tournament/${response.data.tournament.id}/lobby`);
            }
        } catch (err) {
            console.error('Create tournament error:', err);
            setError(err.response?.data?.error || 'Failed to create tournament');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content max-w-[500px] max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 m-0">
                        <i className="fa-solid fa-trophy text-accent" />
                        Create tournament
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tournament name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Friday Night Blitz"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Number of rounds *</label>
                        <select
                            value={formData.rounds_count}
                            onChange={(e) => setFormData({ ...formData, rounds_count: parseInt(e.target.value) })}
                        >
                            {[...Array(20)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} round{i !== 0 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Time control (minutes) *</label>
                        <select
                            value={formData.time_control}
                            onChange={(e) => setFormData({ ...formData, time_control: parseInt(e.target.value) })}
                        >
                            <option value={1}>1 min (Bullet)</option>
                            <option value={3}>3 min (Blitz)</option>
                            <option value={5}>5 min (Blitz)</option>
                            <option value={10}>10 min (Rapid)</option>
                            <option value={15}>15 min (Rapid)</option>
                            <option value={30}>30 min (Classical)</option>
                            <option value={60}>60 min (Classical)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Increment (seconds)</label>
                        <select
                            value={formData.increment}
                            onChange={(e) => setFormData({ ...formData, increment: parseInt(e.target.value) })}
                        >
                            <option value={0}>No increment</option>
                            <option value={1}>+1 s</option>
                            <option value={2}>+2 s</option>
                            <option value={3}>+3 s</option>
                            <option value={5}>+5 s</option>
                            <option value={10}>+10 s</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_ranked}
                                onChange={(e) => setFormData({ ...formData, is_ranked: e.target.checked })}
                                className="rounded border-white/20 bg-black/30 text-accent focus:ring-accent/50"
                            />
                            Ranked (affects ratings)
                        </label>
                    </div>

                    <button type="submit" className="btn-primary w-full mt-4 flex items-center justify-center gap-2" disabled={loading}>
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin" />
                                Creating…
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-plus" />
                                Create tournament
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TournamentCreate;
