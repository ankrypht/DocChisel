import React from 'react';
import { ImageTargetFormat, ImageResizeMode } from '@docchisel/shared';

interface ImageStudioPanelProps {
  files?: string[];
  format: ImageTargetFormat;
  onChangeFormat: (f: ImageTargetFormat) => void;
  quality: number;
  onChangeQuality: (q: number) => void;
  resizeMode: ImageResizeMode;
  onChangeResizeMode: (m: ImageResizeMode) => void;
  targetWidth: number;
  onChangeTargetWidth: (w: number) => void;
  targetHeight: number;
  onChangeTargetHeight: (h: number) => void;
  scalePercentage: number;
  onChangeScalePercentage: (s: number) => void;
  maintainAspectRatio: boolean;
  onChangeMaintainAspectRatio: (m: boolean) => void;
}

export const ImageStudioPanel: React.FC<ImageStudioPanelProps> = ({
  files = [],
  format,
  onChangeFormat,
  quality,
  onChangeQuality,
  resizeMode,
  onChangeResizeMode,
  targetWidth,
  onChangeTargetWidth,
  targetHeight,
  onChangeTargetHeight,
  scalePercentage,
  onChangeScalePercentage,
  maintainAspectRatio,
  onChangeMaintainAspectRatio,
}) => {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted">
          Hardware-Accelerated Studio Controls
        </h4>
        {files.length > 0 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose/10 text-rose border border-rose/25">
            {files.length} Image(s) Staged
          </span>
        )}
      </div>

      {/* Pipeline Preview Tag */}
      <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-textSecondary">Output Pipeline:</span>
          <span className="font-bold text-textPrimary uppercase font-mono bg-surface px-2 py-0.5 rounded border border-border">
            {format}
          </span>
          {format !== 'png' && (
            <span className="text-emerald font-mono font-semibold">
              {quality}% Quality
            </span>
          )}
        </div>
        <div className="text-[11px] text-textMuted font-mono">
          {resizeMode === 'none'
            ? 'Original Dimensions (SIMD Pass)'
            : resizeMode === 'percentage'
            ? `Scale: ${scalePercentage}% (SIMD Lanczos3)`
            : `Max: ${targetWidth}×${targetHeight}px (SIMD Lanczos3)`}
        </div>
      </div>

      {/* Target Format */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Output Format
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'webp', label: 'WebP', hint: 'Best Compression' },
            { id: 'jpeg', label: 'JPEG', hint: 'Universal' },
            { id: 'png', label: 'PNG', hint: 'Lossless' },
            { id: 'preserve', label: 'Original', hint: 'Keep Source Ext' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeFormat(item.id as ImageTargetFormat)}
              className={`py-2 px-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                format === item.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surfaceElevated text-textSecondary hover:text-textPrimary border border-border'
              }`}
            >
              <span className="text-xs font-bold">{item.label}</span>
              <span className="text-[10px] opacity-75">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider (for lossy formats: webp, jpeg, preserve) */}
      {format !== 'png' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-textSecondary">
              Compression Quality
            </label>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                quality >= 80
                  ? 'bg-emerald/15 text-emerald border border-emerald/30'
                  : quality >= 50
                  ? 'bg-amber/15 text-amber border border-amber/30'
                  : 'bg-danger/15 text-danger border border-danger/30'
              }`}
            >
              {quality}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={quality}
            onChange={(e) => onChangeQuality(Number(e.target.value))}
            className="w-full accent-primary bg-surfaceElevated h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-textMuted mt-1">
            <span>Smaller File (10%)</span>
            <span>Balanced (80%)</span>
            <span>Maximum Fidelity (100%)</span>
          </div>
        </div>
      )}

      {/* Resize Controls (SIMD Lanczos3) */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          SIMD Lanczos3 Resizing
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['none', 'percentage', 'dimensions'] as ImageResizeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeResizeMode(mode)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                resizeMode === mode
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surfaceElevated text-textSecondary hover:text-textPrimary border border-border'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {resizeMode === 'percentage' && (
          <div className="p-3 bg-surfaceElevated rounded-xl border border-border space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-textSecondary">Scale Factor</span>
              <span className="text-primary font-mono">{scalePercentage}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={scalePercentage}
              onChange={(e) => onChangeScalePercentage(Number(e.target.value))}
              className="w-full accent-primary bg-surface h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {resizeMode === 'dimensions' && (
          <div className="p-3 bg-surfaceElevated rounded-xl border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-textMuted mb-1">Max Width (px)</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => onChangeTargetWidth(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-textMuted mb-1">Max Height (px)</label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => onChangeTargetHeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={maintainAspectRatio}
                onChange={(e) => onChangeMaintainAspectRatio(e.target.checked)}
                className="rounded accent-primary"
              />
              <span className="text-xs text-textSecondary font-medium">
                Maintain proportional aspect ratio
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
