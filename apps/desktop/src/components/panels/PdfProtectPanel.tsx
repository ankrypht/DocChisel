import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface PdfProtectPanelProps {
  userPassword: string;
  onChangeUserPassword: (pass: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfProtectPanel: React.FC<PdfProtectPanelProps> = ({
  userPassword,
  onChangeUserPassword,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const isMatching = userPassword.length > 0 && userPassword === confirmPassword;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <Lock size={13} className="text-amber" />
          Password Protection (AES-256)
        </h4>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/25 flex items-center gap-1">
          <ShieldCheck size={11} />
          High-Security Encryption
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Enter Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={userPassword}
              onChange={(e) => onChangeUserPassword(e.target.value)}
              placeholder="Minimum 6 characters recommended"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-amber transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textSecondary cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password to confirm"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors ${
              confirmPassword.length > 0
                ? isMatching
                  ? 'border-emerald focus:border-emerald'
                  : 'border-danger focus:border-danger'
                : 'border-border focus:border-amber'
            }`}
          />
        </div>
      </div>

      {confirmPassword.length > 0 && !isMatching && (
        <p className="text-[11px] text-danger font-medium">
          Passwords do not match. Please verify both fields.
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </label>
        <input
          type="text"
          value={outputFilename}
          onChange={(e) => onChangeOutputFilename(e.target.value)}
          placeholder="protected_document.pdf"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-amber transition-colors"
        />
      </div>

      <div className="p-3.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textMuted leading-relaxed">
        <p>
          <strong className="text-textSecondary">Zero Cloud Privacy:</strong> Your PDF is
          encrypted right here on your machine with military-grade AES-256. DocChisel never
          transmits, stores, or recovers passwords.
        </p>
      </div>
    </div>
  );
};
