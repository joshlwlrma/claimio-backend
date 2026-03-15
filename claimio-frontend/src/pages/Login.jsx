import React from 'react';
import { Link } from 'react-router-dom';
import AuthBlobBackground from '../components/AuthBlobBackground';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8000/api/auth/google/redirect';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-landing-dark p-4 relative overflow-hidden font-sans">
            <AuthBlobBackground />

            <div className="w-full max-w-[900px] min-h-[500px] flex flex-col md:flex-row rounded-[2rem] overflow-hidden shadow-2xl z-10 relative border border-landing-border">

                {/* Left Side: Sign In */}
                <div className="w-full md:w-3/5 bg-landing-surface p-10 lg:p-14 flex flex-col justify-center items-center relative z-10">

                    <h2 className="text-[32px] font-extrabold text-white mb-3">Sign in to Claimio</h2>

                    <p className="text-sm text-landing-gray mb-8 font-medium text-center max-w-xs leading-relaxed">
                        Use your TIP Google account to access the Lost &amp; Found system.
                    </p>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="flex items-center gap-3 bg-white text-black font-bold text-sm px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    <div className="flex items-center gap-2 mt-8 text-xs text-landing-gray bg-landing-dark/50 border border-landing-border rounded-lg px-4 py-2.5">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span>Only <strong className="text-white">@tip.edu.ph</strong> accounts are accepted</span>
                    </div>

                </div>

                {/* Right Side: Welcome Panel */}
                <div className="w-full md:w-2/5 bg-black p-12 flex flex-col justify-center items-center text-center relative z-10 border-l border-landing-border">
                    <h3 className="text-3xl font-extrabold text-white mb-6 tracking-wide">Welcome Back!</h3>
                    <p className="text-landing-gray text-sm leading-relaxed mb-10 px-4 max-w-xs">
                        Report lost items, claim found ones,<br />and help the TIP community reconnect<br />with what matters.
                    </p>
                    <Link to="/register" className="bg-transparent border border-white text-white font-semibold text-sm px-10 py-3 rounded-xl hover:bg-white hover:text-black transition-colors uppercase tracking-wider">
                        SIGN UP
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default Login;
