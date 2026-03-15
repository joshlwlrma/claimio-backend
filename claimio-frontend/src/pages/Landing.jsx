import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Layers, Box, Database } from 'lucide-react';

const Landing = () => {
    return (
        <div className="w-full font-sans bg-landing-dark min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="min-h-[90vh] flex items-center relative pt-20">
                <div className="container relative z-10 grid md:grid-cols-2 gap-12 items-center">

                    {/* Left Text */}
                    <div className="text-white max-w-xl pr-8">
                        <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight tracking-tight uppercase">
                            BIG TEXT FONT<br />BLAH BLAH
                        </h1>
                        <p className="text-landing-gray mb-10 leading-relaxed text-sm md:text-base pr-12">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Ut eu felis turpis. Praesent efficitur posuere quam, sit
                            amet fermentum augue ullamcorper vel.
                        </p>
                        <Link to="/login" className="bg-white text-black font-bold uppercase text-sm px-10 py-3 rounded-md hover:opacity-80 transition-opacity inline-block tracking-widest">
                            SIGN IN
                        </Link>
                    </div>

                    {/* Right Image Placeholder (Black image per user request) */}
                    <div className="relative w-full h-[400px] bg-black border border-landing-border rounded-lg flex flex-col items-center justify-center text-landing-gray">
                        <div className="bg-white/5 w-32 h-8 rounded mb-4"></div> {/* Mock label */}
                        <span className="text-sm uppercase tracking-widest font-semibold">Placeholder</span>
                    </div>

                </div>
            </section>

            {/* About Section */}
            <section id="about" className="bg-landing-surface py-24 border-t border-b border-landing-border">
                <div className="container">
                    <h2 className="text-white text-3xl font-extrabold mb-10 tracking-widest uppercase">ABOUT US</h2>
                    <div className="grid md:grid-cols-2 gap-12 max-w-4xl text-landing-gray text-sm leading-relaxed">
                        <p>
                            Lorem ipsum dolor sit amet consectetur<br />
                            adipiscing elit. Quisque faucibus ex sapien vitae<br />
                            pellentesque sem placerat. In id cursus mi<br />
                            pretium  tellus duis convallis. Tempus leo eu<br />
                            aenean sed diam urna tempor.
                            <br /><br />
                            Lorem ipsum dolor sit amet consectetur<br />
                            adipiscing elit. Quisque faucibus ex sapien vitae<br />
                            pellentesque sem placerat. In id cursus mi<br />
                            pretium  tellus duis convallis. Tempus leo eu<br />
                            aenean sed diam urna tempor.
                        </p>
                        <p className="hidden md:block"></p>
                    </div>
                </div>
            </section>

            {/* Technologies Section */}
            <section id="facts" className="bg-landing-dark py-24">
                <div className="container text-center">
                    <h2 className="text-white text-3xl font-extrabold mb-20 tracking-wider uppercase">TECHNOLOGIES USED</h2>

                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {/* Tech 1 */}
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-landing-surface border border-landing-border rounded-full flex items-center justify-center mb-8 shadow-2xl">
                                <Layers className="text-white" size={60} strokeWidth={1.5} />
                            </div>
                            <p className="text-xs text-landing-gray leading-relaxed px-4">
                                Lorem ipsum dolor sit amet consectetur<br />
                                adipiscing elit. Quisque faucibus ex<br />
                                sapien vitae pellentesque sem placerat.<br />
                                In id cursus mi pretium tellus duis<br />
                                convallis. Tempus leo eu aenean sed<br />
                                diam urna tempor.
                            </p>
                        </div>
                        {/* Tech 2 */}
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-landing-surface border border-landing-border rounded-full flex items-center justify-center mb-8 shadow-2xl">
                                <Box className="text-white" size={60} strokeWidth={1.5} />
                            </div>
                            <p className="text-xs text-landing-gray leading-relaxed px-4">
                                Lorem ipsum dolor sit amet consectetur<br />
                                adipiscing elit. Quisque faucibus ex<br />
                                sapien vitae pellentesque sem placerat.<br />
                                In id cursus mi pretium tellus duis<br />
                                convallis. Tempus leo eu aenean sed<br />
                                diam urna tempor.
                            </p>
                        </div>
                        {/* Tech 3 */}
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-landing-surface border border-landing-border rounded-full flex items-center justify-center mb-8 shadow-2xl">
                                <Database className="text-white" size={60} strokeWidth={1.5} />
                            </div>
                            <p className="text-xs text-landing-gray leading-relaxed px-4">
                                Lorem ipsum dolor sit amet consectetur<br />
                                adipiscing elit. Quisque faucibus ex<br />
                                sapien vitae pellentesque sem placerat.<br />
                                In id cursus mi pretium tellus duis<br />
                                convallis. Tempus leo eu aenean sed<br />
                                diam urna tempor.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black border-t border-landing-border text-center text-[10px] text-landing-gray py-12">
                <p>
                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi<br />
                    pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor.
                </p>
            </footer>
        </div>
    );
};

export default Landing;
