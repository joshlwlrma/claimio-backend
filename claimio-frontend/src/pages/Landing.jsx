import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ChevronDown, ChevronUp, Github, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import alexxImg from '../assets/alexx.webp';
import ashhImg from '../assets/ashh.webp';
import ivannImg from '../assets/ivann.webp';
import joshhImg from '../assets/joshh.webp';
import kattImg from '../assets/katt.webp';
import landingBg from '../assets/landing_page.webp';

const faqData = [
    {
        q: 'How does Claimio work?',
        a: 'Simply report a lost or found item on campus. Our system matches lost items with found ones, and admins verify claims to ensure rightful ownership.'
    },
    {
        q: 'Who can use this platform?',
        a: 'Only students and staff with valid @tip.edu.ph email accounts can sign in and use Claimio through Google OAuth.'
    },
    {
        q: 'How do I claim a found item?',
        a: 'Browse the dashboard, find your item, and submit a claim with proof of ownership. An admin will review and approve or reject your claim.'
    },
    {
        q: 'Is my information safe?',
        a: 'Yes. Sensitive details like descriptions and locations are hidden from public view. Only report owners and admins can see full details.'
    },
];

const teamMembers = [
    { name: 'Ashley Avanica', role: 'Developer', image: ashhImg },
    { name: 'Josh Michael Fangonilo', role: 'Developer', image: joshhImg },
    { name: 'Alexandra Pauline Martinez', role: 'Developer', image: alexxImg },
    { name: 'John Ivan Roxas', role: 'Developer', image: ivannImg },
    { name: 'Katherine Supan', role: 'Developer', image: kattImg },
];

const Landing = () => {
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="w-full font-sans">
            <Navbar />

            {/* Hero Section — Background Image with Dark Gradient */}
            <section
                id="hero"
                className="min-h-screen relative overflow-hidden flex items-center pt-16 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `linear-gradient(to right, rgba(13, 13, 13, 1) 0%, rgba(13, 13, 13, 0.9) 45%, rgba(13, 13, 13, 0.3) 100%), url("${landingBg}")` }}
            >
                {/* Scattered decorative items */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 right-20 w-32 h-32 bg-accent/10 rounded-2xl rotate-12 blur-sm" />
                    <div className="absolute top-40 right-60 w-20 h-20 bg-accent/5 rounded-xl -rotate-6" />
                    <div className="absolute bottom-32 right-32 w-24 h-24 bg-white/5 rounded-2xl rotate-45" />
                    <div className="absolute top-60 left-[60%] w-16 h-16 bg-accent/8 rounded-lg rotate-12" />
                    <div className="absolute bottom-20 left-[55%] w-28 h-28 bg-white/3 rounded-xl -rotate-12" />
                    <div className="absolute top-32 left-[75%] w-14 h-14 bg-accent/6 rounded-md rotate-45" />
                </div>

                <div className="container relative z-10">
                    <div className="max-w-2xl">
                        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight uppercase tracking-tight mb-6">
                            LOST SOMETHING<br />
                            <span className="text-accent">ON CAMPUS?</span>
                        </h1>
                        <p className="text-text-muted text-lg mb-10 max-w-lg leading-relaxed">
                            Claimio helps the TIP community report, find, and reclaim lost items — all in one secure platform.
                        </p>
                        <Link to="/register" className="btn-amber text-base px-10 py-3.5 inline-block">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </section>

            {/* Technologies Used — White background */}
            <section id="facts" className="bg-white py-24">
                <div className="container text-center">
                    <h2 className="text-3xl font-bold text-text-dark uppercase tracking-wider mb-4">
                        Technologies Used
                    </h2>
                    <p className="text-text-muted mb-16 max-w-lg mx-auto">
                        Built with modern, industry-standard tools for performance and reliability.
                    </p>

                    <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
                        {/* HTML5 */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <path d="M6 4L9.6 42.4L24 47L38.4 42.4L42 4H6Z" fill="#E44D26" />
                                    <path d="M24 44.1L35.4 40.9L38.4 7H24V44.1Z" fill="#F16529" />
                                    <path d="M24 20.3H17.5L17 15H24V10H11.2L11.5 13L13 30H24V25H18L18.4 29L24 30.6V25.6" fill="#EBEBEB" />
                                    <path d="M24 20.3V25H30L29.4 30L24 31.6V36.7L34.7 33.7L35.5 25L36 20.3H24Z" fill="white" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-text-dark uppercase tracking-wider mb-2">HTML5</h3>
                            <p className="text-text-muted text-sm">Semantic structure & modern web standards</p>
                        </div>

                        {/* React */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <circle cx="24" cy="24" r="4" fill="#61DAFB" />
                                    <ellipse cx="24" cy="24" rx="18" ry="7" stroke="#61DAFB" strokeWidth="1.5" fill="none" />
                                    <ellipse cx="24" cy="24" rx="18" ry="7" stroke="#61DAFB" strokeWidth="1.5" fill="none" transform="rotate(60 24 24)" />
                                    <ellipse cx="24" cy="24" rx="18" ry="7" stroke="#61DAFB" strokeWidth="1.5" fill="none" transform="rotate(120 24 24)" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-text-dark uppercase tracking-wider mb-2">React</h3>
                            <p className="text-text-muted text-sm">Component-driven UI with Vite</p>
                        </div>

                        {/* Laravel */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <svg width="44" height="44" viewBox="0 0 50 52" fill="none">
                                    <path d="M49.6 11.6C49.6 11.4 49.6 11.2 49.5 11.1C49.5 11 49.4 10.9 49.3 10.8C49.3 10.7 49.2 10.7 49.1 10.6L49 10.5L38.4 4.3C38.1 4.1 37.7 4.1 37.4 4.3L26.8 10.5L26.7 10.6C26.6 10.7 26.5 10.7 26.5 10.8C26.4 10.9 26.3 11 26.3 11.1C26.2 11.2 26.2 11.4 26.2 11.6V23.2L17.2 28.5V5.2C17.2 5 17.2 4.8 17.1 4.7C17.1 4.6 17 4.5 16.9 4.4C16.9 4.3 16.8 4.3 16.7 4.2L16.6 4.1L6 0C5.7-0.2 5.3-0.2 5 0L0.5 2.6C0.3 2.7 0.2 2.8 0.1 3C0 3.1 0 3.3 0 3.5V39C0 39.2 0 39.4 0.1 39.5C0.2 39.7 0.3 39.8 0.5 39.9L16.5 49.2C16.6 49.3 16.7 49.3 16.8 49.3C16.9 49.3 16.9 49.4 17 49.4H17.2C17.3 49.4 17.4 49.3 17.5 49.3L17.6 49.2L28.2 43C28.4 42.9 28.5 42.7 28.6 42.5C28.7 42.4 28.7 42.2 28.7 42V30.5L37.4 25.4V37.6C37.4 37.8 37.4 38 37.5 38.1C37.6 38.3 37.7 38.4 37.9 38.5L48.5 44.7C48.6 44.8 48.8 44.8 49 44.8C49.2 44.8 49.3 44.8 49.5 44.7L49.6 44.6C49.8 44.5 49.9 44.3 50 44.1C50.1 44 50.1 43.8 50.1 43.6V11.6H49.6ZM27.7 40.7L17.7 46.5L2 38.3V5.6L5.5 3.5L16.1 9.7V30.5C16.1 30.7 16.2 30.9 16.3 31L27.7 37.8V40.7ZM28.2 35.4L18.2 29.6V12.6L27.2 7.3V24.1L28.7 24.9V35.4H28.2ZM48.6 42.7L39.4 36.8V25.3L48.6 19.5V42.7Z" fill="#FF2D20" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-text-dark uppercase tracking-wider mb-2">Laravel</h3>
                            <p className="text-text-muted text-sm">RESTful API with Sanctum auth</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ — White background with dark cards */}
            <section className="bg-page py-24">
                <div className="container max-w-3xl">
                    <h2 className="text-3xl font-bold text-text-dark uppercase tracking-wider mb-4 text-center">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-text-muted mb-12 text-center">
                        Everything you need to know about Claimio.
                    </p>

                    <div className="space-y-4">
                        {faqData.map((item, index) => (
                            <div
                                key={index}
                                className="bg-card rounded-xl overflow-hidden border border-border transition-all"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <span className="font-bold text-white text-sm uppercase tracking-wider pr-4">
                                        {item.q}
                                    </span>
                                    {openFaq === index ? (
                                        <ChevronUp size={20} className="text-accent shrink-0" />
                                    ) : (
                                        <ChevronDown size={20} className="text-text-muted shrink-0" />
                                    )}
                                </button>
                                <AnimatePresence initial={false}>
                                    {openFaq === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 text-text-muted text-sm leading-relaxed border-t border-border pt-4">
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Team — White background */}
            <section id="about" className="bg-white py-24">
                <div className="container text-center">
                    <h2 className="text-3xl font-bold text-text-dark uppercase tracking-wider mb-4">
                        The Team
                    </h2>
                    <p className="text-text-muted mb-16 max-w-md mx-auto">
                        Meet the developers behind Claimio.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-4xl mx-auto">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="w-59 h-59 bg-card rounded-full overflow-hidden flex items-center justify-center mb-4 border border-border">
                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="font-bold text-text-dark text-sm uppercase tracking-wider mt-4">
                                    {member.name}
                                </h3>
                                <p className="text-text-muted text-xs mt-1">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer — Amber */}
            <footer id="contact" className="bg-accent rounded-t-3xl py-12">
                <div className="container text-center">
                    <h3 className="text-2xl font-bold text-black uppercase tracking-wider mb-4">
                        CLAIMIO
                    </h3>
                    <p className="text-black/70 text-sm max-w-md mx-auto mb-8">
                        A Lost & Found system built for the Technological Institute of the Philippines community.
                    </p>
                    <div className="flex items-center justify-center gap-6 mb-8">
                        <a href="#" className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black hover:bg-black/20 transition-colors">
                            <Mail size={18} />
                        </a>
                        <a href="#" className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black hover:bg-black/20 transition-colors">
                            <Phone size={18} />
                        </a>
                        <a href="#" className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black hover:bg-black/20 transition-colors">
                            <Github size={18} />
                        </a>
                    </div>
                    <p className="text-black/50 text-xs">
                        © 2026 Claimio. All rights reserved. TIP Manila.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
