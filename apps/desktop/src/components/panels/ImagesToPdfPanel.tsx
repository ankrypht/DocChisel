import React, { useState, useEffect } from 'react';
import { PageSize, PageOrientation } from '@docchisel/shared';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  Eye,
} from 'lucide-react';
import { getLocalFileUrl } from '../../services/tauriBridge';

interface ImagesToPdfPanelProps {
  files?: string[];
  pageSize: PageSize;
  onChangePageSize: (size: PageSize) => void;
  orientation: PageOrientation;
  onChangeOrientation: (o: PageOrientation) => void;
  marginMm: number;
  onChangeMarginMm: (m: number) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

const MM_TO_PT = 72.0 / 25.4;

export const ImagesToPdfPanel: React.FC<ImagesToPdfPanelProps> = ({
  files = [],
  pageSize,
  onChangePageSize,
  orientation,
  onChangeOrientation,
  marginMm,
  onChangeMarginMm,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [imageDimensions, setImageDimensions] = useState<
    Record<number, { w: number; h: number }>
  >({});

  // Preload URLs and extract native dimensions for each image
  useEffect(() => {
    let isMounted = true;
    async function loadUrls() {
      const urls = await Promise.all(files.map((f) => getLocalFileUrl(f)));
      if (!isMounted) return;
      setFileUrls(urls);
      if (activePageIndex >= files.length) {
        setActivePageIndex(Math.max(0, files.length - 1));
      }

      // Proactively load natural dimensions for all files
      urls.forEach((url, idx) => {
        const img = new Image();
        img.onload = () => {
          if (isMounted && img.naturalWidth && img.naturalHeight) {
            setImageDimensions((prev) => ({
              ...prev,
              [idx]: { w: img.naturalWidth, h: img.naturalHeight },
            }));
          }
        };
        img.src = url;
      });
    }
    loadUrls();
    return () => {
      isMounted = false;
    };
  }, [files]);

  const activeUrl = fileUrls[activePageIndex];
  const activeFileName = files[activePageIndex]?.split(/[/\\]/).pop() || '';

  // Determine current image dimensions with sensible regex fallback from filename
  const filenameMatch = activeFileName.match(/(\d{2,5})x(\d{2,5})/i);
  const fallbackDims = filenameMatch
    ? { w: parseInt(filenameMatch[1], 10), h: parseInt(filenameMatch[2], 10) }
    : { w: 1920, h: 1080 };
  const currentDims = imageDimensions[activePageIndex] || fallbackDims;
  const imgW = Math.max(1, currentDims.w);
  const imgH = Math.max(1, currentDims.h);

  // 1. Calculate PDF geometry matching crates/core_engine/src/tools/images_to_pdf.rs 100%
  const marginPt = Math.max(0, marginMm * MM_TO_PT);

  // Rust base dimensions logic
  const [baseW, baseH] = (() => {
    switch (pageSize) {
      case 'a4':
        return [595.28, 841.89];
      case 'letter':
        return [612.0, 792.0];
      case 'fit':
        return [imgW + 2.0 * marginPt, imgH + 2.0 * marginPt];
    }
  })();

  // Rust orientation logic:
  // Auto => img_w > img_h -> landscape, else portrait
  const isLandscape = (() => {
    switch (orientation) {
      case 'landscape':
        return true;
      case 'portrait':
        return false;
      case 'auto':
        return imgW > imgH;
    }
  })();

  // Rust page dimension selection
  const [pageW, pageH] = isLandscape
    ? [Math.max(baseW, baseH), Math.min(baseW, baseH)]
    : [Math.min(baseW, baseH), Math.max(baseW, baseH)];

  const availW = Math.max(1, pageW - 2.0 * marginPt);
  const availH = Math.max(1, pageH - 2.0 * marginPt);

  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  // Percentage offsets and dimensions within the page
  const leftPercent = ((marginPt + (availW - drawW) / 2.0) / pageW) * 100;
  const topPercent = ((marginPt + (availH - drawH) / 2.0) / pageH) * 100;
  const widthPercent = (drawW / pageW) * 100;
  const heightPercent = (drawH / pageH) * 100;

  // Exact pixel sizing for the virtual sheet canvas to prevent WebKit flex/aspect-ratio distortions
  const MAX_CANVAS_W = 540;
  const MAX_CANVAS_H = 340;
  const pageRatio = pageW / pageH;

  let sheetWidth: number;
  let sheetHeight: number;

  if (pageRatio > MAX_CANVAS_W / MAX_CANVAS_H) {
    sheetWidth = MAX_CANVAS_W;
    sheetHeight = Math.round(MAX_CANVAS_W / pageRatio);
  } else {
    sheetHeight = MAX_CANVAS_H;
    sheetWidth = Math.round(MAX_CANVAS_H * pageRatio);
  }

  return (
    <div className="space-y-6">
      {/* Live PDF Document Formed Preview Card */}
      {files.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
                Live PDF Output Preview
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-bold">
                Page {activePageIndex + 1} of {files.length}
              </span>
            </div>

            {/* Page Navigators */}
            {files.length > 1 && (
              <div className="flex items-center space-x-1 bg-surfaceElevated rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                  disabled={activePageIndex === 0}
                  className="p-1 rounded text-textSecondary hover:text-textPrimary disabled:opacity-20 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-2 text-textSecondary">
                  {activePageIndex + 1} / {files.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActivePageIndex((p) => Math.min(files.length - 1, p + 1))
                  }
                  disabled={activePageIndex === files.length - 1}
                  className="p-1 rounded text-textSecondary hover:text-textPrimary disabled:opacity-20 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Virtual PDF Sheet Canvas - Authentic Page Representation */}
          <div className="flex flex-col items-center justify-center p-6 bg-black/60 rounded-xl border border-border min-h-[380px] overflow-hidden">
            {/* The Actual PDF Page Sheet (Physical Paper representation) */}
            <div
              className="relative bg-white text-gray-900 shadow-2xl shadow-black/90 transition-all duration-150 rounded-[2px] overflow-hidden border border-gray-300/40"
              style={{
                width: `${sheetWidth}px`,
                height: `${sheetHeight}px`,
              }}
            >
              {/* Placed Image matching Rust scale and offsets */}
              {activeUrl ? (
                <div
                  className="absolute transition-all duration-150"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                >
                  <img
                    src={activeUrl}
                    alt={activeFileName}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        setImageDimensions((prev) => ({
                          ...prev,
                          [activePageIndex]: {
                            w: img.naturalWidth,
                            h: img.naturalHeight,
                          },
                        }));
                      }
                    }}
                    className="w-full h-full select-none pointer-events-none object-fill"
                  />
                  {/* Subtle 1px ring indicator when margin > 0 so white images don't vanish into white page */}
                  {marginMm > 0 && (
                    <div className="absolute inset-0 ring-1 ring-black/10 pointer-events-none" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 space-y-1 h-full">
                  <FileText className="w-8 h-8" />
                  <span className="text-xs">Loading page {activePageIndex + 1}...</span>
                </div>
              )}
            </div>

            {/* Sub-label under page with authentic specs */}
            <div className="mt-4 text-center space-y-1">
              <p className="text-[11px] font-mono text-gray-200 font-medium truncate max-w-md">
                {activeFileName}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono text-gray-400">
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-textSecondary font-semibold uppercase">
                  {pageSize === 'fit' ? 'FIT TO IMAGE' : pageSize.toUpperCase()}
                </span>
                <span>•</span>
                <span className="text-gray-300">
                  {isLandscape ? 'Landscape' : 'Portrait'}
                  {orientation === 'auto' ? ' (Auto)' : ''}
                </span>
                <span>•</span>
                <span className={marginMm === 0 ? 'text-emerald-400 font-medium' : 'text-gray-300'}>
                  {marginMm === 0 ? '0mm Margins (Full Bleed)' : `${marginMm}mm White Margin`}
                </span>
                <span>•</span>
                <span className="text-gray-500">
                  {imgW} × {imgH} px
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip for Multi-Page Jumping */}
          {files.length > 1 && (
            <div className="flex items-center space-x-2.5 overflow-x-auto py-1.5 px-0.5">
              {files.map((file, idx) => {
                const url = fileUrls[idx];
                const isActive = idx === activePageIndex;

                return (
                  <button
                    key={file + idx}
                    type="button"
                    onClick={() => setActivePageIndex(idx)}
                    className={`relative shrink-0 rounded-lg border p-1 transition-all duration-150 flex flex-col items-center cursor-pointer ${
                      isActive
                        ? 'border-primary bg-primary/20 shadow-md shadow-primary/20 scale-105'
                        : 'border-border bg-surfaceElevated opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="w-12 h-14 bg-white rounded-xs overflow-hidden flex items-center justify-center p-0.5 border border-gray-300/40">
                      {url ? (
                        <img
                          src={url}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-textMuted" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono font-bold mt-1 text-textSecondary">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings Configuration Card */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted">
            Page & Layout Settings
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Page Size */}
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Page Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['a4', 'letter', 'fit'] as PageSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChangePageSize(size)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${
                    pageSize === size
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surfaceElevated text-textSecondary hover:text-textPrimary border border-border'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Orientation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'portrait', 'landscape'] as PageOrientation[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => onChangeOrientation(o)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    orientation === o
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surfaceElevated text-textSecondary hover:text-textPrimary border border-border'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Margin Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-textSecondary">
              Page Margins
            </label>
            <span className="text-xs font-mono text-primary font-bold">
              {marginMm === 0 ? '0 mm (Full Bleed)' : `${marginMm} mm White Margin`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={marginMm}
            onChange={(e) => onChangeMarginMm(Number(e.target.value))}
            className="w-full accent-primary bg-surfaceElevated h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between items-center text-[10px] text-textMuted mt-2">
            <div className="flex space-x-1.5">
              {[0, 5, 10, 15, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeMarginMm(val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    marginMm === val
                      ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                      : 'bg-surfaceElevated text-textSecondary hover:text-textPrimary border border-border'
                  }`}
                >
                  {val === 0 ? '0mm' : `${val}mm`}
                </button>
              ))}
            </div>
            <span className="text-textMuted">
              {marginMm === 0 ? 'No white borders' : `Physical ${(marginMm * MM_TO_PT).toFixed(0)}pt margin`}
            </span>
          </div>
        </div>

        {/* Output Filename */}
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1.5">
            Output PDF Filename
          </label>
          <input
            type="text"
            value={outputFilename}
            onChange={(e) => onChangeOutputFilename(e.target.value)}
            placeholder="images_document.pdf"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
