import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <div className="absolute top-0 w-full z-50 pt-6">
            <nav className="container relative">
                <div className="bg-landing-surface border border-landing-border rounded-full mx-auto max-w-4xl h-14 flex items-center justify-between px-6 shadow-2xl">
                    {/* Logo */}
                    <Link to="/" className="font-extrabold text-white tracking-widest text-lg ml-2">
                        LOGO
                    </Link>

                    {/* Links */}
                    <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-white uppercase tracking-widest">
                        <Link to="/" className="hover:text-landing-gray transition-colors">Home</Link>
                        <a href="#about" className="hover:text-landing-gray transition-colors">About Us</a>
                        <a href="#facts" className="hover:text-landing-gray transition-colors">Facts</a>
                        <a href="#contact" className="hover:text-landing-gray transition-colors">Contact Us</a>
                    </div>

                    {/* Login Button */}
                    <Link to="/login" className="bg-white text-black px-8 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-landing-gray transition-colors">
                        Log In
                    </Link>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
