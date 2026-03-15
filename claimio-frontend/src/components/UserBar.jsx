import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle, Shield } from 'lucide-react';

const UserBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
    const isAdmin = user?.role === 'admin';

    return (
        <div className="bg-landing-surface border-b border-landing-border sticky top-0 z-40">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between shadow-sm">

                {/* Logo */}
                <Link to="/dashboard" className="font-extrabold text-white tracking-widest text-lg">
                    LOGO
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Admin Panel Link (visible only for admins) */}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="hidden md:flex items-center gap-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-yellow-500/30 transition-colors"
                        >
                            <Shield size={14} />
                            <span>Admin</span>
                        </Link>
                    )}

                    <Link to="/report" className="hidden md:flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                        <PlusCircle size={16} />
                        <span>Submit Item</span>
                    </Link>

                    <div className="flex items-center gap-3 pl-4 border-l border-landing-border">
                        <Link 
                            to="/profile" 
                            className="w-8 h-8 rounded-full border border-landing-border text-white flex items-center justify-center font-bold shadow-sm hover:border-white transition-colors overflow-hidden relative group"
                            title="My Profile"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-black flex items-center justify-center">{userInitial}</div>
                            )}
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="text-landing-gray hover:text-white transition-colors p-2"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserBar;
