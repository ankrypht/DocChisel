export type ToolCategory = 'pdf' | 'image';

export type ToolId =
  | 'pdf_merge'
  | 'pdf_split'
  | 'pdf_organize'
  | 'images_to_pdf'
  | 'image_studio';

export interface BaseJobParams {
  output_dir: string;
}

// 1. PDF Merge
export interface PdfMergeParams extends BaseJobParams {
  input_paths: string[];
  output_filename?: string;
}

// 2. PDF Split
export type PdfSplitMode = 'burst' | 'ranges';

export interface PdfSplitParams extends BaseJobParams {
  input_path: string;
  mode: PdfSplitMode;
  ranges?: string; // e.g. "1-3,5,8-10"
}

// 3. PDF Organize
export interface PageRotation {
  page_number: number; // 1-indexed
  degrees: 0 | 90 | 180 | 270;
}

export interface PdfOrganizeParams extends BaseJobParams {
  input_path: string;
  output_filename?: string;
  rotations?: PageRotation[];
  page_order?: number[]; // 1-indexed new sequence of pages
  deleted_pages?: number[]; // 1-indexed pages to remove
}

// 4. Images to PDF
export type PageSize = 'a4' | 'letter' | 'fit';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';

export interface ImagesToPdfParams extends BaseJobParams {
  input_paths: string[];
  output_filename?: string;
  page_size: PageSize;
  orientation: PageOrientation;
  margin_mm: number;
}

// 5. Image Studio
export type ImageTargetFormat = 'jpeg' | 'png' | 'webp' | 'preserve';
export type ImageResizeMode = 'none' | 'dimensions' | 'percentage';

export interface ImageStudioParams extends BaseJobParams {
  input_paths: string[];
  format: ImageTargetFormat;
  quality: number; // 1 - 100
  resize_mode: ImageResizeMode;
  target_width?: number;
  target_height?: number;
  scale_percentage?: number; // e.g. 50 for 50%
  maintain_aspect_ratio: boolean;
}

// Tagged Request Payloads for the Single-Dispatcher Bridge
export type JobRequest =
  | { action: 'pdf_merge'; params: PdfMergeParams }
  | { action: 'pdf_split'; params: PdfSplitParams }
  | { action: 'pdf_organize'; params: PdfOrganizeParams }
  | { action: 'images_to_pdf'; params: ImagesToPdfParams }
  | { action: 'image_studio'; params: ImageStudioParams };

// Per-file transformation result
export interface FileResult {
  input_path: string;
  output_path: string;
  original_bytes: number;
  result_bytes: number;
}

// Job Output
export interface JobOutput {
  tool: ToolId;
  files: FileResult[];
  total_original_bytes: number;
  total_result_bytes: number;
  message?: string;
}

// Engine Error Details
export interface EngineErrorDetails {
  code: string;
  message: string;
}

// Global Response Contract from execute_job
export interface JobResponse {
  success: boolean;
  output?: JobOutput;
  error?: EngineErrorDetails;
}
