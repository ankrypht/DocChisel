import React from 'react';
import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';

interface HeaderProps {
  currentCategory: 'all' | 'pdf' | 'image';
  onSelectCategory: (cat: 'all' | 'pdf' | 'image') => void;
  toolSelected: boolean;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  toolSelected,
  onHomeClick,
}) => {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={onHomeClick}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue flex items-center justify-center shadow-md shadow-primary/20">
          <HardDrive className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-textPrimary flex items-center gap-1.5">
              DocChisel
            </h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-mono">
              v0.1
            </span>
          </div>
          <p className="text-xs text-textSecondary">100% Local PDF & Image Toolkit</p>
        </div>
      </div>

      {/* Category Navigation Pills (when in tool selection grid) */}
      {!toolSelected && (
        <div className="flex items-center space-x-1 bg-surfaceElevated p-1 rounded-xl border border-border">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentCategory === 'all'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
            }`}
          >
            All Tools
          </button>
          <button
            onClick={() => onSelectCategory('pdf')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentCategory === 'pdf'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
            }`}
          >
            PDF Tools
          </button>
          <button
            onClick={() => onSelectCategory('image')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentCategory === 'image'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
            }`}
          >
            Image Studio
          </button>
        </div>
      )}

      {/* Offline & Security Guarantee Badges with Semantic Accent Icons */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surfaceElevated border border-border text-xs font-medium text-textPrimary shadow-xs transition-colors">
          <ShieldCheck className="w-4 h-4 text-emerald shrink-0" />
          <span>100% Offline & Private</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surfaceElevated border border-border text-xs font-medium text-textPrimary shadow-xs transition-colors">
          <Cpu className="w-4 h-4 text-cyan shrink-0" />
          <span>SIMD + Rayon</span>
        </div>
      </div>
    </header>
  );
};
