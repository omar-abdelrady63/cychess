import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const MobileBottomNav = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();

    // activePopover tracks which icon's popover is currently open
    // null means none
    const [activePopover, setActivePopover] = useState(null);
    const navRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setActivePopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close popover when path changes
    useEffect(() => {
        setActivePopover(null);
    }, [location.pathname]);

    const isActive = (paths) => {
        if (Array.isArray(paths)) {
            return paths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
        }
        return location.pathname === paths;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const togglePopover = (menu) => {
        setActivePopover(prev => (prev === menu ? null : menu));
    };

    const PopoverMenu = ({ menuName, items }) => {
        if (activePopover !== menuName) return null;

        return (
            <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-48 py-2 bg-secondary/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex flex-col gap-1 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {items.map((item, idx) => {
                    if (item.action === 'logout') {
                        return (
                            <button
                                key={idx}
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center`} />
                                {item.label}
                            </button>
                        );
                    }
                    if (item.action === 'login') {
                        return (
                            <Link
                                key={idx}
                                to="/login"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-accent hover:bg-accent/10 transition-colors"
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center`} />
                                {item.label}
                            </Link>
                        );
                    }

                    const active = isActive(item.path);
                    return (
                        <Link
                            key={idx}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                active
                                    ? 'text-accent bg-accent/10'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            <i className={`fa-solid ${item.icon} w-4 text-center ${active ? 'opacity-100' : 'opacity-80'}`} />
                            <span className="flex-1">{item.label}</span>
                            {item.badge > 0 && (
                                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-none" ref={navRef}>
            <div className="relative pointer-events-auto">
                <div className="flex items-center justify-around bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 px-4 shadow-black/50">
                    
                    {/* 1. Play Menu */}
                    <div className="relative">
                        <button
                            onClick={() => togglePopover('play')}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                                isActive(['/dashboard', '/play-ai', '/dashboard/tournaments']) || activePopover === 'play'
                                    ? 'text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            <i className="fa-solid fa-gamepad text-xl" />
                        </button>
                        <PopoverMenu
                            menuName="play"
                            items={[
                                { label: 'Play PvP', path: '/dashboard', icon: 'fa-chess-board' },
                                { label: 'Play vs AI', path: '/play-ai', icon: 'fa-robot' },
                                { label: 'Tournaments', path: '/dashboard/tournaments', icon: 'fa-trophy' }
                            ]}
                        />
                    </div>

                    {/* 2. Stats Menu */}
                    <div className="relative">
                        <button
                            onClick={() => togglePopover('stats')}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                                isActive(['/dashboard/analysis', '/dashboard/history']) || activePopover === 'stats'
                                    ? 'text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            <i className="fa-solid fa-chart-line text-xl" />
                        </button>
                        <PopoverMenu
                            menuName="stats"
                            items={[
                                { label: 'Analysis', path: '/dashboard/analysis', icon: 'fa-chart-pie' },
                                { label: 'History', path: '/dashboard/history', icon: 'fa-clock-rotate-left' }
                            ]}
                        />
                    </div>

                    {/* 3. Social Menu */}
                    <div className="relative">
                        <button
                            onClick={() => togglePopover('social')}
                            className={`relative p-3 rounded-xl transition-all duration-200 ${
                                isActive(['/dashboard/friends']) || activePopover === 'social'
                                    ? 'text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            <i className="fa-solid fa-user-group text-xl" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1 min-w-[16px] h-[16px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-secondary">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <PopoverMenu
                            menuName="social"
                            items={[
                                { label: 'Friends', path: '/dashboard/friends', icon: 'fa-users' },
                                { label: 'Notifications', path: '/dashboard/notifications', icon: 'fa-bell', badge: unreadCount } // We will create a mobile notifications view or trigger modal later if needed. Wait, let's keep it simple.
                            ]}
                        />
                    </div>

                    {/* 4. Themes (Direct Link) */}
                    <div className="relative">
                        <Link
                            to="/themes"
                            onClick={() => setActivePopover(null)}
                            className={`block p-3 rounded-xl transition-all duration-200 ${
                                isActive('/themes')
                                    ? 'text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            <i className="fa-solid fa-palette text-xl" />
                        </Link>
                    </div>

                    {/* 5. Menu/Profile */}
                    <div className="relative">
                        <button
                            onClick={() => togglePopover('menu')}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                                isActive(['/settings', '/profile']) || activePopover === 'menu'
                                    ? 'text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            <i className="fa-solid fa-bars text-xl" />
                        </button>
                        <PopoverMenu
                            menuName="menu"
                            items={
                                user && !user.isGuest
                                    ? [
                                          { label: 'Profile', path: `/profile/${user.username}`, icon: 'fa-user' },
                                          { label: 'Settings', path: '/settings', icon: 'fa-gear' },
                                          { label: 'Logout', action: 'logout', icon: 'fa-right-from-bracket' }
                                      ]
                                    : [
                                          { label: 'Settings', path: '/settings', icon: 'fa-gear' },
                                          { label: 'Sign In', action: 'login', icon: 'fa-right-to-bracket' }
                                      ]
                            }
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MobileBottomNav;
