import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8000/api/auth/google/redirect';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-page p-4 relative overflow-hidden">
            {/* Scattered decorative shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-16 left-16 w-20 h-20 bg-accent/10 rounded-xl rotate-12" />
                <div className="absolute top-40 right-24 w-16 h-16 bg-card/20 rounded-lg -rotate-6" />
                <div className="absolute bottom-24 left-32 w-24 h-24 bg-accent/5 rounded-2xl rotate-45" />
                <div className="absolute bottom-40 right-16 w-14 h-14 bg-card/10 rounded-md rotate-12" />
                <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-accent/8 rounded rotate-6" />
                <div className="absolute top-20 left-1/2 w-18 h-18 bg-card/5 rounded-xl -rotate-12" />
            </div>

            <div className="w-full max-w-[900px] min-h-[500px] flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl z-10 relative">

                {/* Left Side: Sign In (White) */}
                <div className="w-full md:w-3/5 bg-white p-10 lg:p-14 flex flex-col justify-center items-center">

                    <h2 className="text-3xl font-bold text-text-dark mb-3 uppercase tracking-wide">
                        Sign in to Claimio
                    </h2>

                    <p className="text-sm text-text-muted mb-8 text-center max-w-xs leading-relaxed">
                        Use your TIP Google account to access the Lost & Found system.
                    </p>

                    {/* Google G Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-6 hover:bg-accent-dark transition-colors shadow-lg"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                            <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    </button>

                    <div className="flex items-center gap-2 mb-8 text-xs text-text-muted bg-page rounded-lg px-4 py-2.5">
                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        <span>Only <strong className="text-text-dark">@tip.edu.ph</strong> accounts are accepted</span>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="btn-amber px-12 py-3"
                    >
                        Sign In
                    </button>
                </div>

                {/* Right Side: Welcome Panel (Dark) */}
                <div className="w-full md:w-2/5 bg-card p-12 flex flex-col justify-center items-center text-center">
                    <h3 className="text-3xl font-bold text-white mb-6 uppercase tracking-wide">
                        Welcome Back!
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-10 px-4 max-w-xs">
                        Report lost items, claim found ones, and help the TIP community reconnect with what matters.
                    </p>
                    <Link
                        to="/register"
                        className="btn-amber px-10 py-2.5"
                    >
                        Sign Up
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default Login;
