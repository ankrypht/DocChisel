import React, { useState, useEffect } from 'react';
import { PdfSplitMode } from '@docchisel/shared';
import { Loader2, FileText, CheckCircle2, Split } from 'lucide-react';
import { getPdfPageCount, getLocalFileUrl } from '../../services/tauriBridge';
import { renderPdfThumbnails } from '../../services/pdfThumbnailService';

interface PdfSplitPanelProps {
  filePath?: string;
  mode: PdfSplitMode;
  onChangeMode: (mode: PdfSplitMode) => void;
  ranges: string;
  onChangeRanges: (val: string) => void;
}

// Helper to check if a page number is in the user's range string
function isPageInRange(page: number, rangeStr: string): boolean {
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startS, endS] = trimmed.split('-');
      const start = parseInt(startS, 10);
      const end = parseInt(endS, 10);
      if (!isNaN(start) && !isNaN(end) && page >= start && page <= end) {
        return true;
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (p === page) return true;
    }
  }
  return false;
}

// Helper to convert set of selected page numbers to compact range string
function pageNumbersToRanges(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

export const PdfSplitPanel: React.FC<PdfSplitPanelProps> = ({
  filePath,
  mode,
  onChangeMode,
  ranges,
  onChangeRanges,
}) => {
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(false);

  useEffect(() => {
    if (!filePath) {
      setPageCount(0);
      setThumbnails({});
      return;
    }

    let isMounted = true;

    async function loadPdfPages() {
      setLoadingThumbnails(true);

      const count = await getPdfPageCount(filePath!);
      if (!isMounted) return;
      setPageCount(count);

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
        console.warn('Split panel thumbnail error:', err);
      } finally {
        if (isMounted) {
          setLoadingThumbnails(false);
        }
      }
    }

    loadPdfPages();

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  // Click on a page thumbnail to toggle it in range
  const handleTogglePage = (pageNumber: number) => {
    const isCurrentlySelected = isPageInRange(pageNumber, ranges);
    // Parse current selected numbers
    const currentSelected: number[] = [];
    for (let p = 1; p <= pageCount; p++) {
      if (isPageInRange(p, ranges)) {
        currentSelected.push(p);
      }
    }

    const updated = isCurrentlySelected
      ? currentSelected.filter((p) => p !== pageNumber)
      : [...currentSelected, pageNumber];

    onChangeRanges(pageNumbersToRanges(updated));
  };

  const handleSelectAll = () => {
    if (pageCount > 0) {
      onChangeRanges(pageNumbersToRanges(Array.from({ length: pageCount }, (_, i) => i + 1)));
    }
  };

  const handleSelectOdd = () => {
    if (pageCount > 0) {
      const odd = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
      onChangeRanges(pageNumbersToRanges(odd));
    }
  };

  const handleSelectEven = () => {
    if (pageCount > 0) {
      const even = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p % 2 === 0);
      onChangeRanges(pageNumbersToRanges(even));
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted">
          Split & Extract Modes
        </h4>
        {loadingThumbnails && (
          <div className="flex items-center space-x-1.5 text-xs text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading page previews...</span>
          </div>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-surfaceElevated rounded-xl border border-border">
        <button
          type="button"
          onClick={() => onChangeMode('burst')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            mode === 'burst'
              ? 'bg-primary text-white shadow-xs'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Burst Every Page</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('ranges')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === 'ranges'
              ? 'bg-primary text-white shadow-xs'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          Extract Custom Ranges
        </button>
      </div>

      {mode === 'burst' ? (
        <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-xs text-textSecondary">
          Extracts each page into a separate single-page PDF document.
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-textSecondary">
                Selected Page Ranges
              </label>
              <div className="flex items-center space-x-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 rounded bg-surfaceElevated hover:bg-surface text-textSecondary hover:text-textPrimary border border-border cursor-pointer transition-colors"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleSelectOdd}
                  className="px-2 py-0.5 rounded bg-surfaceElevated hover:bg-surface text-textSecondary hover:text-textPrimary border border-border cursor-pointer transition-colors"
                >
                  Odd
                </button>
                <button
                  type="button"
                  onClick={handleSelectEven}
                  className="px-2 py-0.5 rounded bg-surfaceElevated hover:bg-surface text-textSecondary hover:text-textPrimary border border-border cursor-pointer transition-colors"
                >
                  Even
                </button>
                <button
                  type="button"
                  onClick={() => onChangeRanges('')}
                  className="px-2 py-0.5 rounded bg-surfaceElevated hover:bg-surface text-textMuted hover:text-danger border border-border cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="text"
              value={ranges}
              onChange={(e) => onChangeRanges(e.target.value)}
              placeholder="e.g. 1-3, 5, 8-10"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-[11px] text-textMuted mt-1.5">
              Click any page below to toggle it, or type your desired page ranges above.
            </p>
          </div>
        </div>
      )}

      {/* Visual Page Thumbnails Gallery */}
      {pageCount > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-textMuted block">
            Document Pages ({pageCount}) {mode === 'ranges' && '— Click to Select'}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto pr-1">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
              const isSelected = mode === 'ranges' ? isPageInRange(pageNum, ranges) : true;
              const hasThumb = !!thumbnails[pageNum];

              return (
                <div
                  key={pageNum}
                  onClick={() => mode === 'ranges' && handleTogglePage(pageNum)}
                  className={`group relative rounded-xl border p-2 flex flex-col items-center justify-between transition-all duration-200 ${
                    mode === 'ranges' ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-surfaceElevated border-primary shadow-md shadow-primary/10'
                      : 'bg-surface/50 border-border opacity-40 hover:opacity-80'
                  }`}
                >
                  {/* Page header */}
                  <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[10px] font-mono font-bold text-textPrimary">
                      Page {pageNum}
                    </span>
                    {mode === 'ranges' && isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-current" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-full aspect-[1/1.38] bg-black/40 rounded-lg overflow-hidden flex items-center justify-center border border-border relative shadow-inner">
                    {hasThumb ? (
                      <img
                        src={thumbnails[pageNum]}
                        alt={`Page ${pageNum}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-textMuted animate-pulse" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-1.5 text-[9px] text-textMuted font-mono truncate w-full text-center">
                    {mode === 'burst' ? `page_${String(pageNum).padStart(3, '0')}.pdf` : isSelected ? 'Included' : 'Excluded'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
