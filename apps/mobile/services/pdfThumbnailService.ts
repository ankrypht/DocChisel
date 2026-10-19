import DocChiselBridge, { RenderedPageThumbnailItem } from '../modules/docchisel-bridge';
import { cleanFilePath } from './mobileBridge';

export interface RenderedThumbnail {
  pageNumber: number;
  uri: string;
  width?: number;
  height?: number;
}

// Memory cache to avoid redundant bridge calls and native re-renders within session
const memoryThumbCache = new Map<string, string>();

/**
 * Returns thumbnail URI for a single page of a PDF document (defaults to page 1).
 */
export async function renderPdfThumbnail(
  filePath: string,
  pageNumber: number = 1,
  targetWidth: number = 260
): Promise<string | null> {
  if (!filePath) return null;
  const clean = cleanFilePath(filePath);
  const cacheKey = `${clean}_p${pageNumber}_w${targetWidth}`;

  if (memoryThumbCache.has(cacheKey)) {
    return memoryThumbCache.get(cacheKey)!;
  }

  if (DocChiselBridge && typeof DocChiselBridge.renderPdfThumbnailAsync === 'function') {
    try {
      const uri = await DocChiselBridge.renderPdfThumbnailAsync(clean, pageNumber, targetWidth);
      if (uri) {
        memoryThumbCache.set(cacheKey, uri);
        return uri;
      }
    } catch (err) {
      console.warn(`[PDF Thumbnail] Failed to render page ${pageNumber}:`, err);
    }
  }

  return null;
}

/**
 * Batch renders thumbnails for multiple pages of a PDF document.
 * Calls onPageRendered callback if provided as pages complete.
 */
export async function renderPdfThumbnails(
  filePath: string,
  maxPages: number = 100,
  targetWidth: number = 260,
  onPageRendered?: (thumb: RenderedThumbnail) => void
): Promise<RenderedThumbnail[]> {
  if (!filePath) return [];
  const clean = cleanFilePath(filePath);

  if (DocChiselBridge && typeof DocChiselBridge.renderPdfThumbnailsAsync === 'function') {
    try {
      const results = await DocChiselBridge.renderPdfThumbnailsAsync(clean, maxPages, targetWidth);
      results.forEach((item) => {
        const cacheKey = `${clean}_p${item.pageNumber}_w${targetWidth}`;
        memoryThumbCache.set(cacheKey, item.uri);
        if (onPageRendered) {
          onPageRendered(item);
        }
      });
      return results;
    } catch (err) {
      console.warn('[PDF Thumbnail] Native batch render failed:', err);
    }
  }

  return [];
}
