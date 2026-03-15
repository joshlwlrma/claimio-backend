/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Monochrome / Dark color palette as requested
                landing: {
                    dark: '#0a0a0a',     // Deepest black for backgrounds
                    gray: '#949494',     // Mid-gray for secondary sections
                    border: 'rgba(255,255,255,0.1)', // Subtle borders
                    surface: '#121212',  // Slightly elevated card background
                    accent: '#ffffff',   // White for buttons/text
                }
            },
            fontFamily: {
                sans: ['"Playfair Display"', 'ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
            }
        },
    },
    plugins: [],
}
