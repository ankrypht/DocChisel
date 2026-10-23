import React from 'react';
import { ShieldCheck } from 'lucide-react';
interface HeaderProps {
  toolSelected?: boolean;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
}) => {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between">
      {/* Brand & Title with Official App Logo */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={onHomeClick}>
        <img
          src="/logo.svg"
          alt="DocChisel"
          className="w-9 h-9 rounded-xl shadow-md shadow-primary/20 object-contain"
        />
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


      {/* Offline & Security Guarantee Badge */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-surfaceElevated border border-border text-xs font-medium text-textPrimary shadow-xs transition-colors">
          <ShieldCheck className="w-4 h-4 text-emerald shrink-0" />
          <span>100% Offline & Private</span>
        </div>
      </div>
    </header>
  );
};
