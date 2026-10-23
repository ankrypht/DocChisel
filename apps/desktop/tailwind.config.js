import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // User-specified Apple & Zinc palette
        background: '#09090B', // zinc-950
        canvas: '#09090B', // zinc-950
        surface: {
          DEFAULT: '#18181B', // zinc-900
          elevated: '#27272A', // zinc-800
          hover: '#27272A', // zinc-800
          active: '#3F3F46', // zinc-700
          muted: '#27272A', // zinc-800
        },
        surfaceElevated: '#27272A', // zinc-800
        border: {
          DEFAULT: '#3F3F46', // zinc-700
          subtle: '#27272A', // zinc-800
          hover: '#52525B', // zinc-600
          focus: '#0B84FE', // Apple System Blue
        },
        primary: {
          DEFAULT: '#0B84FE', // Apple System Blue
          hover: '#0077ED',
          text: '#FFFFFF',
        },
        textPrimary: '#FAFAFA', // zinc-50
        textSecondary: '#A1A1AA', // zinc-400
        textMuted: '#71717A', // zinc-500
        danger: '#EF4444', // red-500
        warning: '#F59E0B', // amber-500
        textOnPrimary: '#FFFFFF',
        shadow: '#000000',

        // Semantic Accents
        emerald: '#10B981',
        cyan: '#06B6D4',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        violet: '#A855F7',
        rose: '#F43F5E',
        amber: '#F59E0B',
        teal: '#14B8A6',
        orange: '#F97316',
        yellow: '#EAB308',

        // Brand Aliases (maps all components seamlessly)
        brand: {
          indigo: '#0B84FE', // Apple System Blue
          blue: '#3B82F6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          purple: '#8B5CF6',
          violet: '#A855F7',
          rose: '#F43F5E',
          amber: '#F59E0B',
          teal: '#14B8A6',
          orange: '#F97316',
          yellow: '#EAB308',
        },

        // Map general gray to zinc for full UI harmony
        gray: colors.zinc,
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
