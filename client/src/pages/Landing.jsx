import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="container">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0' }}>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--accent)'
                }}>
                    <i className="fa-solid fa-chess" style={{ marginRight: '10px' }}></i> CyChess
                </h1>
                <p style={{
                    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-md)',
                    maxWidth: '600px',
                    margin: '0 auto var(--spacing-xl)',
                    padding: '0 var(--spacing-md)'
                }}>
                    Your next chess match is just a click away. Play with friends, track your games, and make every move count.
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap', padding: '0 var(--spacing-md)' }}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="btn-primary" style={{ padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '1.2rem' }}>
                                Go to Dashboard
                            </Link>
                            <a href="https://cychess-docs.vercel.app/docs/overview" className="btn-outline" style={{ padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '1.2rem', marginLeft: 'var(--spacing-md)' }} target="_blank" rel="noopener noreferrer">
                                <i className="fa-solid fa-book" style={{ marginRight: '8px' }}></i> Docs
                            </a>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="btn-primary" style={{ padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '1.2rem' }}>
                                Start Playing Free
                            </Link>
                            <Link to="/login" className="btn-outline" style={{ padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '1.2rem' }}>
                                Sign In
                            </Link>
                            <a href="https://cychess-docs.vercel.app/docs/overview" className="btn-outline" style={{ padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '1.2rem', marginLeft: 'var(--spacing-md)' }} target="_blank" rel="noopener noreferrer">
                                <i className="fa-solid fa-book" style={{ marginRight: '8px' }}></i> Docs
                            </a>
                        </>
                    )}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginTop: 'var(--spacing-2xl)',
                maxWidth: '900px',
                margin: 'var(--spacing-2xl) auto 0'
            }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Lightning Fast</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Real-time gameplay that feels instant. No lag, no waiting—just pure chess.
                    </p>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Play Your Way</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Challenge friends, set your own time controls, and customize everything to match your style.
                    </p>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>15 Beautiful Themes</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        From Olive Garden to Fiery Red —find the perfect look for your board.
                    </p>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Track Your Progress</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Monitor your rating, analyze your win rates, and watch yourself improve over time.
                    </p>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Completely Free</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No ads, no subscriptions, no paywalls. Just pure chess for everyone, everywhere.
                    </p>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Review Every Move</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Click through your game history, export to PGN, and learn from every match.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                <h2 className="page-title">Getting Started is Easy</h2>
                <div className="grid grid-3" style={{ marginTop: 'var(--spacing-xl)', maxWidth: '900px', margin: 'var(--spacing-xl) auto 0' }}>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: 'var(--spacing-sm)' }}>1</div>
                        <h3>Sign Up</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Create your account in seconds. No credit card, no hassle.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: 'var(--spacing-sm)' }}>2</div>
                        <h3>Find Opponents</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Add friends or create a game and share the link. Simple as that.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: 'var(--spacing-sm)' }}>3</div>
                        <h3>Start Playing</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Make your first move and experience chess the way it should be.
                        </p>
                    </div>
                </div>
            </div>

            {!isAuthenticated && (
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-2xl)', padding: 'var(--spacing-2xl)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Ready for Your Next Game?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: '1.1rem' }}>
                        Join players from around the world. It's free, it's fast, and it's waiting for you.
                    </p>
                    <Link to="/register" className="btn-primary" style={{ padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '1.2rem' }}>
                        Create Free Account
                    </Link>
                </div>
            )}

            <div style={{
                textAlign: 'center',
                marginTop: 'var(--spacing-2xl)',
                paddingTop: 'var(--spacing-xl)',
                paddingBottom: 'var(--spacing-md)',
                borderTop: '1px solid var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
            }}>
                <p style={{ margin: 0 }}>
                    <i className="fa-regular fa-copyright"></i> {new Date().getFullYear()} CyChess. All rights reserved.
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0' }}>
                    Created by <a href="https://github.com/omar-abdelrady63" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: '500' }}>Omar Abd-Elrady</a>
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0' }}>
                    <a href="https://cychess-docs.vercel.app/docs/overview" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }} target="_blank" rel="noopener noreferrer">Documentation</a>
                </p>
            </div>
        </div>
    );
};

export default Landing;
