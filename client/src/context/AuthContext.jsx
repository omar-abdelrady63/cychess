import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/auth/me`);
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            identifier,
            password
        });
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return response.data;
    };

    const register = async (username, email, password) => {
        const response = await axios.post(`${API_URL}/api/auth/register`, {
            username,
            email,
            password
        });
        return response.data;
    };

    const verify = async (email, code) => {
        const response = await axios.post(`${API_URL}/api/auth/verify`, {
            email,
            code
        });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        verify,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
