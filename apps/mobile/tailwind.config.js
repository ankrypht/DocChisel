const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./modules/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#09090B', // zinc-950
        canvas: '#09090B', // zinc-950
        surface: '#18181B', // zinc-900
        surfaceElevated: '#27272A', // zinc-800
        border: '#3F3F46', // zinc-700
        borderSubtle: '#27272A', // zinc-800
        borderHover: '#52525B', // zinc-600
        primary: '#0B84FE', // Apple System Blue
        accent: '#0B84FE', // Apple System Blue
        textPrimary: '#FAFAFA', // zinc-50
        textSecondary: '#A1A1AA', // zinc-400
        textMuted: '#71717A', // zinc-500
        danger: '#EF4444', // red-500
        warning: '#F59E0B', // amber-500
        success: '#10B981', // emerald-500
        emerald: '#10B981',
        cyan: '#06B6D4',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        violet: '#A855F7',
        rose: '#F43F5E',
        amber: '#F59E0B',
        gray: colors.zinc,
      },
    },
  },
  plugins: [],
};

