/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1fe',
          100: '#e9e4fd',
          200: '#d4cdfc',
          300: '#b5a9f8',
          400: '#917df4',
          500: '#7657ee',
          600: '#5D3FD3', // Main primary
          700: '#4f2ac1',
          800: '#41249e',
          900: '#38227e',
          950: '#201356',
        },
        accent: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6B6B', // Main accent
          500: '#f83b3b',
          600: '#e51d1d',
          700: '#c11414',
          800: '#a01414',
          900: '#841818',
          950: '#480707',
        },
        battle: {
          blue: '#4169E1',
          red: '#E14169',
        },
        gaming: {
          dark: '#1F2033',
          card: '#2A2C42',
          light: '#F5F5FF',
        }
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
        body: ['system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'battle-shake': 'battleShake 0.5s ease-in-out',
        'sword-swing': 'swordSwing 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        battleShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-5px)' },
        },
        swordSwing: {
          '0%': { 
            transform: 'translateX(0) rotate(0deg) scaleX(-1)' 
          },
          '20%': { 
            transform: 'translateX(-10px) rotate(-30deg) scaleX(-1)' 
          },
          '25%': { 
            transform: 'translateX(15px) rotate(45deg) scaleX(-1)' 
          },
          '35%': { 
            transform: 'translateX(0) rotate(0deg) scaleX(-1)' 
          },
          '55%': { 
            transform: 'translateX(10px) rotate(30deg) scaleX(-1)' 
          },
          '60%': { 
            transform: 'translateX(-15px) rotate(-45deg) scaleX(-1)' 
          },
          '70%': { 
            transform: 'translateX(0) rotate(0deg) scaleX(-1)' 
          },
          '100%': { 
            transform: 'translateX(0) rotate(0deg) scaleX(-1)' 
          }
        },
      },
    },
  },
  plugins: [],
};