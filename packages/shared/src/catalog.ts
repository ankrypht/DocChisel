import { ToolCategory, ToolId } from './types';

export interface ToolMetadata {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  badge?: string;
  acceptedExtensions: string[];
  multiFile: boolean;
  minFiles: number;
}

export interface CategoryFilter {
  key: string;
  label: string;
  /** Groups chips into PDF vs Image sections in the UI */
  group: 'all' | 'pdf' | 'image';
}

export const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: 'all',          label: 'All Tools',       group: 'all'   },
  // ── PDF ──────────────────────────────────────────────────────────
  { key: 'pdf_organize', label: 'Organize PDF',    group: 'pdf'   },
  { key: 'pdf_optimize', label: 'Optimize PDF',    group: 'pdf'   },
  { key: 'pdf_convert_to', label: 'Convert to PDF',  group: 'pdf'   },
  { key: 'pdf_edit',     label: 'Edit PDF',         group: 'pdf'   },
  { key: 'pdf_security', label: 'PDF Security',    group: 'pdf'   },
  // ── IMAGE ────────────────────────────────────────────────────────
  { key: 'img_optimize', label: 'Optimize Image',         group: 'image' },
  { key: 'img_security', label: 'Image Security',         group: 'image' },
];

export type FilterCategory = (typeof CATEGORY_FILTERS)[number]['key'];

export const TOOL_CATALOG: ToolMetadata[] = [
  // ──────────────────────────────────────────────────────────────────
  // ORGANIZE PDF – merge, split, reorder
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'pdf_merge',
    name: 'Merge PDF',
    tagline: 'Combine multiple PDFs into one unified document',
    description: 'Merge PDFs in the exact order you want with high-speed local processing.',
    category: 'pdf_organize',
    iconName: 'Files',
    badge: 'Popular',
    acceptedExtensions: ['.pdf'],
    multiFile: true,
    minFiles: 2,
  },
  {
    id: 'pdf_split',
    name: 'Split PDF',
    tagline: 'Separate pages or extract custom page ranges',
    description: 'Burst a PDF into individual single-page documents or extract specific page intervals.',
    category: 'pdf_organize',
    iconName: 'Split',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_organize',
    name: 'Organize PDF',
    tagline: 'Rotate, reorder, or delete individual pages',
    description: 'Take full control of PDF page order, orientations (90°, 180°, 270°), and removals.',
    category: 'pdf_organize',
    iconName: 'LayoutGrid',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },

  // ──────────────────────────────────────────────────────────────────
  // OPTIMIZE PDF – compress, reduce size
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'pdf_compress',
    name: 'Compress PDF',
    tagline: 'Reduce PDF file size while preserving quality',
    description: 'Downsample high-DPI images and compress streams locally with zero quality loss.',
    category: 'pdf_optimize',
    iconName: 'Minimize2',
    badge: 'Save 80%',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },

  // ──────────────────────────────────────────────────────────────────
  // CONVERT TO PDF – images → PDF
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'images_to_pdf',
    name: 'JPG to PDF',
    tagline: 'Convert PNG, JPG, WebP images into a single PDF',
    description: 'Compile multiple images into a standard A4, Letter, or Fit-dimension PDF document.',
    category: 'pdf_convert_to',
    iconName: 'FileImage',
    badge: 'Fast',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },

  // ──────────────────────────────────────────────────────────────────
  // EDIT PDF – watermark, page numbers, crop
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'pdf_watermark',
    name: 'Add Watermark',
    tagline: 'Stamp text or image watermarks onto pages',
    description: 'Overlay custom text or image stamps with configurable opacity, rotation, and positioning.',
    category: 'pdf_edit',
    iconName: 'Stamp',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_page_numbers',
    name: 'Add Page Numbers',
    tagline: 'Add custom page numbers and counters to PDF',
    description: 'Stamp sequential page numbering with flexible format templates and margin controls.',
    category: 'pdf_edit',
    iconName: 'Hash',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_crop',
    name: 'Crop PDF',
    tagline: 'Trim page margins and adjust visible area',
    description: 'Trim page margins by customizing MediaBox and CropBox coordinates with millimeter precision.',
    category: 'pdf_edit',
    iconName: 'Crop',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },

  // ──────────────────────────────────────────────────────────────────
  // PDF SECURITY – protect, unlock
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'pdf_protect',
    name: 'Protect PDF',
    tagline: 'Encrypt and lock your PDF with AES-256',
    description: 'Secure sensitive PDF files with password protection and strict AES-256 encryption.',
    category: 'pdf_security',
    iconName: 'Lock',
    badge: 'Security',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_unlock',
    name: 'Unlock PDF',
    tagline: 'Remove password protection from your PDF',
    description: 'Decrypt password-protected PDFs to create permanent unencrypted copies.',
    category: 'pdf_security',
    iconName: 'Unlock',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },

  // ──────────────────────────────────────────────────────────────────
  // OPTIMIZE IMAGE (compress, resize, upscale)
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'image_studio',
    name: 'Compress IMAGE',
    tagline: 'Batch compress, resize, & convert image formats',
    description: 'Convert between JPEG, PNG, and WebP with high-speed compression and custom resizing.',
    category: 'img_optimize',
    iconName: 'Sparkles',
    badge: 'Popular',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },

  // ──────────────────────────────────────────────────────────────────
  // IMAGE SECURITY (watermark, blur)
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'image_watermark',
    name: 'Watermark IMAGE',
    tagline: 'Overlay text or logo watermark onto images',
    description: 'Protect creative visual assets with custom translucent text or brand logo watermarks.',
    category: 'img_security',
    iconName: 'Stamp',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },
];

export function getToolMetadata(id: ToolId): ToolMetadata | undefined {
  return TOOL_CATALOG.find((tool) => tool.id === id);
}
