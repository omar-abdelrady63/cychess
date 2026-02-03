import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
                    <i className="fa-solid fa-chess"></i>
                    CyChess
                </Link>

                <button
                    onClick={toggleMobileMenu}
                    className="mobile-menu-toggle"
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-bars"></i>}
                </button>

                <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-chess-board"></i>
                                Dashboard
                            </Link>
                            <Link to="/history" className="nav-link" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-clock-rotate-left"></i>
                                History
                            </Link>
                            <Link to="/themes" className="nav-link" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-palette"></i>
                                Themes
                            </Link>
                            <Link to="/settings" className="nav-user" onClick={closeMobileMenu}>
                                <img
                                    src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`}
                                    alt="avatar"
                                    className="user-avatar"
                                />
                                <span className="user-name">{user?.full_name}</span>
                            </Link>
                            <button onClick={handleLogout} className="btn-outline">
                                <i className="fa-solid fa-right-from-bracket"></i>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/themes" className="nav-link" onClick={closeMobileMenu}>
                                <i className="fa-solid fa-palette"></i>
                                Themes
                            </Link>
                            <Link to="/login" className="btn-outline" onClick={closeMobileMenu}>
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary" onClick={closeMobileMenu}>
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
