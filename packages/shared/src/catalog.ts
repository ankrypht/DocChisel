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

export const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Tools' },
  { key: 'organize', label: 'Organize PDF' },
  { key: 'convert', label: 'Convert' },
  { key: 'image', label: 'Image Studio' },
] as const;

export type FilterCategory = (typeof CATEGORY_FILTERS)[number]['key'];

export const TOOL_CATALOG: ToolMetadata[] = [
  {
    id: 'pdf_merge',
    name: 'Merge PDF',
    tagline: 'Combine multiple PDFs into one unified document',
    description: 'Merge PDFs in the exact order you want with high-speed local processing.',
    category: 'organize',
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
    category: 'organize',
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
    category: 'organize',
    iconName: 'LayoutGrid',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_compress',
    name: 'Compress PDF',
    tagline: 'Reduce PDF file size while preserving quality',
    description: 'Downsample high-DPI images and compress streams locally with zero quality loss.',
    category: 'organize',
    iconName: 'Minimize2',
    badge: 'Save 80%',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_watermark',
    name: 'Watermark PDF',
    tagline: 'Stamp text or image watermarks onto pages',
    description: 'Overlay custom text or image stamps with configurable opacity, rotation, and positioning.',
    category: 'organize',
    iconName: 'Stamp',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_page_numbers',
    name: 'Page Numbers',
    tagline: 'Add custom page numbers and counters to PDF',
    description: 'Stamp sequential page numbering with flexible format templates and margin controls.',
    category: 'organize',
    iconName: 'Hash',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_protect',
    name: 'Protect PDF',
    tagline: 'Encrypt and lock your PDF with AES-256',
    description: 'Secure sensitive PDF files with password protection and strict AES-256 encryption.',
    category: 'organize',
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
    category: 'organize',
    iconName: 'Unlock',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'pdf_crop',
    name: 'Crop PDF',
    tagline: 'Trim page margins and adjust visible area',
    description: 'Trim page margins by customizing MediaBox and CropBox coordinates with millimeter precision.',
    category: 'organize',
    iconName: 'Crop',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'images_to_pdf',
    name: 'Images to PDF',
    tagline: 'Convert PNG, JPG, WebP images into a single PDF',
    description: 'Compile multiple images into a standard A4, Letter, or Fit-dimension PDF document.',
    category: 'convert',
    iconName: 'FileImage',
    badge: 'Fast',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },
  {
    id: 'image_studio',
    name: 'Image Studio',
    tagline: 'Batch compress, resize, & convert formats',
    description: 'Convert between JPEG, PNG, and WebP with high-speed compression and custom resizing.',
    category: 'image',
    iconName: 'Sparkles',
    badge: 'Popular',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },
  {
    id: 'image_watermark',
    name: 'Watermark Image',
    tagline: 'Overlay text or logo watermark onto images',
    description: 'Protect creative visual assets with custom translucent text or brand logo watermarks.',
    category: 'image',
    iconName: 'Stamp',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },
];

export function getToolMetadata(id: ToolId): ToolMetadata | undefined {
  return TOOL_CATALOG.find((tool) => tool.id === id);
}
