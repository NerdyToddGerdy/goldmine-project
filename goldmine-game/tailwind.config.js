/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
            arcade: ['"Press Start 2P"', 'cursive']
        },
        keyframes: {
            'slide-in': {
                '0%': { opacity: '0', transform: 'translateX(100%)' },
                '100%': { opacity: '1', transform: 'translateX(0)' },
            },
        },
        animation: {
            'slide-in': 'slide-in 0.2s ease-out',
        },
    },
  },
  plugins: [],
}

