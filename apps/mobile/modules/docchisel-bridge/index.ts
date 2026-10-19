import { requireNativeModule } from 'expo-modules-core';

export interface RenderedPageThumbnailItem {
  pageNumber: number;
  uri: string;
  width?: number;
  height?: number;
}

export interface DocChiselBridgeInterface {
  /**
   * Dispatches a raw JSON job payload to the native Rust core_engine on a background worker thread.
   * Invariant Rule 1: Single-Dispatcher Bridge.
   *
   * @param payloadJson Serialized JobRequest string
   * @returns Promise resolving to serialized JobResponse string
   */
  executeJobAsync(payloadJson: string): Promise<string>;

  /**
   * Returns exact page count of a PDF using the OS native PDF engine.
   */
  getPdfPageCountAsync?(filePath: string): Promise<number>;

  /**
   * Renders a single page of a PDF to a cached local JPEG file and returns its file:// URI.
   */
  renderPdfThumbnailAsync?(
    filePath: string,
    pageNumber: number,
    targetWidth: number
  ): Promise<string>;

  /**
   * Batch renders PDF pages to cached local JPEG files and returns an array of metadata and file:// URIs.
   */
  renderPdfThumbnailsAsync?(
    filePath: string,
    maxPages: number,
    targetWidth: number
  ): Promise<RenderedPageThumbnailItem[]>;
}

let nativeModule: DocChiselBridgeInterface | null = null;
try {
  nativeModule = requireNativeModule<DocChiselBridgeInterface>('DocChiselBridge');
} catch {
  // Native module is only available when compiled in an Android or iOS development build
  console.warn('[DocChiselBridge] Native module not found; ensure app is running in a native development build.');
}

export default nativeModule;

