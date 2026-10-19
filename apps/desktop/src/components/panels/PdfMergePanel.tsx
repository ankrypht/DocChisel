import React from 'react';

interface PdfMergePanelProps {
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfMergePanel: React.FC<PdfMergePanelProps> = ({
  outputFilename,
  onChangeOutputFilename,
}) => {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted">
        Merge Configuration
      </h4>

      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename
        </label>
        <input
          type="text"
          value={outputFilename}
          onChange={(e) => onChangeOutputFilename(e.target.value)}
          placeholder="merged_document.pdf"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary transition-colors"
        />
        <p className="text-[11px] text-textMuted mt-1.5">
          Files will be merged in the exact sequence shown above in the staging cards.
        </p>
      </div>
    </div>
  );
};
