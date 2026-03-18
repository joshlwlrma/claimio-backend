import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle } from 'lucide-react';

const UserBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
    const isAdmin = user?.role === 'admin';

    const isActive = (path) => location.pathname === path;

    return (
        <div className="bg-dark sticky top-0 z-40">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link to="/dashboard" className="font-bold text-white tracking-widest text-xl uppercase">
                    CLAIMIO
                </Link>

                {/* Center Tabs (admin only) */}
                {isAdmin && (
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            to="/dashboard"
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/dashboard')
                                    ? 'bg-accent text-black'
                                    : 'text-text-muted hover:text-white'
                                }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/admin"
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/admin')
                                    ? 'bg-accent text-black'
                                    : 'text-text-muted hover:text-white'
                                }`}
                        >
                            Reports
                        </Link>
                    </div>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/report"
                        className="hidden md:flex items-center gap-2 btn-amber text-xs px-5 py-2"
                    >
                        <PlusCircle size={15} />
                        <span>Submit Item</span>
                    </Link>

                    {/* Avatar */}
                    <Link
                        to="/profile"
                        className="w-9 h-9 rounded-full border-2 border-border text-white flex items-center justify-center font-bold overflow-hidden hover:border-accent transition-colors"
                        title="My Profile"
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-card flex items-center justify-center text-sm">
                                {userInitial}
                            </div>
                        )}
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="text-text-muted hover:text-white transition-colors p-2"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UserBar;
