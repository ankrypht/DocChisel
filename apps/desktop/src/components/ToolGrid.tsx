import React from 'react';
import { TOOL_CATALOG, ToolMetadata, ToolId } from '@docchisel/shared';
import { Files, Split, LayoutGrid, FileImage, Sparkles, ArrowRight } from 'lucide-react';

interface ToolGridProps {
  currentCategory: 'all' | 'pdf' | 'image';
  onSelectTool: (id: ToolId) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Files,
  Split,
  LayoutGrid,
  FileImage,
  Sparkles,
};

const TOOL_THEMES: Record<
  ToolId,
  {
    iconColor: string;
    bgSubtle: string;
    borderSubtle: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    hoverBorder: string;
    hoverGlow: string;
  }
> = {
  pdf_merge: {
    iconColor: 'text-primary',
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
    bgSubtle: 'bg-purple/10',
    borderSubtle: 'border-purple/25',
    badgeBg: 'bg-purple/10',
    badgeText: 'text-purple',
    badgeBorder: 'border-purple/30',
    hoverBorder: 'hover:border-purple/60',
    hoverGlow: 'hover:shadow-purple/10',
  },
  images_to_pdf: {
    iconColor: 'text-cyan',
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
    bgSubtle: 'bg-rose/10',
    borderSubtle: 'border-rose/25',
    badgeBg: 'bg-rose/10',
    badgeText: 'text-rose',
    badgeBorder: 'border-rose/30',
    hoverBorder: 'hover:border-rose/60',
    hoverGlow: 'hover:shadow-rose/10',
  },
};

export const ToolGrid: React.FC<ToolGridProps> = ({ currentCategory, onSelectTool }) => {
  const filteredTools = TOOL_CATALOG.filter((tool) => {
    if (currentCategory === 'all') return true;
    return tool.category === currentCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero Intro */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight sm:text-4xl">
          Everything you need for PDFs & Images
        </h2>
        <p className="mt-3 text-base text-textSecondary max-w-2xl mx-auto">
          Ultra-fast, hardware-accelerated batch operations performed entirely on your device.
          No uploads, no telemetry, no limits.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool: ToolMetadata) => {
          const IconComponent = ICON_MAP[tool.iconName] || Files;
          const theme = TOOL_THEMES[tool.id] || TOOL_THEMES.pdf_merge;

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`group relative p-6 rounded-2xl bg-surface border border-border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${theme.hoverBorder} ${theme.hoverGlow}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${theme.bgSubtle} border ${theme.borderSubtle} flex items-center justify-center ${theme.iconColor} group-hover:scale-105 transition-all duration-200`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {tool.badge && (
                    <span className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-textPrimary group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {tool.name}
                </h3>
                <p className="text-xs font-medium text-textSecondary mt-1 mb-3">
                  {tool.tagline}
                </p>
                <p className="text-xs text-textMuted leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-textSecondary group-hover:text-textPrimary transition-colors">
                <span>Select Tool</span>
                <ArrowRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform ${theme.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
