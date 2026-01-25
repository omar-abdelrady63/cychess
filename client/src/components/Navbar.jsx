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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Link to="/" className="navbar-brand">
                        ♟️ CyChess
                    </Link>

                    <button
                        onClick={toggleMobileMenu}
                        style={{
                            display: 'none',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 'var(--spacing-sm)',
                            color: 'var(--text-primary)',
                            fontSize: '1.5rem',
                        }}
                        className="mobile-menu-toggle"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                <div
                    className="navbar-links"
                    style={{
                        maxHeight: mobileMenuOpen ? '500px' : undefined,
                        overflow: mobileMenuOpen ? 'visible' : undefined,
                    }}
                >
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
                            <Link to="/history" className="nav-link" onClick={closeMobileMenu}>History</Link>
                            <Link to="/themes" className="nav-link" onClick={closeMobileMenu}>Themes</Link>
                            <Link to="/settings" className="nav-user" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={closeMobileMenu}>
                                <img
                                    src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`}
                                    alt="avatar"
                                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--accent)' }}
                                />
                                <span>{user?.full_name}</span>
                            </Link>
                            <button onClick={handleLogout} className="btn-outline">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/themes" className="nav-link" onClick={closeMobileMenu}>Themes</Link>
                            <Link to="/login" className="btn-outline" onClick={closeMobileMenu}>Login</Link>
                            <Link to="/register" className="btn-primary" onClick={closeMobileMenu}>Register</Link>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .mobile-menu-toggle {
                        display: block !important;
                    }

                    .navbar-links {
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.3s ease;
                    }

                    .navbar-links.open {
                        max-height: 500px;
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
