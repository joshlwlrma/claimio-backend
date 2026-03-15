import React from 'react';

// Generates abstract, organic blob shapes matching the dark/monochrome palette
const AuthBlobBackground = () => {
    return (
        <div className="absolute inset-0 bg-landing-dark overflow-hidden z-0 pointer-events-none">
            {/* Top Left ghostly shapes */}
            <svg className="absolute -top-10 -left-10 w-96 h-96 text-white opacity-[0.03]" viewBox="0 0 200 200">
                <path fill="currentColor" stroke="none"
                    d="M33.6,-57.1C41.7,-47.5,45.2,-33.5,52.2,-19.7C59.2,-5.9,69.7,7.7,68.9,20.2C68.1,32.7,56,44.1,42.7,52.9C29.4,61.7,14.7,67.9,-0.3,68.4C-15.3,68.9,-30.7,63.7,-44,54.8C-57.3,45.9,-68.6,33.3,-72.6,18.5C-76.6,3.7,-73.3,-13.3,-64.1,-26.8C-54.9,-40.3,-39.8,-50.3,-26,-57.4C-12.2,-64.4,0.3,-68.5,13.7,-64.8C27.1,-61.1,41.4,-49.6,33.6,-57.1Z"
                    transform="translate(100 100) scale(1.1)" />
            </svg>
            <svg className="absolute top-20 left-10 w-64 h-64 text-landing-gray/10" viewBox="0 0 200 200">
                <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                    d="M 50 150 Q 100 50 150 150" />
            </svg>

            {/* Top Right large swoop */}
            <svg className="absolute -top-20 -right-20 w-[600px] h-[600px] text-white/5" viewBox="0 0 200 200">
                <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                    d="M 10 100 C 50 20, 150 20, 190 100 C 250 180, 50 180, 10 100 Z" transform="scale(0.8) translate(20, 0)" />
            </svg>

            {/* Bottom Left squiggle */}
            <svg className="absolute -bottom-32 -left-32 w-[500px] h-[500px] text-white opacity-[0.02]" viewBox="0 0 200 200">
                <path fill="currentColor" stroke="none"
                    d="M48.7,-65.8C61.3,-56.9,68.2,-40.1,72.9,-23C77.6,-5.9,80.1,11.5,74.5,27C68.9,42.5,55.2,56.1,39.6,63.4C24,70.7,6.5,71.7,-9.1,69.1C-24.7,66.5,-38.4,60.3,-50.2,50.1C-62,39.9,-71.9,25.7,-75.4,10.2C-78.9,-5.3,-76,-22.1,-66,-34.5C-56,-46.9,-38.9,-54.9,-23.4,-61.6C-7.9,-68.3,6,-73.7,21.5,-72C37,-70.3,50,-61.5,48.7,-65.8Z"
                    transform="translate(100 100) scale(1.2)" />
            </svg>
            <svg className="absolute bottom-10 left-10 w-96 h-96 text-landing-gray/10" viewBox="0 0 200 200">
                <path fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                    d="M 40 160 Q 80 80 160 160 T 280 160" transform="rotate(-30 100 100)" />
            </svg>

            {/* Bottom Right organic blob */}
            <svg className="absolute -bottom-20 -right-20 w-[600px] h-[600px] text-white opacity-[0.03]" viewBox="0 0 200 200">
                <path fill="currentColor" stroke="none"
                    d="M39.6,-62.4C49.9,-53.6,56.1,-39.3,62.8,-24.5C69.5,-9.7,76.7,5.6,73.4,19.2C70.1,32.8,56.3,44.7,42.1,51.8C27.9,58.9,13.3,61.2,-1.1,63.1C-15.5,65,-29.7,66.5,-41.8,59.8C-53.9,53.1,-63.9,38.2,-68.5,21.8C-73.1,5.4,-72.3,-12.5,-64.8,-26.8C-57.3,-41.1,-43.1,-51.8,-29.1,-58.5C-15.1,-65.2,1.3,-67.9,16,-66C30.7,-64.1,43.7,-57.6,39.6,-62.4Z"
                    transform="translate(100 100) scale(1.1) rotate(45)" />
            </svg>
        </div>
    );
};

export default AuthBlobBackground;
