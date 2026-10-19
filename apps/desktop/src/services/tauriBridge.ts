import { JobRequest, JobResponse } from '@docchisel/shared';

// Safe check if running inside Tauri window
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

/**
 * Dispatches a job payload through Tauri's single run_job command
 */
export async function executeJobBridge(request: JobRequest): Promise<JobResponse> {
  const payloadJson = JSON.stringify(request);

  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const responseStr = await invoke<string>('run_job', { payload: payloadJson });
      return JSON.parse(responseStr) as JobResponse;
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: 'BRIDGE_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  } else {
    // Browser mock fallback for web development preview
    console.warn('[DocChisel] Running in Web Preview Mode (Tauri backend not connected)');
    await new Promise((resolve) => setTimeout(resolve, 800));

    const totalOrig = 3_450_000;
    const totalRes = 1_120_000;
    return {
      success: true,
      output: {
        tool: request.action,
        files: [
          {
            input_path: 'browser_preview_file.pdf',
            output_path: `${request.params.output_dir}/docchisel_output.pdf`,
            original_bytes: totalOrig,
            result_bytes: totalRes,
          },
        ],
        total_original_bytes: totalOrig,
        total_result_bytes: totalRes,
        message: 'Preview simulation completed successfully (Run inside Tauri for native Rust execution)',
      },
    };
  }
}

/**
 * Open native OS file picker
 */
export async function selectFilesDialog(
  multiple: boolean,
  extensions: string[]
): Promise<string[]> {
  if (isTauriEnvironment()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const cleanExtensions = extensions.map((e) => e.replace(/^\./, ''));
      const selected = await open({
        multiple,
        directory: false,
        filters: [
          {
            name: 'Supported Documents & Images',
            extensions: cleanExtensions,
          },
        ],
      });

      if (!selected) return [];
      if (Array.isArray(selected)) {
        return selected;
      }
      return [selected];
    } catch (err) {
      console.error('Failed to open file dialog:', err);
      return [];
    }
  }

  // Web fallback: dummy path for UI demonstration
  const fakeExt = extensions[0] || '.pdf';
  return [`/Users/demo/Documents/Sample_Document${fakeExt}`];
}

/**
 * Open native OS directory picker
 */
export async function selectDirectoryDialog(): Promise<string | null> {
  if (isTauriEnvironment()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
      });
      return typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('Failed to open directory dialog:', err);
      return null;
    }
  }
  return '/Users/demo/Downloads/DocChisel';
}

/**
 * Get standard platform default output directory (e.g. ~/Downloads/DocChisel)
 */
export async function getDefaultOutputDir(): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('get_default_output_dir');
    } catch (err) {
      console.error('Failed to get default output dir:', err);
    }
  }
  return '~/Downloads/DocChisel';
}

/**
 * Get accurate PDF page count quickly via native Rust lopdf
 */
export async function getPdfPageCount(filePath: string): Promise<number> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<number>('get_pdf_page_count', { path: filePath });
    } catch (err) {
      console.warn('Failed to get page count via Tauri:', err);
    }
  }
  return 1;
}

/**
 * Convert local filesystem path to asset protocol URL for webview rendering
 */
export async function getLocalFileUrl(filePath: string): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      return convertFileSrc(filePath);
    } catch (err) {
      console.warn('Failed to convert file src:', err);
    }
  }
  return filePath;
}

/**
 * Reveal output file or directory in OS file manager (Finder / File Explorer)
 */
export async function revealFolder(path: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('show_in_folder', { path });
      return;
    } catch (err) {
      console.error('Failed to show in folder:', err);
    }
  }
  alert(`Output location: ${path}`);
}
