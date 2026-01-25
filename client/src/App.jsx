import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import NotificationPopup from './components/NotificationPopup';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import Game from './pages/Game';
import GameHistory from './pages/GameHistory';
import Settings from './pages/Settings';
import Themes from './pages/Themes';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <SocketProvider>
                    <Router>
                        <div className="app">
                            <Navbar />
                            <NotificationPopup />
                            <Routes>
                                <Route path="/" element={<Landing />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/verify" element={<Verify />} />
                                <Route path="/themes" element={<Themes />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <PrivateRoute>
                                            <Dashboard />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/game/:roomId"
                                    element={
                                        <PrivateRoute>
                                            <Game />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/history"
                                    element={
                                        <PrivateRoute>
                                            <GameHistory />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/settings"
                                    element={
                                        <PrivateRoute>
                                            <Settings />
                                        </PrivateRoute>
                                    }
                                />
                            </Routes>
                        </div>
                    </Router>
                </SocketProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
