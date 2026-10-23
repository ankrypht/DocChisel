import React from 'react';
import { PdfWatermarkPosition, PdfWatermarkType } from '@docchisel/shared';
import { Type, Image as ImageIcon, Sliders } from 'lucide-react';

interface PdfWatermarkPanelProps {
  watermarkType: PdfWatermarkType;
  onChangeWatermarkType: (t: PdfWatermarkType) => void;
  text: string;
  onChangeText: (t: string) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  color: string;
  onChangeColor: (c: string) => void;
  imagePath: string;
  onChangeImagePath: (p: string) => void;
  opacity: number;
  onChangeOpacity: (o: number) => void;
  rotation: number;
  onChangeRotation: (r: number) => void;
  position: PdfWatermarkPosition;
  onChangePosition: (pos: PdfWatermarkPosition) => void;
  pages: string;
  onChangePages: (pg: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfWatermarkPanel: React.FC<PdfWatermarkPanelProps> = ({
  watermarkType,
  onChangeWatermarkType,
  text,
  onChangeText,
  fontSize,
  onChangeFontSize,
  color,
  onChangeColor,
  imagePath,
  onChangeImagePath,
  opacity,
  onChangeOpacity,
  rotation,
  onChangeRotation,
  position,
  onChangePosition,
  pages,
  onChangePages,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const positions: { key: PdfWatermarkPosition; label: string }[] = [
    { key: 'top_left', label: 'Top Left' },
    { key: 'top_center', label: 'Top Center' },
    { key: 'top_right', label: 'Top Right' },
    { key: 'center', label: 'Center' },
    { key: 'bottom_left', label: 'Bottom Left' },
    { key: 'bottom_center', label: 'Bottom Center' },
    { key: 'bottom_right', label: 'Bottom Right' },
  ];

  const rotationPresets = [0, 45, 90, -45];

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <Sliders size={13} className="text-violet" />
          Watermark Configuration
        </h4>
        <div className="flex items-center gap-1 bg-surfaceElevated p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => onChangeWatermarkType('text')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              watermarkType === 'text'
                ? 'bg-violet text-white'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            <Type size={12} />
            Text
          </button>
          <button
            type="button"
            onClick={() => onChangeWatermarkType('image')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              watermarkType === 'image'
                ? 'bg-violet text-white'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            <ImageIcon size={12} />
            Image Logo
          </button>
        </div>
      </div>

      {watermarkType === 'text' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Watermark Text
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="e.g. CONFIDENTIAL, DRAFT, APPROVED"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-violet transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Font Size ({fontSize}pt)
            </label>
            <input
              type="number"
              min={12}
              max={120}
              value={fontSize}
              onChange={(e) => onChangeFontSize(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-violet"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Watermark Logo Image File Path
          </label>
          <input
            type="text"
            value={imagePath}
            onChange={(e) => onChangeImagePath(e.target.value)}
            placeholder="Absolute path to PNG / JPEG watermark logo"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-violet transition-colors"
          />
        </div>
      )}

      {/* Sliders: Opacity and Rotation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-textSecondary mb-1.5">
            <span>Opacity</span>
            <span className="font-mono text-violet">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
            className="w-full accent-violet"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Rotation Angle ({rotation}°)
          </label>
          <div className="flex gap-2">
            {rotationPresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRotation(r)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-colors ${
                  rotation === r
                    ? 'bg-violet/20 border-violet text-violet'
                    : 'bg-surfaceElevated border-border text-textSecondary hover:border-zinc-500'
                }`}
              >
                {r > 0 ? `+${r}°` : `${r}°`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Placement Grid */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Stamp Position
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {positions.map((p) => {
            const active = position === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onChangePosition(p.key)}
                className={`py-2 px-2 rounded-xl border text-center text-[11px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? 'bg-violet/20 border-violet text-violet'
                    : 'bg-surfaceElevated border-border text-textSecondary hover:border-zinc-500'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Target Pages
          </label>
          <input
            type="text"
            value={pages}
            onChange={(e) => onChangePages(e.target.value)}
            placeholder="all or 1-5, 8"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-violet transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Output Filename (Optional)
          </label>
          <input
            type="text"
            value={outputFilename}
            onChange={(e) => onChangeOutputFilename(e.target.value)}
            placeholder="watermarked_document.pdf"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-violet transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
