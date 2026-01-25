import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Verify = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { verify } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verify(email, code);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Verify Your Email</h1>
                <p className="subtitle">Enter the 6-digit code sent to {email}</p>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">Email verified! Redirecting to login...</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Verification Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="000000"
                            required
                            maxLength={6}
                            pattern="[0-9]{6}"
                            style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={loading || success}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Verify;
