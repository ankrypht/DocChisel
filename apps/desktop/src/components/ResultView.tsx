import React from 'react';
import { JobOutput } from '@docchisel/shared';
import { CheckCircle2, FolderOpen, ArrowRight, FileCheck, Sparkles } from 'lucide-react';
import { revealFolder } from '../services/tauriBridge';

interface ResultViewProps {
  output: JobOutput;
  outputDir: string;
  onReset: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const ResultView: React.FC<ResultViewProps> = ({ output, outputDir, onReset }) => {
  const orig = output.total_original_bytes;
  const res = output.total_result_bytes;
  const savedBytes = orig > res ? orig - res : 0;
  const savedPercent = orig > 0 && res < orig ? Math.round(((orig - res) / orig) * 100) : 0;

  const handleOpenFolder = () => {
    // If output files exist, open parent of first file or outputDir
    const target = output.files[0]?.output_path || outputDir;
    revealFolder(target);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Success Card */}
      <div className="bg-surface rounded-3xl border border-border p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Smooth Ambient Glow Backdrop without blur banding */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-80 pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.10) 35%, rgba(16, 185, 129, 0.02) 60%, transparent 75%)',
          }}
        />

        <div className="flex flex-col items-center space-y-3 relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9 text-emerald" />
          </div>
          <h3 className="text-2xl font-extrabold text-textPrimary">
            Processing Completed!
          </h3>
          {output.message && (
            <p className="text-xs text-textSecondary max-w-md">
              {output.message}
            </p>
          )}
        </div>

        {/* File Size Savings Badge */}
        {savedPercent > 0 && (
          <div className="p-4 rounded-2xl bg-emerald/10 border border-emerald/25 flex items-center justify-around text-center">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-textMuted font-bold">Original Size</div>
              <div className="text-sm font-mono text-textSecondary font-semibold">{formatBytes(orig)}</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full bg-emerald text-gray-950 text-xs font-black tracking-wider uppercase flex items-center gap-1 shadow-md shadow-emerald/20">
                <Sparkles className="w-3 h-3 text-gray-950 fill-current" />
                Saved {savedPercent}%
              </span>
              <span className="text-[10px] text-emerald font-mono font-bold mt-1">-{formatBytes(savedBytes)}</span>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-textMuted font-bold">Result Size</div>
              <div className="text-sm font-mono text-emerald font-bold">{formatBytes(res)}</div>
            </div>
          </div>
        )}

        {/* Output Files Summary */}
        <div className="space-y-2 text-left bg-surfaceElevated p-4 rounded-2xl border border-border">
          <div className="text-xs font-semibold text-textSecondary mb-2">
            Generated Files ({output.files.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {output.files.map((file, idx) => {
              const name = file.output_path.split(/[/\\]/).pop() || file.output_path;
              return (
                <div
                  key={file.output_path + idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs"
                >
                  <div className="flex items-center space-x-2 truncate mr-3">
                    <FileCheck className="w-4 h-4 text-emerald shrink-0" />
                    <span className="text-textPrimary truncate font-mono text-[11px]" title={file.output_path}>
                      {name}
                    </span>
                  </div>
                  <span className="font-mono text-textMuted text-[10px] shrink-0">
                    {formatBytes(file.result_bytes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleOpenFolder}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-primary hover:bg-[#0077ED] active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Output Folder</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-surfaceElevated hover:bg-surface text-textSecondary hover:text-textPrimary text-xs font-semibold transition-all border border-border flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Process Another</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
