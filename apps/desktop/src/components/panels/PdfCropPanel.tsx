import React from 'react';
import { PdfCropUnit } from '@docchisel/shared';
import { Crop } from 'lucide-react';

interface PdfCropPanelProps {
  marginTop: number;
  onChangeMarginTop: (v: number) => void;
  marginBottom: number;
  onChangeMarginBottom: (v: number) => void;
  marginLeft: number;
  onChangeMarginLeft: (v: number) => void;
  marginRight: number;
  onChangeMarginRight: (v: number) => void;
  unit: PdfCropUnit;
  onChangeUnit: (u: PdfCropUnit) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfCropPanel: React.FC<PdfCropPanelProps> = ({
  marginTop,
  onChangeMarginTop,
  marginBottom,
  onChangeMarginBottom,
  marginLeft,
  onChangeMarginLeft,
  marginRight,
  onChangeMarginRight,
  unit,
  onChangeUnit,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const units: { key: PdfCropUnit; label: string }[] = [
    { key: 'pt', label: 'Points (pt)' },
    { key: 'mm', label: 'Millimeters (mm)' },
    { key: 'percentage', label: 'Percentage (%)' },
  ];

  const applyPreset = (val: number) => {
    onChangeMarginTop(val);
    onChangeMarginBottom(val);
    onChangeMarginLeft(val);
    onChangeMarginRight(val);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <Crop size={13} className="text-orange" />
          Page Crop Margins
        </h4>
        <div className="flex items-center gap-1 bg-surfaceElevated p-1 rounded-xl border border-border">
          {units.map((u) => {
            const active = unit === u.key;
            return (
              <button
                key={u.key}
                type="button"
                onClick={() => onChangeUnit(u.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  active
                    ? 'bg-orange text-white'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {u.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Quick Margin Presets
        </label>
        <div className="flex gap-2">
          {[
            { label: 'None', val: 0 },
            { label: 'Light Trim (10)', val: unit === 'percentage' ? 3 : 10 },
            { label: 'Standard (25)', val: unit === 'percentage' ? 6 : 25 },
            { label: 'Deep Trim (50)', val: unit === 'percentage' ? 12 : 50 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.val)}
              className="flex-1 py-1.5 rounded-lg border border-border bg-surfaceElevated text-xs font-semibold text-textSecondary hover:border-zinc-500 cursor-pointer transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 margin directional inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            Top Margin
          </label>
          <input
            type="number"
            min={0}
            value={marginTop}
            onChange={(e) => onChangeMarginTop(Math.max(0, Number(e.target.value)))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-orange font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            Bottom Margin
          </label>
          <input
            type="number"
            min={0}
            value={marginBottom}
            onChange={(e) => onChangeMarginBottom(Math.max(0, Number(e.target.value)))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-orange font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            Left Margin
          </label>
          <input
            type="number"
            min={0}
            value={marginLeft}
            onChange={(e) => onChangeMarginLeft(Math.max(0, Number(e.target.value)))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-orange font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            Right Margin
          </label>
          <input
            type="number"
            min={0}
            value={marginRight}
            onChange={(e) => onChangeMarginRight(Math.max(0, Number(e.target.value)))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-orange font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </label>
        <input
          type="text"
          value={outputFilename}
          onChange={(e) => onChangeOutputFilename(e.target.value)}
          placeholder="cropped_document.pdf"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-orange transition-colors"
        />
      </div>
    </div>
  );
};
