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

export const TOOL_CATALOG: ToolMetadata[] = [
  {
    id: 'pdf_merge',
    name: 'Merge PDF',
    tagline: 'Combine multiple PDFs into one unified document',
    description: 'Merge PDFs in the exact order you want with high-speed local processing.',
    category: 'pdf',
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
    category: 'pdf',
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
    category: 'pdf',
    iconName: 'LayoutGrid',
    acceptedExtensions: ['.pdf'],
    multiFile: false,
    minFiles: 1,
  },
  {
    id: 'images_to_pdf',
    name: 'Images to PDF',
    tagline: 'Convert PNG, JPG, WebP images into a single PDF',
    description: 'Compile multiple images into a standard A4, Letter, or Fit-dimension PDF document.',
    category: 'pdf',
    iconName: 'FileImage',
    badge: 'Fast',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },
  {
    id: 'image_studio',
    name: 'Image Studio',
    tagline: 'Batch compress, resize via SIMD, & convert formats',
    description: 'Hardware-accelerated image pipeline. Convert between JPEG, PNG, and WebP with fine quality and Lanczos3 resizing.',
    category: 'image',
    iconName: 'Sparkles',
    badge: 'SIMD Accelerated',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    multiFile: true,
    minFiles: 1,
  },
];

export function getToolMetadata(id: ToolId): ToolMetadata | undefined {
  return TOOL_CATALOG.find((tool) => tool.id === id);
}
