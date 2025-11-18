import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Modern dark theme with professional gradients
        dark: {
          1: '#0F172A', // Slate 900 - Primary dark
          2: '#1E293B', // Slate 800 - Secondary dark
          3: '#334155', // Slate 700 - Tertiary dark
          4: '#475569', // Slate 600 - Accent dark
        },
        // Professional blue palette
        blue: {
          1: '#3B82F6', // Blue 500 - Primary
          2: '#2563EB', // Blue 600 - Hover
          3: '#1D4ED8', // Blue 700 - Active
          4: '#60A5FA', // Blue 400 - Light
        },
        // Clean sky/light palette
        sky: {
          1: '#E0F2FE', // Sky 100
          2: '#BAE6FD', // Sky 200
          3: '#F0F9FF', // Sky 50
        },
        // Accent colors
        orange: {
          1: '#F97316', // Orange 500
          2: '#EA580C', // Orange 600
        },
        purple: {
          1: '#8B5CF6', // Violet 500
          2: '#7C3AED', // Violet 600
        },
        yellow: {
          1: '#FBBF24', // Amber 400
          2: '#F59E0B', // Amber 500
        },
        // Success and error states
        success: {
          1: '#10B981', // Emerald 500
          2: '#059669', // Emerald 600
        },
        error: {
          1: '#EF4444', // Red 500
          2: '#DC2626', // Red 600
        },
        // Neutral grays
        gray: {
          1: '#F8FAFC', // Slate 50
          2: '#F1F5F9', // Slate 100
          3: '#E2E8F0', // Slate 200
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      backgroundImage: {
        hero: "url('/images/hero-background.png')",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
