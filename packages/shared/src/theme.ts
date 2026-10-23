export const COLORS = {
  background: '#09090B', // zinc-950
  surface: '#18181B', // zinc-900
  surfaceElevated: '#27272A', // zinc-800
  border: '#3F3F46', // zinc-700
  borderSubtle: '#27272A', // zinc-800
  borderHover: '#52525B', // zinc-600
  primary: '#0B84FE', // Apple System Blue
  textPrimary: '#FAFAFA', // zinc-50
  textSecondary: '#A1A1AA', // zinc-400
  textMuted: '#71717A', // zinc-500
  danger: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  textOnPrimary: '#FFFFFF',
  shadow: '#000000',
  // Semantic accents
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
} as const;

export type ThemeColors = typeof COLORS;

import type { ToolId } from './types';

export interface ToolThemeDefinition {
  iconColor: string;
  hexColor: string;
  bgSubtle: string;
  borderSubtle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  hoverBorder?: string;
  hoverGlow?: string;
}

export const TOOL_THEMES: Record<ToolId, ToolThemeDefinition> = {
  pdf_merge: {
    iconColor: 'text-primary',
    hexColor: '#0B84FE',
    bgSubtle: 'bg-primary/10',
    borderSubtle: 'border-primary/25',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/30',
    hoverBorder: 'hover:border-primary/60',
    hoverGlow: 'hover:shadow-primary/10',
  },
  pdf_split: {
    iconColor: 'text-amber',
    hexColor: '#F59E0B',
    bgSubtle: 'bg-amber/10',
    borderSubtle: 'border-amber/25',
    badgeBg: 'bg-amber/10',
    badgeText: 'text-amber',
    badgeBorder: 'border-amber/30',
    hoverBorder: 'hover:border-amber/60',
    hoverGlow: 'hover:shadow-amber/10',
  },
  pdf_organize: {
    iconColor: 'text-purple',
    hexColor: '#8B5CF6',
    bgSubtle: 'bg-purple/10',
    borderSubtle: 'border-purple/25',
    badgeBg: 'bg-purple/10',
    badgeText: 'text-purple',
    badgeBorder: 'border-purple/30',
    hoverBorder: 'hover:border-purple/60',
    hoverGlow: 'hover:shadow-purple/10',
  },
  pdf_compress: {
    iconColor: 'text-emerald',
    hexColor: '#10B981',
    bgSubtle: 'bg-emerald/10',
    borderSubtle: 'border-emerald/25',
    badgeBg: 'bg-emerald/10',
    badgeText: 'text-emerald',
    badgeBorder: 'border-emerald/30',
    hoverBorder: 'hover:border-emerald/60',
    hoverGlow: 'hover:shadow-emerald/10',
  },
  pdf_watermark: {
    iconColor: 'text-violet',
    hexColor: '#8B5CF6',
    bgSubtle: 'bg-violet/10',
    borderSubtle: 'border-violet/25',
    badgeBg: 'bg-violet/10',
    badgeText: 'text-violet',
    badgeBorder: 'border-violet/30',
    hoverBorder: 'hover:border-violet/60',
    hoverGlow: 'hover:shadow-violet/10',
  },
  pdf_page_numbers: {
    iconColor: 'text-blue',
    hexColor: '#3B82F6',
    bgSubtle: 'bg-blue/10',
    borderSubtle: 'border-blue/25',
    badgeBg: 'bg-blue/10',
    badgeText: 'text-blue',
    badgeBorder: 'border-blue/30',
    hoverBorder: 'hover:border-blue/60',
    hoverGlow: 'hover:shadow-blue/10',
  },
  pdf_protect: {
    iconColor: 'text-amber',
    hexColor: '#F59E0B',
    bgSubtle: 'bg-amber/10',
    borderSubtle: 'border-amber/25',
    badgeBg: 'bg-amber/10',
    badgeText: 'text-amber',
    badgeBorder: 'border-amber/30',
    hoverBorder: 'hover:border-amber/60',
    hoverGlow: 'hover:shadow-amber/10',
  },
  pdf_unlock: {
    iconColor: 'text-teal',
    hexColor: '#14B8A6',
    bgSubtle: 'bg-teal/10',
    borderSubtle: 'border-teal/25',
    badgeBg: 'bg-teal/10',
    badgeText: 'text-teal',
    badgeBorder: 'border-teal/30',
    hoverBorder: 'hover:border-teal/60',
    hoverGlow: 'hover:shadow-teal/10',
  },
  pdf_crop: {
    iconColor: 'text-orange',
    hexColor: '#F97316',
    bgSubtle: 'bg-orange/10',
    borderSubtle: 'border-orange/25',
    badgeBg: 'bg-orange/10',
    badgeText: 'text-orange',
    badgeBorder: 'border-orange/30',
    hoverBorder: 'hover:border-orange/60',
    hoverGlow: 'hover:shadow-orange/10',
  },
  images_to_pdf: {
    iconColor: 'text-cyan',
    hexColor: '#06B6D4',
    bgSubtle: 'bg-cyan/10',
    borderSubtle: 'border-cyan/25',
    badgeBg: 'bg-cyan/10',
    badgeText: 'text-cyan',
    badgeBorder: 'border-cyan/30',
    hoverBorder: 'hover:border-cyan/60',
    hoverGlow: 'hover:shadow-cyan/10',
  },
  image_studio: {
    iconColor: 'text-rose',
    hexColor: '#F43F5E',
    bgSubtle: 'bg-rose/10',
    borderSubtle: 'border-rose/25',
    badgeBg: 'bg-rose/10',
    badgeText: 'text-rose',
    badgeBorder: 'border-rose/30',
    hoverBorder: 'hover:border-rose/60',
    hoverGlow: 'hover:shadow-rose/10',
  },
  image_watermark: {
    iconColor: 'text-rose',
    hexColor: '#F43F5E',
    bgSubtle: 'bg-rose/10',
    borderSubtle: 'border-rose/25',
    badgeBg: 'bg-rose/10',
    badgeText: 'text-rose',
    badgeBorder: 'border-rose/30',
    hoverBorder: 'hover:border-rose/60',
    hoverGlow: 'hover:shadow-rose/10',
  },
};
