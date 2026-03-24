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
        }
    },
  },
  plugins: [],
}

