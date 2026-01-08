/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gray: {
                    750: '#2d3748',
                    850: '#1a202c',
                    950: '#0d1117',
                },
                vibepos: {
                    base: '#f8fafc', // Slate 50 (App Background)
                    surface: '#ffffff', // White (Cards/Panels)
                    primary: '#2496ed', // Docker Blue (Main Buttons/Actions)
                    secondary: '#64748b', // Slate 500 (Secondary Text/Icons)
                    accent: '#e0f2fe', // Sky 100 (Active States/Highlights)
                    dark: '#0f172a', // Slate 900 (Main Text)
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
