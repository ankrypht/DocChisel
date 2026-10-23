import React from 'react';
import { PdfCompressLevel } from '@docchisel/shared';
import { Minimize2, Zap, ShieldCheck } from 'lucide-react';

interface PdfCompressPanelProps {
  level: PdfCompressLevel;
  onChangeLevel: (lvl: PdfCompressLevel) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfCompressPanel: React.FC<PdfCompressPanelProps> = ({
  level,
  onChangeLevel,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const levels: {
    key: PdfCompressLevel;
    title: string;
    description: string;
    badge: string;
    quality: string;
    icon: typeof Zap;
  }[] = [
    {
      key: 'extreme',
      title: 'Extreme Compression',
      description: 'Maximum file size reduction with lower image quality.',
      badge: 'Up to -80%',
      quality: 'Low (45%)',
      icon: Minimize2,
    },
    {
      key: 'recommended',
      title: 'Recommended Compression',
      description: 'Ideal balance between visual fidelity and great size savings.',
      badge: 'Up to -60%',
      quality: 'Balanced (65%)',
      icon: Zap,
    },
    {
      key: 'low',
      title: 'Less Compression',
      description: 'High quality retained with minimal image downsampling.',
      badge: 'Up to -30%',
      quality: 'High (80%)',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted">
          Compression Settings
        </h4>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald/10 text-emerald border border-emerald/25">
          100% Local & Offline
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {levels.map((item) => {
          const active = level === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangeLevel(item.key)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                active
                  ? 'bg-emerald/10 border-emerald/60 shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]'
                  : 'bg-surfaceElevated border-border hover:border-zinc-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon
                    size={16}
                    className={active ? 'text-emerald' : 'text-textSecondary'}
                  />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      active
                        ? 'bg-emerald text-zinc-950'
                        : 'bg-zinc-800 text-textSecondary'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <div
                  className={`text-xs font-bold ${
                    active ? 'text-textPrimary' : 'text-textSecondary'
                  }`}
                >
                  {item.title}
                </div>
                <p className="text-[11px] text-textMuted mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 text-[10px] text-textMuted flex items-center justify-between">
                <span>Image Quality:</span>
                <span className="font-semibold text-textSecondary">{item.quality}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Output Filename (Optional)
        </label>
        <input
          type="text"
          value={outputFilename}
          onChange={(e) => onChangeOutputFilename(e.target.value)}
          placeholder="compressed_document.pdf"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-emerald transition-colors"
        />
      </div>
    </div>
  );
};
