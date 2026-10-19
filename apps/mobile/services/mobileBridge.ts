import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { JobRequest, JobResponse } from '@docchisel/shared';
import DocChiselBridge from '../modules/docchisel-bridge';

/**
 * Normalizes a file URI into a standard absolute POSIX filesystem path.
 * Strips 'file://' or 'file:' schemes and decodes URI components so Rust's
 * std::fs can open the file directly without 'os error 2'.
 */
export function cleanFilePath(uri: string): string {
  if (!uri) return uri;
  let decoded = uri;
  try {
    decoded = decodeURI(uri);
  } catch {
    decoded = uri;
  }
  if (decoded.startsWith('file://')) {
    decoded = decoded.replace(/^file:\/\//, '');
  } else if (decoded.startsWith('file:')) {
    decoded = decoded.replace(/^file:/, '');
  }
  // Windows drive letter normalization if needed (/C:/path -> C:/path)
  if (/^\/[a-zA-Z]:/.test(decoded)) {
    decoded = decoded.substring(1);
  }
  return decoded;
}

/**
 * Ensures all input and output filesystem paths in a JobRequest are clean POSIX paths.
 */
function normalizeJobRequestPaths(req: JobRequest): JobRequest {
  const cloned = JSON.parse(JSON.stringify(req)) as JobRequest;
  const params = cloned.params as unknown as Record<string, unknown>;

  if ('input_path' in params && typeof params.input_path === 'string') {
    params.input_path = cleanFilePath(params.input_path);
  }
  if ('input_paths' in params && Array.isArray(params.input_paths)) {
    params.input_paths = params.input_paths.map((p) =>
      typeof p === 'string' ? cleanFilePath(p) : p
    );
  }
  if ('output_dir' in params && typeof params.output_dir === 'string') {
    params.output_dir = cleanFilePath(params.output_dir);
  }
  return cloned;
}

/**
 * Dispatches a typed JobRequest to the native single-dispatcher Rust engine.
 * Adheres to Invariant Rule 1 (Single Dispatcher) and Rule 2 (Zero File Bytes Over FFI).
 */
export async function executeJobMobile(request: JobRequest): Promise<JobResponse> {
  const normalizedRequest = normalizeJobRequestPaths(request);
  const payloadJson = JSON.stringify(normalizedRequest);

  if (DocChiselBridge && typeof DocChiselBridge.executeJobAsync === 'function') {
    try {
      const responseStr = await DocChiselBridge.executeJobAsync(payloadJson);
      return JSON.parse(responseStr) as JobResponse;
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: 'MOBILE_BRIDGE_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  return {
    success: false,
    error: {
      code: 'NATIVE_MODULE_UNAVAILABLE',
      message:
        'DocChisel native engine module is not loaded. Please run the development build on an Android or iOS device.',
    },
  };
}

/**
 * Pick one or more PDF documents from the device storage
 */
export async function pickPdfDocuments(multiple: boolean = false): Promise<string[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      multiple,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    return result.assets.map((asset) => cleanFilePath(asset.uri));
  } catch (error) {
    console.error('Error selecting PDF document:', error);
    return [];
  }
}

/**
 * Pick one or more images from the device photo library
 */
export async function pickImages(multiple: boolean = false): Promise<string[]> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo library permissions are required to select images.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      quality: 1,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    return result.assets.map((asset) => cleanFilePath(asset.uri));
  } catch (error) {
    console.error('Error selecting images:', error);
    return [];
  }
}

/**
 * Pick one or more image files from the device storage / file system
 */
export async function pickImageDocuments(multiple: boolean = false): Promise<string[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      multiple,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    return result.assets.map((asset) => cleanFilePath(asset.uri));
  } catch (error) {
    console.error('Error selecting images from files:', error);
    return [];
  }
}

/**
 * Opens system share sheet for processed file (WhatsApp, AirDrop, Gmail, Save to Files).
 * Ensures a valid file:// URI scheme is present for Android/iOS Sharing providers.
 */
export async function shareOutputFile(filePath: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert(`Sharing not available. File saved to: ${filePath}`);
      return;
    }
    const shareUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    await Sharing.shareAsync(shareUrl);
  } catch (err) {
    console.error('Error sharing file:', err);
  }
}

/**
 * Returns default output directory inside the app's cache as a clean filesystem path.
 */
export async function getAppOutputDir(): Promise<string> {
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '/tmp';
  const targetDirUri = `${baseDir}docchisel_output`;
  const info = await FileSystem.getInfoAsync(targetDirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(targetDirUri, { intermediates: true });
  }
  return cleanFilePath(targetDirUri);
}

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Auto-increments filename for consecutive operations
 */
export function incrementFilename(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  const stem = dotIndex !== -1 ? name.slice(0, dotIndex) : name;
  const ext = dotIndex !== -1 ? name.slice(dotIndex) : '';
  const match = stem.match(/^(.*?)(?: \((\d+)\))?$/);
  if (match) {
    const baseStem = match[1];
    const num = match[2] ? parseInt(match[2], 10) + 1 : 1;
    return `${baseStem} (${num})${ext}`;
  }
  return `${stem} (1)${ext}`;
}

/**
 * Inspects PDF document to detect total page count on device.
 * Uses native OS PDF renderer (PdfRenderer on Android, PDFKit on iOS) with fallback to regex parsing.
 */
export async function getPdfPageCountMobile(filePath: string): Promise<number> {
  const clean = cleanFilePath(filePath);

  // 1. Native OS PDF inspection (100% accurate & fast)
  if (DocChiselBridge && typeof DocChiselBridge.getPdfPageCountAsync === 'function') {
    try {
      const nativeCount = await DocChiselBridge.getPdfPageCountAsync(clean);
      if (typeof nativeCount === 'number' && nativeCount > 0) {
        return nativeCount;
      }
    } catch (err) {
      console.warn('[DocChisel] Native getPdfPageCountAsync failed, falling back:', err);
    }
  }

  // 2. Fallback to reading file headers / regex
  try {
    const fileUri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) return 1;

    const fileSize = (fileInfo as any).size || 0;
    let textChunk = '';

    if (fileSize <= 512 * 1024) {
      textChunk = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      // Read first 256KB and last 256KB
      const head = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
        length: 256 * 1024,
      });
      let tail = '';
      try {
        tail = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
          position: Math.max(0, fileSize - 256 * 1024),
          length: 256 * 1024,
        });
      } catch {
        // tail read optional
      }
      textChunk = head + '\n' + tail;
    }

    const countMatch =
      textChunk.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/) ||
      textChunk.match(/\/Count\s+(\d+)[^>]*\/Type\s*\/Pages/);

    if (countMatch && countMatch[1]) {
      const parsed = parseInt(countMatch[1], 10);
      if (parsed > 0) return parsed;
    }

    const pageMatches = textChunk.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
  } catch (err) {
    console.warn('[DocChisel] Failed to parse PDF page count:', err);
  }
  return 1;
}


