import React from 'react';
import { PdfPageNumbersPosition } from '@docchisel/shared';
import { Hash } from 'lucide-react';

interface PdfPageNumbersPanelProps {
  formatTemplate: string;
  onChangeFormatTemplate: (tpl: string) => void;
  position: PdfPageNumbersPosition;
  onChangePosition: (pos: PdfPageNumbersPosition) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  marginPt: number;
  onChangeMarginPt: (m: number) => void;
  startPageNumber: number;
  onChangeStartPageNumber: (num: number) => void;
  pages: string;
  onChangePages: (p: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (f: string) => void;
}

export const PdfPageNumbersPanel: React.FC<PdfPageNumbersPanelProps> = ({
  formatTemplate,
  onChangeFormatTemplate,
  position,
  onChangePosition,
  fontSize,
  onChangeFontSize,
  marginPt,
  onChangeMarginPt,
  startPageNumber,
  onChangeStartPageNumber,
  pages,
  onChangePages,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const templates = [
    { label: 'Page 1 of 5', value: 'Page {n} of {total}' },
    { label: '1 / 5', value: '{n} / {total}' },
    { label: 'Page 1', value: 'Page {n}' },
    { label: '1', value: '{n}' },
  ];

  const positions: { key: PdfPageNumbersPosition; label: string }[] = [
    { key: 'top_left', label: 'Top Left' },
    { key: 'top_center', label: 'Top Center' },
    { key: 'top_right', label: 'Top Right' },
    { key: 'bottom_left', label: 'Bottom Left' },
    { key: 'bottom_center', label: 'Bottom Center' },
    { key: 'bottom_right', label: 'Bottom Right' },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <Hash size={13} className="text-blue" />
          Page Numbering Settings
        </h4>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue/10 text-blue border border-blue/25">
          Dynamic Counter
        </span>
      </div>

      {/* Format template chips */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-2">
          Format Template
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {templates.map((tpl) => {
            const active = formatTemplate === tpl.value;
            return (
              <button
                key={tpl.value}
                type="button"
                onClick={() => onChangeFormatTemplate(tpl.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-colors ${
                  active
                    ? 'bg-blue/20 border-blue text-blue font-bold'
                    : 'bg-surfaceElevated border-border text-textSecondary hover:border-zinc-500'
                }`}
              >
                {tpl.label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={formatTemplate}
          onChange={(e) => onChangeFormatTemplate(e.target.value)}
          placeholder="Custom template e.g. {n} of {total}"
          className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary font-mono focus:outline-none focus:border-blue"
        />
      </div>

      {/* Position selector */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-2">
          Position on Page
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {positions.map((p) => {
            const active = position === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onChangePosition(p.key)}
                className={`py-2 px-1 rounded-xl border text-center text-xs font-medium cursor-pointer transition-colors ${
                  active
                    ? 'bg-blue/20 border-blue text-blue font-bold'
                    : 'bg-surfaceElevated border-border text-textSecondary hover:border-zinc-500'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Font Size ({fontSize}pt)
          </label>
          <input
            type="number"
            min={6}
            max={36}
            value={fontSize}
            onChange={(e) => onChangeFontSize(Number(e.target.value))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Margin ({marginPt}pt)
          </label>
          <input
            type="number"
            min={10}
            max={120}
            value={marginPt}
            onChange={(e) => onChangeMarginPt(Number(e.target.value))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Start Page #
          </label>
          <input
            type="number"
            min={1}
            value={startPageNumber}
            onChange={(e) => onChangeStartPageNumber(Number(e.target.value))}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary focus:outline-none focus:border-blue"
          />
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
            placeholder="all or 1-10"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-blue"
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
            placeholder="numbered_document.pdf"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-blue"
          />
        </div>
      </div>
    </div>
  );
};
