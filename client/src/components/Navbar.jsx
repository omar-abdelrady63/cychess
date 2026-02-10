import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 border-b border-white/10 bg-secondary/90 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <Link
                    to="/"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent hover:opacity-90 transition-opacity"
                >
                    <i className="fa-solid fa-chess text-accent" aria-hidden="true" />
                    CyChess
                </Link>

                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-xl text-text-primary hover:bg-white/10 transition-colors"
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <i className="fa-solid fa-xmark text-xl" /> : <i className="fa-solid fa-bars text-xl" />}
                </button>

                <div
                    className={`
                        absolute lg:static top-full left-0 right-0 mt-2 lg:mt-0
                        flex-col lg:flex-row items-center gap-4 lg:gap-6
                        rounded-2xl lg:rounded-none border border-white/10 lg:border-none
                        bg-secondary/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
                        p-4 lg:p-0
                        ${mobileMenuOpen ? 'flex' : 'hidden lg:flex'}
                    `}
                >
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="font-medium text-text-primary hover:text-accent transition-colors py-2" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-chess-board mr-2" />
                                Dashboard
                            </Link>
                            <Link to="/dashboard/history" className="font-medium text-text-primary hover:text-accent transition-colors py-2" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-clock-rotate-left mr-2" />
                                History
                            </Link>
                            <Link to="/themes" className="font-medium text-text-primary hover:text-accent transition-colors py-2" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-palette mr-2" />
                                Themes
                            </Link>

                            {!user?.isGuest ? (
                                <>
                                    <Link
                                        to={user?.username ? `/profile/${user.username}` : '/dashboard'}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                                        onClick={closeMobileMenu}
                                    >
                                        <img
                                            src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`}
                                            alt=""
                                            className="w-8 h-8 rounded-full border border-white/20 object-cover"
                                        />
                                        <span className="font-medium text-text-primary truncate max-w-[100px]">{user?.full_name || user?.username}</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="btn-secondary py-2 px-4 text-sm hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400"
                                    >
                                        <i className="fa-solid fa-right-from-bracket mr-2" />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 ml-2">
                                        <span className="text-xs font-bold text-accent border border-accent/20 bg-accent/10 px-2 py-1 rounded hidden xl:inline-block">
                                            GUEST
                                        </span>
                                        <Link to="/login" className="btn-secondary py-2 px-4 transition-all" onClick={closeMobileMenu}>
                                            Sign In
                                        </Link>
                                        <Link to="/register" className="btn-primary py-2 px-4 transition-all" onClick={closeMobileMenu}>
                                            Register
                                        </Link>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/themes" className="font-medium text-text-primary hover:text-accent transition-colors py-2" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-palette mr-2" />
                                Themes
                            </Link>
                            <Link to="/login" className="btn-secondary py-2 px-5" onClick={closeMobileMenu}>
                                Log in
                            </Link>
                            <Link to="/register" className="btn-primary py-2 px-5" onClick={closeMobileMenu}>
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
