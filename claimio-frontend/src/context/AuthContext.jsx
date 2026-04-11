import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('claimio_token'));
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // When the app loads, check if there's a token in the URL (from Google OAuth callback)
    // or verify the existing token in localStorage
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');

        if (urlToken) {
            // We just logged in via Google OAuth
            setSession(urlToken);
            // Clean up the URL and redirect to dashboard
            navigate('/dashboard', { replace: true });
        } else if (token) {
            // We have a stored token, let's verify it
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const setSession = (newToken, userData = null) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem('claimio_token', newToken);
            if (userData) {
                setUser(userData);
            } else {
                verifyToken(); // Fetch user data if we only have the token
            }
        } else {
            localStorage.removeItem('claimio_token');
            setUser(null);
        }
    };

    const verifyToken = async () => {
        try {
            const { data } = await api.get('/user');
            setUser(data);
        } catch (error) {
            console.error('Token verification failed:', error);
            setSession(null); // Clear invalid token
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, loading, logout, setSession }}>
            {children}
        </AuthContext.Provider>
    );
};
