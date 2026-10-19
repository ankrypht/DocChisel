import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  Loader2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { PageRotation } from '@docchisel/shared';
import { getPdfPageCount, getLocalFileUrl } from '../../services/tauriBridge';
import { renderPdfThumbnails } from '../../services/pdfThumbnailService';

interface PageItem {
  originalPage: number;
  rotation: 0 | 90 | 180 | 270;
  deleted: boolean;
}

interface PdfOrganizePanelProps {
  filePath?: string;
  onStateChange: (state: {
    rotations: PageRotation[];
    pageOrder: number[];
    deletedPages: number[];
  }) => void;
}

export const PdfOrganizePanel: React.FC<PdfOrganizePanelProps> = ({
  filePath,
  onStateChange,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  // Load actual pages and visual thumbnails whenever the selected PDF changes
  useEffect(() => {
    if (!filePath) {
      setPages([]);
      setThumbnails({});
      return;
    }

    let isMounted = true;

    async function loadPdfPagesAndThumbnails() {
      setIsLoadingPages(true);
      setLoadingThumbnails(true);

      // 1. Get exact page count instantly via native Rust lopdf
      const count = await getPdfPageCount(filePath!);
      if (!isMounted) return;

      const initialPages: PageItem[] = Array.from({ length: count }, (_, i) => ({
        originalPage: i + 1,
        rotation: 0,
        deleted: false,
      }));

      setPages(initialPages);
      setIsLoadingPages(false);

      // Notify parent of initial order
      onStateChange({
        rotations: [],
        pageOrder: initialPages.map((p) => p.originalPage),
        deletedPages: [],
      });

      // 2. Stream rendered visual thumbnails for each page via PDF.js
      try {
        const fileUrl = await getLocalFileUrl(filePath!);
        await renderPdfThumbnails(fileUrl, (rendered) => {
          if (isMounted) {
            setThumbnails((prev) => ({
              ...prev,
              [rendered.pageNumber]: rendered.dataUrl,
            }));
          }
        });
      } catch (err) {
        console.warn('Thumbnail streaming error:', err);
      } finally {
        if (isMounted) {
          setLoadingThumbnails(false);
        }
      }
    }

    loadPdfPagesAndThumbnails();

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  const emitChanges = (updated: PageItem[]) => {
    setPages(updated);

    const rotations: PageRotation[] = [];
    const pageOrder: number[] = [];
    const deletedPages: number[] = [];

    updated.forEach((p) => {
      if (p.deleted) {
        deletedPages.push(p.originalPage);
      } else {
        pageOrder.push(p.originalPage);
        if (p.rotation !== 0) {
          rotations.push({ page_number: p.originalPage, degrees: p.rotation });
        }
      }
    });

    onStateChange({ rotations, pageOrder, deletedPages });
  };

  const handleRotate = (idx: number, clockwise: boolean = true) => {
    const updated = [...pages];
    const currentRot = updated[idx].rotation;
    const diff = clockwise ? 90 : 270;
    const nextRot = ((currentRot + diff) % 360) as 0 | 90 | 180 | 270;
    updated[idx] = { ...updated[idx], rotation: nextRot };
    emitChanges(updated);
  };

  const handleRotateAll = () => {
    const updated = pages.map((p) => ({
      ...p,
      rotation: (((p.rotation + 90) % 360) as 0 | 90 | 180 | 270),
    }));
    emitChanges(updated);
  };

  const handleToggleDelete = (idx: number) => {
    const updated = [...pages];
    updated[idx] = { ...updated[idx], deleted: !updated[idx].deleted };
    emitChanges(updated);
  };

  const handleMove = (idx: number, dir: 'left' | 'right') => {
    if (dir === 'left' && idx === 0) return;
    if (dir === 'right' && idx === pages.length - 1) return;

    const targetIdx = dir === 'left' ? idx - 1 : idx + 1;
    const updated = [...pages];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    emitChanges(updated);
  };

  const handleReset = () => {
    const reset = pages.map((p, i) => ({
      originalPage: i + 1,
      rotation: 0 as const,
      deleted: false,
    }));
    emitChanges(reset);
  };

  if (!filePath) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 text-center text-xs text-textMuted">
        Please select a PDF file above to view and organize its pages.
      </div>
    );
  }

  const activePagesCount = pages.filter((p) => !p.deleted).length;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted">
              Page Layout & Orientations
            </h4>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple/10 border border-purple/25 text-purple font-bold">
              {activePagesCount} of {pages.length} Pages Active
            </span>
          </div>
          <p className="text-[11px] text-textMuted mt-0.5">
            Hover over any page to rotate, reorder, or delete.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {loadingThumbnails && (
            <div className="flex items-center space-x-1.5 text-xs text-purple mr-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Rendering previews...</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRotateAll}
            className="flex items-center space-x-1 text-xs text-textSecondary hover:text-textPrimary px-2.5 py-1.5 rounded-lg bg-surfaceElevated hover:bg-surface border border-border transition-colors cursor-pointer"
            title="Rotate All Pages 90°"
          >
            <RotateCw className="w-3.5 h-3.5 text-purple" />
            <span>Rotate All</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs text-textMuted hover:text-textPrimary px-2.5 py-1.5 rounded-lg bg-surfaceElevated hover:bg-surface border border-border transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {isLoadingPages ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-textMuted">
          <Loader2 className="w-6 h-6 animate-spin text-purple" />
          <span className="text-xs">Analyzing PDF pages...</span>
        </div>
      ) : (
        /* Visual Interactive Pages Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[520px] overflow-y-auto pr-1">
          {pages.map((p, idx) => {
            const hasThumb = !!thumbnails[p.originalPage];

            return (
              <div
                key={p.originalPage}
                className={`group relative rounded-2xl border p-2.5 flex flex-col items-center justify-between transition-all duration-200 ${
                  p.deleted
                    ? 'opacity-35 bg-surfaceElevated/40 border-danger/40 grayscale'
                    : 'bg-surfaceElevated border-border hover:border-purple/50 hover:shadow-lg hover:shadow-purple/10'
                }`}
              >
                {/* Page Number & Sequence Badge */}
                <div className="w-full flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[11px] font-bold text-gray-400 font-mono">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      p.rotation !== 0
                        ? 'bg-purple/15 text-purple border border-purple/30'
                        : 'text-textMuted'
                    }`}
                  >
                    {p.deleted ? 'Removed' : `${p.rotation}°`}
                  </span>
                </div>

                {/* Visual Thumbnail Area */}
                <div className="w-full aspect-[1/1.38] bg-black/50 rounded-xl overflow-hidden flex items-center justify-center border border-border relative shadow-inner">
                  {hasThumb ? (
                    <img
                      src={thumbnails[p.originalPage]}
                      alt={`Page ${p.originalPage}`}
                      className="w-full h-full object-contain transition-transform duration-300 drop-shadow"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                  ) : (
                    <div className="flex flex-col items-center space-y-1.5 text-textMuted">
                      <FileText className="w-7 h-7 text-zinc-600 animate-pulse" />
                      <span className="text-[11px] font-mono font-bold">
                        Page {p.originalPage}
                      </span>
                    </div>
                  )}

                  {/* Deleted Overlay */}
                  {p.deleted && (
                    <div className="absolute inset-0 bg-danger/85 backdrop-blur-[1px] flex flex-col items-center justify-center text-white font-bold text-xs">
                      <Trash2 className="w-6 h-6 mb-1 text-white" />
                      <span>Removed</span>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="w-full mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                  {/* Rotate CCW / CW */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleRotate(idx, false)}
                      disabled={p.deleted}
                      className="p-1 rounded-md text-textSecondary hover:text-purple hover:bg-purple/10 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Rotate 90° Counter-Clockwise"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotate(idx, true)}
                      disabled={p.deleted}
                      className="p-1 rounded-md text-textSecondary hover:text-purple hover:bg-purple/10 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reorder Arrows */}
                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'left')}
                      disabled={idx === 0 || p.deleted}
                      className="p-1 rounded-md text-textSecondary hover:text-primary hover:bg-surface disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'right')}
                      disabled={idx === pages.length - 1 || p.deleted}
                      className="p-1 rounded-md text-textSecondary hover:text-primary hover:bg-surface disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete / Restore */}
                  <button
                    type="button"
                    onClick={() => handleToggleDelete(idx)}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      p.deleted
                        ? 'text-emerald hover:bg-emerald/10'
                        : 'text-textMuted hover:text-danger hover:bg-danger/10'
                    }`}
                    title={p.deleted ? 'Restore Page' : 'Remove Page'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
