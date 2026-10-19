import * as pdfjsLib from 'pdfjs-dist';
// Offline bundled worker via Vite ?url import - 100% local, zero CDN calls
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface RenderedPageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Renders thumbnail for a specific PDF page locally in browser/webview
 */
export async function renderPdfThumbnails(
  sourceUrlOrData: string | Uint8Array,
  onPageRendered?: (page: RenderedPageThumbnail) => void,
  maxPages: number = 200
): Promise<RenderedPageThumbnail[]> {
  try {
    const loadingTask = pdfjsLib.getDocument(
      typeof sourceUrlOrData === 'string'
        ? { url: sourceUrlOrData }
        : { data: sourceUrlOrData }
    );

    const pdf = await loadingTask.promise;
    const totalPages = Math.min(pdf.numPages, maxPages);
    const results: RenderedPageThumbnail[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // Scale for crisp thumbnail rendering (around 200-260px wide)
      const viewport = page.getViewport({ scale: 0.4 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
        }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const item: RenderedPageThumbnail = {
          pageNumber: pageNum,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        };
        results.push(item);
        if (onPageRendered) {
          onPageRendered(item);
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('[PDF Thumbnail] Failed to render with PDF.js:', err);
    return [];
  }
}
