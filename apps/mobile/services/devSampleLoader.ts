import * as FileSystem from "expo-file-system/legacy";
import { ToolId } from "@docchisel/shared";
import { cleanFilePath } from "./mobileBridge";

// Embedded compact valid binary fixtures (verified with lopdf and image crate)
const SAMPLE_PDF_1_B64 = "JVBERi0xLjUKJbutwN4KMSAwIG9iago8PC9MZW5ndGggMzg+PnN0cmVhbQpCVCAvRjEgMjQgVGYgMTAwIDcwMCBUZCAoUGFnZSAxKSBUaiBFVAplbmRzdHJlYW0gCmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vQ29udGVudHMgMSAwIFIvUGFyZW50IDUgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDM4Pj5zdHJlYW0KQlQgL0YxIDI0IFRmIDEwMCA3MDAgVGQgKFBhZ2UgMikgVGogRVQKZW5kc3RyZWFtIAplbmRvYmoKNCAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDMgMCBSL1BhcmVudCA1IDAgUj4+CmVuZG9iago1IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMi9LaWRzWzIgMCBSIDQgMCBSXT4+CmVuZG9iago2IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyA1IDAgUj4+CmVuZG9iago3IDAgb2JqCjw8L1Jvb3QgNiAwIFIvVHlwZS9YUmVmL1NpemUgOC9XWzEgNCAyXS9JbmRleFsxIDddL0xlbmd0aCA0OT4+c3RyZWFtCgEAAAAPAAABAAAAZQAAAQAAALUAAAEAAAELAAABAAABWwAAAQAAAZQAAAEAAAHBAAAKZW5kc3RyZWFtIAplbmRvYmoKCnN0YXJ0eHJlZgo0NDkKJSVFT0Y=";
const SAMPLE_PDF_2_B64 = "JVBERi0xLjUKJbutwN4KMSAwIG9iago8PC9MZW5ndGggMzg+PnN0cmVhbQpCVCAvRjEgMjQgVGYgMTAwIDcwMCBUZCAoUGFnZSAxKSBUaiBFVAplbmRzdHJlYW0gCmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vQ29udGVudHMgMSAwIFIvUGFyZW50IDcgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDM4Pj5zdHJlYW0KQlQgL0YxIDI0IFRmIDEwMCA3MDAgVGQgKFBhZ2UgMikgVGogRVQKZW5kc3RyZWFtIAplbmRvYmoKNCAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDMgMCBSL1BhcmVudCA3IDAgUj4+CmVuZG9iago1IDAgb2JqCjw8L0xlbmd0aCAzOD4+c3RyZWFtCkJUIC9GMSAyNCBUZiAxMDAgNzAwIFRkIChQYWdlIDMpIFRqIEVUCmVuZHN0cmVhbSAKZW5kb2JqCjYgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA1IDAgUi9QYXJlbnQgNyAwIFI+PgplbmRvYmoKNyAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDMvS2lkc1syIDAgUiA0IDAgUiA2IDAgUl0+PgplbmRvYmoKOCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNyAwIFI+PgplbmRvYmoKOSAwIG9iago8PC9Sb290IDggMCBSL1R5cGUvWFJlZi9TaXplIDEwL1dbMSA0IDJdL0luZGV4WzEgOV0vTGVuZ3RoIDYzPj5zdHJlYW0KAQAAAA8AAAEAAABlAAABAAAAtQAAAQAAAQsAAAEAAAFbAAABAAABsQAAAQAAAgEAAAEAAAJAAAABAAACbQAACmVuZHN0cmVhbSAKZW5kb2JqCgpzdGFydHhyZWYKNjIxCiUlRU9G";
const SAMPLE_JPG_1_B64 = "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";
const SAMPLE_PNG_2_B64 = "iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAACzY+a1AAAEM0lEQVR4Ae3AA6AkWZbG8f937o3IzKdyS2Oubdu2bdu2bdu2bWmMnpZKr54yMyLu+Xa3anqmhztr1a/CZwsCAgQBAYKAgABBQIAgIEAQEBAgCAgQBAQIAgICBAEBgoAAQUBAgCAgQBAQIAgICBAEBAgCAgQBAQGCgABBQIAgICBAEBAgCAgQBAQECAICBAEBgoCAAEFAgCAgQBAQECAICBAEBAgCAgIEAQGCgABBQECAICBAEBAgCAgIEAQECAICBAEBAYKAAEFAgCAgoCKu+t8LqARX/e8FVIKr/vcCKuKq/72ASnDV/15AJbjqfy+gIq763wuoBFf97wVUgqv+9wIqwVX/ewEVcdX/XkAluOp/L6ASXPW/F1ARV/3vBVSCq/73AirBVf97ARVx1f9eQCW46n8voBJc9b8XUAmu+t8LqIir/vcCKsFV/3sBleCq/72Airjqfy+gElz1vxdQCa763wuoiKv+9wIqwVX/ewGV4Kr/vYBKcNX/XkBFXPW/F1AJrvrfC6gEV/3vBVTEVf97AZXgqv+9gEpw1f9eQEVc9b8XUAmu+t8LqARX/e8FVIKr/vcCKuKq/72ASnDV/15AJbjqfy+gIq763wuoBFf97wVUgqv+9wIq4qr/vYBKcNX/XkAluOp/L6ASXPW/F1ARV/3vBVSCq/73AirBVf97ARVx1f9eQCW46n8voBJc9b8XUBFX/e8FVIKr/vcCKsFV/3sBleCq/72Airjqfy+gElz1vxdQCa763wuoiKv+9wIqwVX/ewGV4Kr/vYCKuOp/L6ASXPW/F1AJrvrfC6gEV/3vBVTEVf97AZXgqv+9gEpw1f9eQEVc9b8XUAmu+t8LqARX/e8FVMRV/3sBleCq/72ASnDV/15AJbjqfy+gIq763wuoBFf97wVUgqv+9wIq4qr/vYBKcNX/XkAluOp/L6AirvrfC6gEV/3vBVSCq/73AirBVf97ARVx1f9eQCW46n8voBJc9b8XUBFX/e8FVIKr/vcCKsFV/3sBFXHV/15AJbjqfy+gElz1vxdQCa763wuoiKv+9wIqwVX/ewGV4Kr/vYCKuOp/L6ASXPW/F1AJrvrfC6iIq/73AirBVf97AZXgqv+9gEpw1f9eQEVc9b8XUAmu+t8LqARX/e8FVMRV/3sBleCq/72ASnDV/15ARVz1vxdQCa763wuoBFf97wVUgqv+9wIq4qr/vYBKcNX/XkAluOp/L6AirvrfC6gEV/3vBVSCq/73Airiqv+9gEpw1f9eQCW46n8voBJc9b8XUBFX/e8FVIKr/vcCKsFV/3sBFXHV/15AJbjqfy+gElz1vxdQEVf97wVUgqv+9wIqwVX/ewGV4Kr/vYCKuOp/L6ASXPW/F1AJrvrfC6iIq/73AirBVf97AZXgqv+9gIq46n8voBJc9b8XUAmu+t8L+EejQATTTrIzUgAAAABJRU5ErkJggg==";

/**
 * Ensures dev sample test files exist in FileSystem.cacheDirectory + "docchisel_samples/"
 * and returns absolute local filesystem paths suitable for zero-copy FFI execution.
 */
export async function getDevSampleFiles(): Promise<{
  pdfs: string[];
  images: string[];
}> {
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "/tmp";
  const samplesDirUri = `${baseDir}docchisel_samples/`;

  const dirInfo = await FileSystem.getInfoAsync(samplesDirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(samplesDirUri, { intermediates: true });
  }

  const pdf1Uri = `${samplesDirUri}sample_doc_a.pdf`;
  const pdf2Uri = `${samplesDirUri}sample_doc_b.pdf`;
  const jpgUri = `${samplesDirUri}sample_photo_1.jpg`;
  const pngUri = `${samplesDirUri}sample_photo_2.png`;

  const filesToWrite = [
    { uri: pdf1Uri, b64: SAMPLE_PDF_1_B64 },
    { uri: pdf2Uri, b64: SAMPLE_PDF_2_B64 },
    { uri: jpgUri, b64: SAMPLE_JPG_1_B64 },
    { uri: pngUri, b64: SAMPLE_PNG_2_B64 },
  ];

  await Promise.all(
    filesToWrite.map(async ({ uri, b64 }) => {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        await FileSystem.writeAsStringAsync(uri, b64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    })
  );

  return {
    pdfs: [cleanFilePath(pdf1Uri), cleanFilePath(pdf2Uri)],
    images: [cleanFilePath(jpgUri), cleanFilePath(pngUri)],
  };
}

/**
 * Returns appropriate staged sample files depending on the active tool.
 */
export async function loadSampleFilesForTool(toolId: ToolId): Promise<string[]> {
  const samples = await getDevSampleFiles();

  switch (toolId) {
    case "pdf_merge":
      // Merge requires at least 2 PDFs
      return samples.pdfs;
    case "pdf_split":
      // Split operates on a multi-page PDF (sample_doc_b has 3 pages)
      return [samples.pdfs[1]];
    case "pdf_organize":
      // Organize operates on a multi-page PDF (sample_doc_b has 3 pages)
      return [samples.pdfs[1]];
    case "images_to_pdf":
      // Images to PDF converts 2 images
      return samples.images;
    case "image_studio":
      // Image studio optimizes 2 images
      return samples.images;
    default:
      return samples.pdfs;
  }
}
