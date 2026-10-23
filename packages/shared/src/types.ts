import { z } from 'zod';

export type ToolCategory = 'organize' | 'convert' | 'image' | 'pdf';

export const ToolIdSchema = z.enum([
  'pdf_merge',
  'pdf_split',
  'pdf_organize',
  'pdf_compress',
  'pdf_watermark',
  'pdf_page_numbers',
  'pdf_protect',
  'pdf_unlock',
  'pdf_crop',
  'images_to_pdf',
  'image_studio',
  'image_watermark',
]);
export type ToolId = z.infer<typeof ToolIdSchema>;

export const BaseJobParamsSchema = z.object({
  output_dir: z.string(),
});
export type BaseJobParams = z.infer<typeof BaseJobParamsSchema>;

// 1. PDF Merge
export const PdfMergeParamsSchema = BaseJobParamsSchema.extend({
  input_paths: z.array(z.string()).min(1),
  output_filename: z.string().optional(),
});
export type PdfMergeParams = z.infer<typeof PdfMergeParamsSchema>;

// 2. PDF Split
export const PdfSplitModeSchema = z.enum(['burst', 'ranges']);
export type PdfSplitMode = z.infer<typeof PdfSplitModeSchema>;

export const PdfSplitParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  mode: PdfSplitModeSchema,
  ranges: z.string().optional(), // e.g. "1-3,5,8-10"
});
export type PdfSplitParams = z.infer<typeof PdfSplitParamsSchema>;

// 3. PDF Organize
export const PageRotationSchema = z.object({
  page_number: z.number().int().positive(), // 1-indexed
  degrees: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
});
export type PageRotation = z.infer<typeof PageRotationSchema>;

export const PdfOrganizeParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  rotations: z.array(PageRotationSchema).optional(),
  page_order: z.array(z.number().int().positive()).optional(),
  deleted_pages: z.array(z.number().int().positive()).optional(),
});
export type PdfOrganizeParams = z.infer<typeof PdfOrganizeParamsSchema>;

// 4. PDF Compress (Batch 1)
export const PdfCompressLevelSchema = z.enum(['extreme', 'recommended', 'low']);
export type PdfCompressLevel = z.infer<typeof PdfCompressLevelSchema>;

export const PdfCompressParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  level: PdfCompressLevelSchema,
});
export type PdfCompressParams = z.infer<typeof PdfCompressParamsSchema>;

// 5. PDF Watermark (Batch 1)
export const PdfWatermarkPositionSchema = z.enum([
  'center',
  'top_left',
  'top_center',
  'top_right',
  'bottom_left',
  'bottom_center',
  'bottom_right',
]);
export type PdfWatermarkPosition = z.infer<typeof PdfWatermarkPositionSchema>;

export const PdfWatermarkTypeSchema = z.enum(['text', 'image']);
export type PdfWatermarkType = z.infer<typeof PdfWatermarkTypeSchema>;

export const PdfWatermarkParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  watermark_type: PdfWatermarkTypeSchema,
  text: z.string().optional(),
  font_size: z.number().positive().optional(),
  color: z.string().optional(), // hex e.g. "#000000"
  image_path: z.string().optional(),
  image_scale: z.number().positive().optional(),
  opacity: z.number().min(0).max(1),
  rotation: z.number(), // degrees e.g. 0, 45, -45
  position: PdfWatermarkPositionSchema,
  pages: z.string().optional(), // "all" or "1-5,7"
});
export type PdfWatermarkParams = z.infer<typeof PdfWatermarkParamsSchema>;

// 6. PDF Page Numbers (Batch 1)
export const PdfPageNumbersPositionSchema = z.enum([
  'bottom_center',
  'bottom_right',
  'bottom_left',
  'top_center',
  'top_right',
  'top_left',
]);
export type PdfPageNumbersPosition = z.infer<typeof PdfPageNumbersPositionSchema>;

export const PdfPageNumbersParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  format_template: z.string(), // e.g. "{n} of {total}", "Page {n}", "{n}"
  position: PdfPageNumbersPositionSchema,
  margin_pt: z.number().nonnegative(),
  font_size: z.number().positive(),
  start_page_number: z.number().int().positive(),
  pages: z.string().optional(), // "all" or "1-10"
});
export type PdfPageNumbersParams = z.infer<typeof PdfPageNumbersParamsSchema>;

// 7. PDF Protect (Batch 1)
export const PdfProtectParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  user_password: z.string().min(1),
  owner_password: z.string().optional(),
});
export type PdfProtectParams = z.infer<typeof PdfProtectParamsSchema>;

// 8. PDF Unlock (Batch 1)
export const PdfUnlockParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  password: z.string(),
});
export type PdfUnlockParams = z.infer<typeof PdfUnlockParamsSchema>;

// 9. PDF Crop (Batch 1)
export const PdfCropUnitSchema = z.enum(['pt', 'mm', 'percentage']);
export type PdfCropUnit = z.infer<typeof PdfCropUnitSchema>;

export const PdfCropParamsSchema = BaseJobParamsSchema.extend({
  input_path: z.string(),
  output_filename: z.string().optional(),
  margin_top: z.number().nonnegative(),
  margin_bottom: z.number().nonnegative(),
  margin_left: z.number().nonnegative(),
  margin_right: z.number().nonnegative(),
  unit: PdfCropUnitSchema.optional(),
});
export type PdfCropParams = z.infer<typeof PdfCropParamsSchema>;

// 10. Images to PDF
export const PageSizeSchema = z.enum(['a4', 'letter', 'fit']);
export type PageSize = z.infer<typeof PageSizeSchema>;

export const PageOrientationSchema = z.enum(['portrait', 'landscape', 'auto']);
export type PageOrientation = z.infer<typeof PageOrientationSchema>;

export const ImagesToPdfParamsSchema = BaseJobParamsSchema.extend({
  input_paths: z.array(z.string()).min(1),
  output_filename: z.string().optional(),
  page_size: PageSizeSchema,
  orientation: PageOrientationSchema,
  margin_mm: z.number().nonnegative(),
});
export type ImagesToPdfParams = z.infer<typeof ImagesToPdfParamsSchema>;

// 11. Image Studio
export const ImageTargetFormatSchema = z.enum(['jpeg', 'png', 'webp', 'preserve']);
export type ImageTargetFormat = z.infer<typeof ImageTargetFormatSchema>;

export const ImageResizeModeSchema = z.enum(['none', 'dimensions', 'percentage']);
export type ImageResizeMode = z.infer<typeof ImageResizeModeSchema>;

export const ImageStudioParamsSchema = BaseJobParamsSchema.extend({
  input_paths: z.array(z.string()).min(1),
  format: ImageTargetFormatSchema,
  quality: z.number().min(1).max(100),
  resize_mode: ImageResizeModeSchema,
  target_width: z.number().int().positive().optional(),
  target_height: z.number().int().positive().optional(),
  scale_percentage: z.number().positive().optional(),
  maintain_aspect_ratio: z.boolean(),
});
export type ImageStudioParams = z.infer<typeof ImageStudioParamsSchema>;

// 12. Image Watermark (Batch 1)
export const ImageWatermarkPositionSchema = z.enum([
  'center',
  'top_left',
  'top_center',
  'top_right',
  'bottom_left',
  'bottom_center',
  'bottom_right',
]);
export type ImageWatermarkPosition = z.infer<typeof ImageWatermarkPositionSchema>;

export const ImageWatermarkParamsSchema = BaseJobParamsSchema.extend({
  input_paths: z.array(z.string()).min(1),
  watermark_type: PdfWatermarkTypeSchema,
  text: z.string().optional(),
  font_size: z.number().positive().optional(),
  color: z.string().optional(), // hex
  watermark_image_path: z.string().optional(),
  scale: z.number().positive().optional(),
  opacity: z.number().min(0).max(1),
  position: ImageWatermarkPositionSchema,
  margin: z.number().nonnegative().optional(),
});
export type ImageWatermarkParams = z.infer<typeof ImageWatermarkParamsSchema>;

// Tagged Request Payloads for the Single-Dispatcher Bridge
export const JobRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pdf_merge'), params: PdfMergeParamsSchema }),
  z.object({ action: z.literal('pdf_split'), params: PdfSplitParamsSchema }),
  z.object({ action: z.literal('pdf_organize'), params: PdfOrganizeParamsSchema }),
  z.object({ action: z.literal('pdf_compress'), params: PdfCompressParamsSchema }),
  z.object({ action: z.literal('pdf_watermark'), params: PdfWatermarkParamsSchema }),
  z.object({ action: z.literal('pdf_page_numbers'), params: PdfPageNumbersParamsSchema }),
  z.object({ action: z.literal('pdf_protect'), params: PdfProtectParamsSchema }),
  z.object({ action: z.literal('pdf_unlock'), params: PdfUnlockParamsSchema }),
  z.object({ action: z.literal('pdf_crop'), params: PdfCropParamsSchema }),
  z.object({ action: z.literal('images_to_pdf'), params: ImagesToPdfParamsSchema }),
  z.object({ action: z.literal('image_studio'), params: ImageStudioParamsSchema }),
  z.object({ action: z.literal('image_watermark'), params: ImageWatermarkParamsSchema }),
]);
export type JobRequest = z.infer<typeof JobRequestSchema>;

// Per-file transformation result
export const FileResultSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  original_bytes: z.number(),
  result_bytes: z.number(),
});
export type FileResult = z.infer<typeof FileResultSchema>;

// Job Output
export const JobOutputSchema = z.object({
  tool: ToolIdSchema,
  files: z.array(FileResultSchema),
  total_original_bytes: z.number(),
  total_result_bytes: z.number(),
  message: z.string().optional(),
});
export type JobOutput = z.infer<typeof JobOutputSchema>;

// Engine Error Details
export const EngineErrorDetailsSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type EngineErrorDetails = z.infer<typeof EngineErrorDetailsSchema>;

// Global Response Contract from execute_job
export const JobResponseSchema = z.object({
  success: z.boolean(),
  output: JobOutputSchema.optional(),
  error: EngineErrorDetailsSchema.optional(),
});
export type JobResponse = z.infer<typeof JobResponseSchema>;
