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
        // Google Meet / Zoom inspired color palette
        // Light theme backgrounds (Google Meet style)
        light: {
          1: '#FFFFFF', // Pure white
          2: '#F8F9FA', // Light gray background
          3: '#F1F3F4', // Subtle gray
          4: '#E8EAED', // Border gray
        },
        // Google Blue palette (primary brand color)
        google: {
          blue: '#1A73E8', // Google Blue primary
          'blue-dark': '#1557B0', // Darker blue for hover
          'blue-light': '#4285F4', // Lighter blue
          green: '#34A853', // Google Green (success)
          yellow: '#FBBC04', // Google Yellow
          red: '#EA4335', // Google Red (error)
        },
        // Zoom Blue palette
        zoom: {
          blue: '#0E72ED', // Zoom Blue
          'blue-dark': '#0B5BC4', // Darker blue
          'blue-light': '#3B8FF5', // Lighter blue
        },
        // Meeting room dark theme (for video calls)
        meeting: {
          dark: '#202124', // Google Meet dark background
          'dark-2': '#2D2E30', // Secondary dark
          'dark-3': '#3C4043', // Tertiary dark
          overlay: 'rgba(0, 0, 0, 0.5)', // Overlay
        },
        // Accent colors
        accent: {
          primary: '#1A73E8', // Primary accent (Google Blue)
          secondary: '#34A853', // Success/Green
          warning: '#FBBC04', // Warning/Yellow
          error: '#EA4335', // Error/Red
        },
        // Text colors
        text: {
          primary: '#202124', // Primary text (dark)
          secondary: '#5F6368', // Secondary text (gray)
          tertiary: '#80868B', // Tertiary text (light gray)
          inverse: '#FFFFFF', // White text for dark backgrounds
        },
        // Legacy dark theme (for backward compatibility)
        dark: {
          1: '#202124', // Updated to Google Meet dark
          2: '#2D2E30', // Updated
          3: '#3C4043', // Updated
          4: '#5F6368', // Updated
        },
        // Legacy blue (mapped to Google Blue)
        blue: {
          1: '#1A73E8', // Google Blue
          2: '#1557B0', // Darker
          3: '#0E72ED', // Zoom Blue variant
          4: '#4285F4', // Light
        },
        // Success and error (Google colors)
        success: {
          1: '#34A853', // Google Green
          2: '#2E7D32', // Darker green
        },
        error: {
          1: '#EA4335', // Google Red
          2: '#C5221F', // Darker red
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
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'fade-in-down': 'fade-in-down 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      backgroundImage: {
        hero: "url('/images/hero-background.png')",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
