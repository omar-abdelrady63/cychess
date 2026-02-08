import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import MainLayout from './components/MainLayout';
import NotificationPopup from './components/NotificationPopup';
import GameRejoinHandler from './components/GameRejoinHandler';
import { NotificationProvider } from './context/NotificationContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Game from './pages/Game';
import GameHistory from './pages/GameHistory';
import GameAnalysis from './pages/GameAnalysis';
import Settings from './pages/Settings';
import Themes from './pages/Themes';
import TournamentLobby from './pages/TournamentLobby';
import TournamentDashboard from './pages/TournamentDashboard';
import PublicProfile from './pages/PublicProfile';
import PrivateRoute from './components/PrivateRoute';

import ActiveGames from './pages/dashboard/ActiveGames';
import Tournaments from './pages/dashboard/Tournaments';
import Friends from './pages/dashboard/Friends';
import Analysis from './pages/dashboard/Analysis';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <SocketProvider>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <NotificationProvider>
                            <GameRejoinHandler />
                            <div className="min-h-screen flex flex-col bg-primary text-text-primary transition-colors duration-200">
                                <NotificationPopup />
                                <Routes>
                                    <Route path="/" element={<><Navbar /><Landing /></>} />
                                    <Route path="/login" element={<><Navbar /><Login /></>} />
                                    <Route path="/register" element={<><Navbar /><Register /></>} />
                                    <Route path="/verify" element={<><Navbar /><Verify /></>} />

                                    <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                                        <Route path="/dashboard" element={<ActiveGames />} />
                                        <Route path="/dashboard/tournaments" element={<Tournaments />} />
                                        <Route path="/dashboard/friends" element={<Friends />} />
                                        <Route path="/dashboard/analysis" element={<Analysis />} />

                                        <Route path="/dashboard/history" element={<GameHistory />} />
                                        <Route path="/themes" element={<Themes />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/profile/:username" element={<PublicProfile />} />

                                        <Route path="/game/:roomId" element={<Game />} />
                                        <Route path="/analysis" element={<GameAnalysis />} />
                                        <Route path="/game/:gameId/analysis" element={<GameAnalysis />} />

                                        <Route path="/tournament/:tournamentId/lobby" element={<TournamentLobby />} />
                                        <Route path="/tournament/:tournamentId" element={<TournamentDashboard />} />

                                        <Route path="/history" element={<Navigate to="/dashboard/history" replace />} />
                                    </Route>
                                </Routes>
                            </div>
                        </NotificationProvider>
                    </Router>
                </SocketProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
