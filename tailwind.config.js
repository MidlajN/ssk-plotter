/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        gradientMove: 'gradientMove 2s linear infinite'
      },
      keyframes: {
        gradientMove: {
          '0%': { backgroundPosition: '100% 0%' },
          '50%': { backgroundPosition: '00% 0%' },
          '100%': { backgroundPosition: '-100% 0%' }
        }
      }
    },
  },
  plugins: [],
}