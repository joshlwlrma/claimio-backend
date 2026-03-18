/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                page: '#F5F5F5',
                dark: '#0D0D0D',
                card: '#1A1A1A',
                'card-alt': '#2A2A2A',
                accent: '#F5A623',
                'accent-dark': '#D4891A',
                'text-light': '#FFFFFF',
                'text-dark': '#1A1A1A',
                'text-muted': '#9A9A9A',
                border: '#2E2E2E',
                // Keep legacy aliases for anything that might reference them
                landing: {
                    dark: '#0D0D0D',
                    gray: '#9A9A9A',
                    border: '#2E2E2E',
                    surface: '#1A1A1A',
                    accent: '#F5A623',
                },
            },
            fontFamily: {
                sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                heading: ['"Playfair Display"', 'serif'],
            },
        },
    },
    plugins: [],
}
