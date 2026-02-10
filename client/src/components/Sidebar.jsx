import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, acceptGameInvite, fetchNotifications } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: 'fa-chess-board', label: 'Play' },
        { path: '/dashboard/tournaments', icon: 'fa-trophy', label: 'Tournaments' },
        { path: '/dashboard/friends', icon: 'fa-user-group', label: 'Friends' },
        { path: '/dashboard/analysis', icon: 'fa-chart-line', label: 'Analysis' },
        { path: '/dashboard/history', icon: 'fa-clock-rotate-left', label: 'History' },
        { path: '/themes', icon: 'fa-palette', label: 'Themes' },
        { path: '/settings', icon: 'fa-gear', label: 'Settings' },
    ];

    return (
        <>
            { }
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
                aria-hidden="true"
            />

            { }
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 flex flex-col shrink-0 min-w-[16rem]
                    text-text-primary
                    transform transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="h-full flex flex-col min-h-0 border-r border-white/10 bg-secondary/80 backdrop-blur-xl lg:rounded-r-2xl overflow-hidden">
                    { }
                    <div className="shrink-0 flex items-center justify-between px-4 py-5 border-b border-white/10">
                        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
                            <i className="fa-solid fa-chess text-accent text-xl" aria-hidden="true" />
                            <span className="bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent">CyChess</span>
                        </Link>
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                            aria-label="Close menu"
                        >
                            <i className="fa-solid fa-xmark text-lg" />
                        </button>
                    </div>

                    { }
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 no-scrollbar">
                        {menuItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-w-0
                                        ${active
                                            ? 'bg-accent/20 text-accent border border-accent/30 shadow-sm'
                                            : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <i className={`fa-solid ${item.icon} w-5 shrink-0 text-center text-base ${active ? 'opacity-100' : 'opacity-80'}`} aria-hidden="true" />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    { }
                    <div className="shrink-0 px-3 py-2 border-t border-white/10 relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => { setNotifOpen(o => !o); fetchNotifications(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                        >
                            <span className="relative shrink-0">
                                <i className="fa-solid fa-bell text-lg" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </span>
                            <span className="whitespace-nowrap">Notifications</span>
                        </button>
                        {notifOpen && (
                            <div className="absolute left-0 right-0 bottom-full mb-1 w-full max-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-secondary/95 backdrop-blur-xl shadow-xl z-[60] flex flex-col">
                                <div className="p-2 border-b border-white/10 shrink-0">
                                    <span className="text-sm font-semibold text-text-primary">Notifications</span>
                                </div>
                                <div className="p-2 overflow-y-auto no-scrollbar flex-1 min-h-0">
                                    {notifications.length === 0 ? (
                                        <p className="text-text-secondary text-sm py-6 text-center opacity-80">No notifications</p>
                                    ) : (
                                        notifications.slice(0, 20).map((n) => {
                                            const id = n.id || n._id;
                                            return (
                                                <div key={id} className="rounded-xl border border-white/10 bg-black/20 p-3 mb-2 last:mb-0">
                                                    <p className="text-text-primary text-sm font-medium">{n.title}</p>
                                                    <p className="text-text-secondary text-xs mt-0.5 opacity-90">{n.message}</p>
                                                    {n.type === 'game_invite' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setNotifOpen(false); acceptGameInvite(n); }}
                                                            className="mt-2 w-full py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-xs font-medium"
                                                        >
                                                            Accept & join game
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    { }
                    <div className="shrink-0 pt-4 pb-6 px-4 border-t border-white/10 space-y-3">
                        {!user?.isGuest ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/profile/${user?.username}`)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-left group"
                                >
                                    <img
                                        src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`}
                                        alt=""
                                        className="w-9 h-9 rounded-full border-2 border-white/20 group-hover:border-accent/50 transition-colors object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-text-primary truncate text-sm">{user?.username}</div>
                                        <div className="text-xs text-text-secondary opacity-80">Rating: {user?.rating ?? '—'}</div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-text-secondary text-xs group-hover:text-accent transition-colors" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-text-secondary hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400 transition-all duration-200 text-sm font-medium"
                                >
                                    <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl border border-accent/20 bg-accent/5 text-center mb-2">
                                    <p className="text-sm font-bold text-white mb-1">Guest Mode</p>
                                    <p className="text-xs text-text-secondary">Sign in to save progress</p>
                                </div>
                                <Link
                                    to="/login"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white transition-all duration-200 text-sm font-bold shadow-lg shadow-accent/20"
                                >
                                    Sign In
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-text-secondary hover:bg-white/5 transition-all duration-200 text-sm font-medium"
                                >
                                    Exit Guest Mode
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
