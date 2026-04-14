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
            display: ['"Rye"', 'serif'],
            body:    ['"Special Elite"', 'serif'],
        },
        colors: {
            frontier: {
                parchment: '#f0e0b6',
                aged:      '#d4b896',
                hide:      '#8b6914',
                rust:      '#7a3b1e',
                coal:      '#1c1208',
                ember:     '#c87941',
                nugget:    '#c9960c',
                dirt:      '#5c4033',
                dust:      '#9b8060',
                pine:      '#2d4a1e',
                sage:      '#4a6741',
                iron:      '#3a3530',
                bone:      '#ede0c4',
            },
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
            'celebration-fade': {
                '0%':   { opacity: '0' },
                '12%':  { opacity: '1' },
                '75%':  { opacity: '1' },
                '100%': { opacity: '0' },
            },
            'celebration-pop': {
                '0%':   { opacity: '0', transform: 'scale(0.4)' },
                '55%':  { opacity: '1', transform: 'scale(1.08)' },
                '75%':  { transform: 'scale(1)' },
                '90%':  { opacity: '1' },
                '100%': { opacity: '0', transform: 'scale(0.95)' },
            },
        },
        animation: {
            'slide-in':        'slide-in 0.2s ease-out',
            'float-up':        'float-up 1.2s ease-out forwards',
            'shimmer':         'shimmer 1.5s infinite',
            'tab-enter':       'tab-enter 180ms ease-out forwards',
            'celebration-fade': 'celebration-fade 2.4s ease-in-out forwards',
            'celebration-pop':  'celebration-pop 2.4s ease-in-out forwards',
        },
    },
  },
  plugins: [],
}

