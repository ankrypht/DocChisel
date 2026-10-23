import React, { useState } from 'react';
import { Unlock, Eye, EyeOff } from 'lucide-react';

interface PdfUnlockPanelProps {
  password: string;
  onChangePassword: (pass: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfUnlockPanel: React.FC<PdfUnlockPanelProps> = ({
  password,
  onChangePassword,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <Unlock size={13} className="text-teal" />
          Unlock Password-Protected PDF
        </h4>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/25">
          Decrypt
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Document Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            placeholder="Enter the password used to lock this PDF"
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-teal transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textSecondary cursor-pointer"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <p className="text-[11px] text-textMuted mt-1.5 leading-relaxed">
          Unlocking creates a permanent, clean unencrypted copy of the document for editing and sharing.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </label>
        <input
          type="text"
          value={outputFilename}
          onChange={(e) => onChangeOutputFilename(e.target.value)}
          placeholder="unlocked_document.pdf"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-teal transition-colors"
        />
      </div>
    </div>
  );
};
