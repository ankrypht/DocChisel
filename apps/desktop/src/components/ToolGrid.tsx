import React from 'react';
import {
  TOOL_CATALOG,
  ToolMetadata,
  ToolId,
  FilterCategory,
  CATEGORY_FILTERS,
} from '@docchisel/shared';
import {
  Files,
  Split,
  LayoutGrid,
  FileImage,
  Sparkles,
  Minimize2,
  Stamp,
  Hash,
  Lock,
  Unlock,
  Crop,
} from 'lucide-react';

interface ToolGridProps {
  currentCategory: FilterCategory;
  onSelectCategory: (cat: FilterCategory) => void;
  onSelectTool: (id: ToolId) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Files,
  Split,
  LayoutGrid,
  FileImage,
  Sparkles,
  Minimize2,
  Stamp,
  Hash,
  Lock,
  Unlock,
  Crop,
};

interface ToolTheme {
  iconColor: string;
  bgSubtle: string;
  borderSubtle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  hoverBorder: string;
  hoverGlow: string;
  hoverTitle: string;
}

const TOOL_THEMES: Record<ToolId, ToolTheme> = {
  pdf_merge: {
    iconColor: 'text-primary',
    bgSubtle: 'bg-primary/15',
    borderSubtle: 'border-primary/30',
    badgeBg: 'bg-primary/15',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/35',
    hoverBorder: 'hover:border-primary/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(11,132,254,0.4)]',
    hoverTitle: 'group-hover:text-primary',
  },
  pdf_split: {
    iconColor: 'text-amber',
    bgSubtle: 'bg-amber/15',
    borderSubtle: 'border-amber/30',
    badgeBg: 'bg-amber/15',
    badgeText: 'text-amber',
    badgeBorder: 'border-amber/35',
    hoverBorder: 'hover:border-amber/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(245,158,11,0.4)]',
    hoverTitle: 'group-hover:text-amber',
  },
  pdf_organize: {
    iconColor: 'text-purple',
    bgSubtle: 'bg-purple/15',
    borderSubtle: 'border-purple/30',
    badgeBg: 'bg-purple/15',
    badgeText: 'text-purple',
    badgeBorder: 'border-purple/35',
    hoverBorder: 'hover:border-purple/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(139,92,246,0.4)]',
    hoverTitle: 'group-hover:text-purple',
  },
  pdf_compress: {
    iconColor: 'text-emerald',
    bgSubtle: 'bg-emerald/15',
    borderSubtle: 'border-emerald/30',
    badgeBg: 'bg-emerald/15',
    badgeText: 'text-emerald',
    badgeBorder: 'border-emerald/35',
    hoverBorder: 'hover:border-emerald/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(16,185,129,0.4)]',
    hoverTitle: 'group-hover:text-emerald',
  },
  pdf_watermark: {
    iconColor: 'text-violet',
    bgSubtle: 'bg-violet/15',
    borderSubtle: 'border-violet/30',
    badgeBg: 'bg-violet/15',
    badgeText: 'text-violet',
    badgeBorder: 'border-violet/35',
    hoverBorder: 'hover:border-violet/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(139,92,246,0.4)]',
    hoverTitle: 'group-hover:text-violet',
  },
  pdf_page_numbers: {
    iconColor: 'text-blue',
    bgSubtle: 'bg-blue/15',
    borderSubtle: 'border-blue/30',
    badgeBg: 'bg-blue/15',
    badgeText: 'text-blue',
    badgeBorder: 'border-blue/35',
    hoverBorder: 'hover:border-blue/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(59,130,246,0.4)]',
    hoverTitle: 'group-hover:text-blue',
  },
  pdf_protect: {
    iconColor: 'text-amber',
    bgSubtle: 'bg-amber/15',
    borderSubtle: 'border-amber/30',
    badgeBg: 'bg-amber/15',
    badgeText: 'text-amber',
    badgeBorder: 'border-amber/35',
    hoverBorder: 'hover:border-amber/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(245,158,11,0.4)]',
    hoverTitle: 'group-hover:text-amber',
  },
  pdf_unlock: {
    iconColor: 'text-teal',
    bgSubtle: 'bg-teal/15',
    borderSubtle: 'border-teal/30',
    badgeBg: 'bg-teal/15',
    badgeText: 'text-teal',
    badgeBorder: 'border-teal/35',
    hoverBorder: 'hover:border-teal/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(20,184,166,0.4)]',
    hoverTitle: 'group-hover:text-teal',
  },
  pdf_crop: {
    iconColor: 'text-orange',
    bgSubtle: 'bg-orange/15',
    borderSubtle: 'border-orange/30',
    badgeBg: 'bg-orange/15',
    badgeText: 'text-orange',
    badgeBorder: 'border-orange/35',
    hoverBorder: 'hover:border-orange/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(249,115,22,0.4)]',
    hoverTitle: 'group-hover:text-orange',
  },
  images_to_pdf: {
    iconColor: 'text-cyan',
    bgSubtle: 'bg-cyan/15',
    borderSubtle: 'border-cyan/30',
    badgeBg: 'bg-cyan/15',
    badgeText: 'text-cyan',
    badgeBorder: 'border-cyan/35',
    hoverBorder: 'hover:border-cyan/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(6,182,212,0.4)]',
    hoverTitle: 'group-hover:text-cyan',
  },
  image_studio: {
    iconColor: 'text-rose',
    bgSubtle: 'bg-rose/15',
    borderSubtle: 'border-rose/30',
    badgeBg: 'bg-rose/15',
    badgeText: 'text-rose',
    badgeBorder: 'border-rose/35',
    hoverBorder: 'hover:border-rose/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(244,63,94,0.4)]',
    hoverTitle: 'group-hover:text-rose',
  },
  image_watermark: {
    iconColor: 'text-rose',
    bgSubtle: 'bg-rose/15',
    borderSubtle: 'border-rose/30',
    badgeBg: 'bg-rose/15',
    badgeText: 'text-rose',
    badgeBorder: 'border-rose/35',
    hoverBorder: 'hover:border-rose/80',
    hoverGlow: 'hover:shadow-[0_0_28px_-4px_rgba(244,63,94,0.4)]',
    hoverTitle: 'group-hover:text-rose',
  },
};

export const ToolGrid: React.FC<ToolGridProps> = ({
  currentCategory,
  onSelectCategory,
  onSelectTool,
}) => {
  const filteredTools = TOOL_CATALOG.filter((tool) => {
    if (currentCategory === 'all') return true;
    return tool.category === currentCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Hero Intro */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary tracking-tight">
          Everything you need for PDFs & Images
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-textSecondary max-w-xl mx-auto leading-relaxed">
          Ultra-fast operations performed entirely on your device with zero cloud uploads.
        </p>
      </div>

      {/* Category Filter Chips placed below hero text like iLovePDF */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
        {CATEGORY_FILTERS.map((cat) => {
          const active = currentCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                active
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                  : 'bg-surface text-textSecondary border-border hover:text-textPrimary hover:border-borderHover hover:bg-surfaceElevated'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Responsive Grid for 15-20 tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTools.map((tool: ToolMetadata) => {
          const IconComponent = ICON_MAP[tool.iconName] || Files;
          const theme = TOOL_THEMES[tool.id] || TOOL_THEMES.pdf_merge;

          return (
            <div
              key={tool.id}
              role="button"
              tabIndex={0}
              aria-label={`Open ${tool.name} tool`}
              onClick={() => onSelectTool(tool.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTool(tool.id);
                }
              }}
              className={`group relative p-4 rounded-2xl bg-surface border border-border transition-all duration-300 cursor-pointer flex flex-col justify-between h-full min-h-[175px] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 ${theme.hoverBorder} ${theme.hoverGlow}`}
            >
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${theme.bgSubtle} border ${theme.borderSubtle} flex items-center justify-center ${theme.iconColor} group-hover:scale-105 transition-all duration-200`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {tool.badge && (
                    <span
                      className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}
                    >
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-bold text-textPrimary transition-colors ${theme.hoverTitle}`}>
                  {tool.name}
                </h3>
                <p className="text-xs text-textSecondary mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="py-12 text-center bg-surface rounded-2xl border border-border">
          <p className="text-textSecondary text-sm font-medium">
            No tools in this category
          </p>
        </div>
      )}
    </div>
  );
};
