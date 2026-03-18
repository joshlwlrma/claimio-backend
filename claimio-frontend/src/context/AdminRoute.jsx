import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * AdminRoute
 *
 * Route guard that only allows users with role === 'admin'.
 * Students and unauthenticated users are redirected to /dashboard.
 */
export const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    console.log('AdminRoute executing, user:', user, 'loading:', loading);

    if (loading) {
        console.log('AdminRoute: still loading auth...');
        return (
            <div className="min-h-screen bg-landing-dark flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user) {
        console.log('AdminRoute: no user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin') {
        console.log('AdminRoute: user is not admin, role is:', user.role, 'redirecting to dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    console.log('AdminRoute: user is admin, rendering children');
    return children;
};
