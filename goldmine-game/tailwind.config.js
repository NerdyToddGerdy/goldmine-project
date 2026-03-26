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
            'float-up': {
                '0%':   { opacity: '1', transform: 'translateY(0)' },
                '100%': { opacity: '0', transform: 'translateY(-40px)' },
            },
            'shimmer': {
                '0%':   { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(300%)' },
            },
            'tab-enter': {
                '0%':   { opacity: '0', transform: 'translateY(6px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
            },
        },
        animation: {
            'slide-in': 'slide-in 0.2s ease-out',
            'float-up': 'float-up 1.2s ease-out forwards',
            'shimmer':  'shimmer 1.5s infinite',
            'tab-enter': 'tab-enter 180ms ease-out forwards',
        },
    },
  },
  plugins: [],
}

