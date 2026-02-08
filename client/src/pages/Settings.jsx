import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Settings = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [username, setUsername] = useState(user?.username || '');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', content: '' });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', content: '' });

        try {
            const res = await axios.put(`${API_URL}/api/auth/update-profile`, { username });
            setMsg({ type: 'success', content: 'Profile updated. Please re-login to see changes completely.' });
        } catch (error) {
            setMsg({ type: 'error', content: error.response?.data?.error || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you SURE? This action cannot be undone. All your data will be lost forever.')) return;

        setLoading(true);
        try {
            await axios.delete(`${API_URL}/api/auth/delete-account`);
            window.location.href = '/login';
        } catch (error) {
            setMsg({ type: 'error', content: 'Delete failed' });
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="page-title">User Settings</h1>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>

                {msg.content && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        backgroundColor: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: msg.type === 'error' ? '#7f1d1d' : '#14532d'
                    }}>
                        {msg.content}
                    </div>
                )}

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>
                        Email cannot be changed
                    </small>
                </div>

                <hr style={{ borderColor: 'var(--bg-tertiary)', margin: 'var(--spacing-lg) 0' }} />

                <form onSubmit={handleUpdateProfile}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            minLength={3}
                            maxLength={20}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>
                            Changing username will change your discriminator (hash)
                        </small>
                    </div>

                    <button className="btn-primary w-full" type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                <hr style={{ borderColor: 'var(--bg-tertiary)', margin: 'var(--spacing-lg) 0' }} />

            </div>

            <hr style={{ borderColor: 'var(--bg-tertiary)', margin: 'var(--spacing-lg) 0' }} />

            <BlockedUsersList API_URL={API_URL} setMsg={setMsg} />

            <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <h3 style={{ color: '#ef4444' }}>Danger Zone</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    className="btn-primary"
                    style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                    onClick={handleDeleteAccount}
                    disabled={loading}
                >
                    Delete Account
                </button>
            </div>

        </div>
    );
};

const BlockedUsersList = ({ API_URL, setMsg }) => {
    const [blocked, setBlocked] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlocked();
    }, []);

    const fetchBlocked = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/friends/blocked`);
            setBlocked(res.data.blocked || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (id) => {
        try {
            await axios.post(`${API_URL}/api/friends/unblock/${id}`);
            setMsg({ type: 'success', content: 'User unblocked' });
            fetchBlocked();
        } catch (error) {
            setMsg({ type: 'error', content: 'Failed to unblock' });
        }
    };

    if (loading) return <div>Loading blocked users...</div>;

    return (
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <h3>Blocked Users</h3>
            {blocked.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No blocked users</p> : (
                <ul className="list-group">
                    {blocked.map(user => (
                        <li key={user._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span>{user.username}</span>
                            <button className="btn-secondary btn-sm" onClick={() => handleUnblock(user._id)}>Unblock</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Settings;

