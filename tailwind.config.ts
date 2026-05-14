import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#1A1A1A',
        'surface-2': '#242424',
        border: '#2A2A2A',
        'border-subtle': '#1E1E1E',
        orange: {
          DEFAULT: '#FF5C00',
          50: '#FFF2EC',
          100: '#FFE4D5',
          200: '#FFC9AA',
          300: '#FFAD80',
          400: '#FF8C55',
          500: '#FF5C00',
          600: '#CC4A00',
          700: '#993800',
          800: '#662500',
          900: '#331300',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#0D0D0E',
        },
        chain: {
          eth: '#627EEA',
          sol: '#9945FF',
          bnb: '#F3BA2F',
          matic: '#8247E5',
          arb: '#28A0F0',
          base: '#0052FF',
          avax: '#E84142',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        grotesk: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'orange-gradient': 'linear-gradient(135deg, #FF5C00 0%, #FF8C00 100%)',
        'orange-glow': 'radial-gradient(ellipse at 50% 50%, rgba(255,92,0,0.15) 0%, transparent 70%)',
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        'orange-sm': '0 0 10px rgba(255,92,0,0.2)',
        'orange-md': '0 0 20px rgba(255,92,0,0.3)',
        'orange-lg': '0 0 40px rgba(255,92,0,0.4)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5), 0 0 20px rgba(255,92,0,0.15)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 4s infinite',
        'pulse-orange': 'pulse-orange 2s ease-in-out infinite',
        'count-up': 'count-up 0.6s ease-out forwards',
        'fill-bar': 'fill-bar 0.8s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-orange': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fill-bar': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--fill-width)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;
