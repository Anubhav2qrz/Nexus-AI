/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      colors: {
        // Custom palette — deep navy + electric teal + warm amber
        surface: {
          50:  '#f8fafc',
          100: '#f0f4f8',
          200: '#dde6f0',
          800: '#111827',
          850: '#0d1421',
          900: '#090e18',
          950: '#05080f',
        },
        accent: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-dark': `
          radial-gradient(at 20% 20%, hsla(189, 85%, 20%, 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 80%, hsla(270, 40%, 15%, 0.3) 0px, transparent 50%),
          radial-gradient(at 50% 50%, hsla(210, 60%, 8%, 1) 0px, transparent 100%)
        `,
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'typing': 'typing 1.2s steps(3, end) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        typing: {
          '0%, 100%': { content: '.' },
          '33%': { content: '..' },
          '66%': { content: '...' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.15)',
        'glow-teal-lg': '0 0 40px rgba(20, 184, 166, 0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
