import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ProfileHeader from '../components/Profile/ProfileHeader';
import MatchHistory from '../components/Profile/MatchHistory';
import FriendsGrid from '../components/Profile/FriendsGrid';
import { Loader } from 'lucide-react';

const PublicProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('history');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            setError(null);
            try {

                const profileRes = await axios.get(`${API_URL}/api/users/${username}`);
                setProfile(profileRes.data);

                const historyRes = await axios.get(`${API_URL}/api/users/${username}/history`);
                setHistory(historyRes.data.history);

                const friendsRes = await axios.get(`${API_URL}/api/users/${username}/friends`);
                setFriends(friendsRes.data.friends);

            } catch (err) {
                console.error('Error fetching profile:', err);
                setError(err.response?.data?.error || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfileData();
        }
    }, [username]);

    const handleFriendAction = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (currentUser?.isGuest) {
            alert('Please login to add friends');
            return;
        }

        try {
            const { friend_status, user } = profile;

            if (friend_status === 'none') {

                await axios.post(`${API_URL}/api/friends/send-request`, {
                    receiver_id: user.id
                });
                setProfile(prev => ({ ...prev, friend_status: 'sent' }));
            } else if (friend_status === 'received') {

                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Friend action error:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                <Loader className="animate-spin text-accent" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
                <div className="text-red-500 text-xl font-semibold">{error}</div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {profile && (
                <ProfileHeader
                    user={profile.user}
                    friendStatus={profile.friend_status}
                    onFriendAction={handleFriendAction}
                />
            )}

            <div className="mt-8">
                { }
                <div className="flex border-b border-white/10 mb-6">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'history'
                            ? 'border-accent text-accent'
                            : 'border-transparent text-text-secondary hover:text-white'
                            }`}
                    >
                        Match History
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'friends'
                            ? 'border-accent text-accent'
                            : 'border-transparent text-text-secondary hover:text-white'
                            }`}
                    >
                        Friends ({friends.length})
                    </button>
                </div>

                { }
                <div className="bg-secondary/30 rounded-xl border border-white/5 backdrop-blur-sm min-h-[300px]">
                    {activeTab === 'history' ? (
                        <MatchHistory history={history} />
                    ) : (
                        <div className="p-6">
                            <FriendsGrid friends={friends} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
