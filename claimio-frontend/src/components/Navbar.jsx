import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full z-50 bg-dark">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="font-bold text-white tracking-widest text-xl uppercase">
                    CLAIMIO
                </Link>

                {/* Center Links */}
                <div className="hidden md:flex items-center gap-8 text-[12px] font-bold text-white uppercase tracking-widest">
                    <a href="#hero" className="hover:text-accent transition-colors">Home</a>
                    <a href="#facts" className="hover:text-accent transition-colors">Facts</a>
                    <a href="#about" className="hover:text-accent transition-colors">About Us</a>
                    <a href="#contact" className="hover:text-accent transition-colors">Contact Us</a>
                </div>

                {/* Login Button */}
                <Link
                    to="/login"
                    className="btn-amber text-xs px-8 py-2"
                >
                    Log In
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
