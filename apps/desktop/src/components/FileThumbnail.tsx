import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getLocalFileUrl, getPdfPageCount } from '../services/tauriBridge';
import { renderPdfThumbnails } from '../services/pdfThumbnailService';

interface FileThumbnailProps {
  filePath: string;
  className?: string;
  showBadge?: boolean;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  filePath,
  className = 'w-12 h-12',
  showBadge = true,
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadThumb() {
      try {
        const fileUrl = await getLocalFileUrl(filePath);

        if (isImage) {
          if (isMounted) {
            setThumbnailUrl(fileUrl);
            setIsLoading(false);
          }
        } else if (isPdf) {
          // 1. Get page count
          getPdfPageCount(filePath).then((count) => {
            if (isMounted) setPageCount(count);
          });

          // 2. Render first page thumbnail
          await renderPdfThumbnails(
            fileUrl,
            (rendered) => {
              if (isMounted && rendered.pageNumber === 1) {
                setThumbnailUrl(rendered.dataUrl);
                setIsLoading(false);
              }
            },
            1
          );

          if (isMounted) {
            setIsLoading(false);
          }
        } else {
          if (isMounted) setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load file thumbnail:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadThumb();

    return () => {
      isMounted = false;
    };
  }, [filePath, isImage, isPdf]);

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-black/40 border border-border flex items-center justify-center shrink-0 ${className}`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="File Preview"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : isLoading ? (
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      ) : isPdf ? (
        <FileText className="w-5 h-5 text-danger/80" />
      ) : isImage ? (
        <ImageIcon className="w-5 h-5 text-cyan/90" />
      ) : (
        <FileText className="w-5 h-5 text-textMuted" />
      )}

      {/* Optional Badge */}
      {showBadge && (
        <div className="absolute bottom-1 right-1 pointer-events-none">
          {isPdf && pageCount !== null ? (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-950/90 text-zinc-100 border border-zinc-700/90 shadow-xs backdrop-blur-xs">
              {pageCount}p
            </span>
          ) : isImage ? (
            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-primary text-white shadow-xs">
              {ext === 'jpeg' ? 'jpg' : ext}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
