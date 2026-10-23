import React from 'react';
import { ImageWatermarkPosition, PdfWatermarkType } from '@docchisel/shared';
import { Type, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageWatermarkPanelProps {
  watermarkType: PdfWatermarkType;
  onChangeWatermarkType: (t: PdfWatermarkType) => void;
  text: string;
  onChangeText: (t: string) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  color: string;
  onChangeColor: (c: string) => void;
  watermarkImagePath: string;
  onChangeWatermarkImagePath: (p: string) => void;
  opacity: number;
  onChangeOpacity: (o: number) => void;
  position: ImageWatermarkPosition;
  onChangePosition: (pos: ImageWatermarkPosition) => void;
  margin: number;
  onChangeMargin: (m: number) => void;
}

export const ImageWatermarkPanel: React.FC<ImageWatermarkPanelProps> = ({
  watermarkType,
  onChangeWatermarkType,
  text,
  onChangeText,
  fontSize,
  onChangeFontSize,
  color,
  onChangeColor,
  watermarkImagePath,
  onChangeWatermarkImagePath,
  opacity,
  onChangeOpacity,
  position,
  onChangePosition,
  margin,
  onChangeMargin,
}) => {
  const positions: { key: ImageWatermarkPosition; label: string }[] = [
    { key: 'top_left', label: 'Top Left' },
    { key: 'top_center', label: 'Top Center' },
    { key: 'top_right', label: 'Top Right' },
    { key: 'center', label: 'Center' },
    { key: 'bottom_left', label: 'Bottom Left' },
    { key: 'bottom_center', label: 'Bottom Center' },
    { key: 'bottom_right', label: 'Bottom Right' },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <Sparkles size={13} className="text-rose" />
          Image Watermark Settings
        </h4>
        <div className="flex items-center gap-1 bg-surfaceElevated p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => onChangeWatermarkType('text')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              watermarkType === 'text'
                ? 'bg-rose text-white'
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
                ? 'bg-rose text-white'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            <ImageIcon size={12} />
            Logo
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
              placeholder="e.g. © 2026 YourBrand"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-rose transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Font Size ({fontSize}px)
            </label>
            <input
              type="number"
              min={12}
              max={150}
              value={fontSize}
              onChange={(e) => onChangeFontSize(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-rose"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Watermark Logo File Path
          </label>
          <input
            type="text"
            value={watermarkImagePath}
            onChange={(e) => onChangeWatermarkImagePath(e.target.value)}
            placeholder="Absolute path to PNG / JPEG watermark logo"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-rose transition-colors"
          />
        </div>
      )}

      {/* Opacity and Margin sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-textSecondary mb-1.5">
            <span>Opacity</span>
            <span className="font-mono text-rose">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
            className="w-full accent-rose"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-textSecondary mb-1.5">
            <span>Padding Margin</span>
            <span className="font-mono text-rose">{margin}px</span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={margin}
            onChange={(e) => onChangeMargin(parseInt(e.target.value))}
            className="w-full accent-rose"
          />
        </div>
      </div>

      {/* Position Grid */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Watermark Position
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {positions.map((p) => {
            const active = position === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onChangePosition(p.key)}
                className={`py-2 px-1 rounded-xl border text-center text-[11px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? 'bg-rose/20 border-rose text-rose font-bold'
                    : 'bg-surfaceElevated border-border text-textSecondary hover:border-zinc-500'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
