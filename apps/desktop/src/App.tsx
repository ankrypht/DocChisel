import React, { useState, useEffect, useRef } from 'react';
import {
  ToolId,
  getToolMetadata,
  JobRequest,
  JobOutput,
  PageSize,
  PageOrientation,
  ImageTargetFormat,
  ImageResizeMode,
  PageRotation,
  PdfSplitMode,
  FilterCategory,
  PdfCompressLevel,
  PdfWatermarkType,
  PdfWatermarkPosition,
  PdfPageNumbersPosition,
  PdfCropUnit,
  ImageWatermarkPosition,
} from '@docchisel/shared';
import { Header } from './components/Header';
import { ToolGrid } from './components/ToolGrid';
import { DropZone } from './components/DropZone';
import { PdfMergePanel } from './components/panels/PdfMergePanel';
import { PdfSplitPanel } from './components/panels/PdfSplitPanel';
import { PdfOrganizePanel } from './components/panels/PdfOrganizePanel';
import { PdfCompressPanel } from './components/panels/PdfCompressPanel';
import { PdfWatermarkPanel } from './components/panels/PdfWatermarkPanel';
import { PdfPageNumbersPanel } from './components/panels/PdfPageNumbersPanel';
import { PdfProtectPanel } from './components/panels/PdfProtectPanel';
import { PdfUnlockPanel } from './components/panels/PdfUnlockPanel';
import { PdfCropPanel } from './components/panels/PdfCropPanel';
import { ImagesToPdfPanel } from './components/panels/ImagesToPdfPanel';
import { ImageStudioPanel } from './components/panels/ImageStudioPanel';
import { ImageWatermarkPanel } from './components/panels/ImageWatermarkPanel';
import { ResultView } from './components/ResultView';
import {
  executeJobBridge,
  selectDirectoryDialog,
  getDefaultOutputDir,
} from './services/tauriBridge';
import { ArrowLeft, Play, Loader2, Folder, AlertCircle } from 'lucide-react';

function incrementFilename(name: string): string {
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

export const App: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<FilterCategory>('all');
  const [selectedToolId, setSelectedToolId] = useState<ToolId | null>(null);

  // Staging state
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [outputDir, setOutputDir] = useState<string>('~/Downloads/DocChisel');

  useEffect(() => {
    getDefaultOutputDir().then((dir) => {
      if (dir) {
        setOutputDir(dir);
      }
    });
  }, []);

  // Tool Specific States
  // 1. pdf_merge
  const [mergeOutputFilename, setMergeOutputFilename] = useState('merged_document.pdf');

  // 2. pdf_split
  const [splitMode, setSplitMode] = useState<PdfSplitMode>('burst');
  const [splitRanges, setSplitRanges] = useState('1-3, 5');

  // 3. pdf_organize
  const [organizeState, setOrganizeState] = useState<{
    rotations: PageRotation[];
    pageOrder: number[];
    deletedPages: number[];
  }>({
    rotations: [],
    pageOrder: [],
    deletedPages: [],
  });

  // 4. pdf_compress
  const [compressLevel, setCompressLevel] = useState<PdfCompressLevel>('recommended');
  const [compressFilename, setCompressFilename] = useState('compressed_document.pdf');

  // 5. pdf_watermark
  const [watermarkType, setWatermarkType] = useState<PdfWatermarkType>('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);
  const [watermarkColor, setWatermarkColor] = useState('#555555');
  const [watermarkImagePath, setWatermarkImagePath] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.35);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [watermarkPosition, setWatermarkPosition] = useState<PdfWatermarkPosition>('center');
  const [watermarkPages, setWatermarkPages] = useState('all');
  const [watermarkFilename, setWatermarkFilename] = useState('watermarked_document.pdf');

  // 6. pdf_page_numbers
  const [pageNumbersTemplate, setPageNumbersTemplate] = useState('Page {n} of {total}');
  const [pageNumbersPosition, setPageNumbersPosition] = useState<PdfPageNumbersPosition>('bottom_center');
  const [pageNumbersFontSize, setPageNumbersFontSize] = useState(10);
  const [pageNumbersMargin, setPageNumbersMargin] = useState(36);
  const [pageNumbersStart, setPageNumbersStart] = useState(1);
  const [pageNumbersPages, setPageNumbersPages] = useState('all');
  const [pageNumbersFilename, setPageNumbersFilename] = useState('numbered_document.pdf');

  // 7. pdf_protect
  const [protectPassword, setProtectPassword] = useState('');
  const [protectFilename, setProtectFilename] = useState('protected_document.pdf');

  // 8. pdf_unlock
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockFilename, setUnlockFilename] = useState('unlocked_document.pdf');

  // 9. pdf_crop
  const [cropMarginTop, setCropMarginTop] = useState(25);
  const [cropMarginBottom, setCropMarginBottom] = useState(25);
  const [cropMarginLeft, setCropMarginLeft] = useState(25);
  const [cropMarginRight, setCropMarginRight] = useState(25);
  const [cropUnit, setCropUnit] = useState<PdfCropUnit>('pt');
  const [cropFilename, setCropFilename] = useState('cropped_document.pdf');

  // 10. images_to_pdf
  const [imagesToPdfSize, setImagesToPdfSize] = useState<PageSize>('a4');
  const [imagesToPdfOrientation, setImagesToPdfOrientation] = useState<PageOrientation>('auto');
  const [imagesToPdfMargin, setImagesToPdfMargin] = useState(10);
  const [imagesToPdfFilename, setImagesToPdfFilename] = useState('images_document.pdf');

  // 11. image_studio
  const [imageStudioFormat, setImageStudioFormat] = useState<ImageTargetFormat>('webp');
  const [imageStudioQuality, setImageStudioQuality] = useState(80);
  const [imageStudioResizeMode, setImageStudioResizeMode] = useState<ImageResizeMode>('none');
  const [imageStudioWidth, setImageStudioWidth] = useState(1920);
  const [imageStudioHeight, setImageStudioHeight] = useState(1080);
  const [imageStudioScale, setImageStudioScale] = useState(75);
  const [imageStudioAspectRatio, setImageStudioAspectRatio] = useState(true);

  // 12. image_watermark
  const [imageWatermarkType, setImageWatermarkType] = useState<PdfWatermarkType>('text');
  const [imageWatermarkText, setImageWatermarkText] = useState('© DocChisel');
  const [imageWatermarkFontSize, setImageWatermarkFontSize] = useState(32);
  const [imageWatermarkColor, setImageWatermarkColor] = useState('#FFFFFF');
  const [imageWatermarkPath, setImageWatermarkPath] = useState('');
  const [imageWatermarkOpacity, setImageWatermarkOpacity] = useState(0.5);
  const [imageWatermarkPosition, setImageWatermarkPosition] = useState<ImageWatermarkPosition>('bottom_right');
  const [imageWatermarkMargin, setImageWatermarkMargin] = useState(20);

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobResult, setJobResult] = useState<JobOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically reset main scroll position to top when switching tools, running jobs, or resetting
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [selectedToolId, jobResult]);

  const selectedTool = selectedToolId ? getToolMetadata(selectedToolId) : null;

  const handleSelectTool = (id: ToolId) => {
    setSelectedToolId(id);
    setStagedFiles([]);
    setJobResult(null);
    setErrorMessage(null);
  };

  const handleBack = () => {
    setSelectedToolId(null);
    setStagedFiles([]);
    setJobResult(null);
    setErrorMessage(null);
  };

  const handlePickOutputDir = async () => {
    const dir = await selectDirectoryDialog();
    if (dir) {
      setOutputDir(dir);
    }
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    if (stagedFiles.length < selectedTool.minFiles) {
      setErrorMessage(
        `This tool requires at least ${selectedTool.minFiles} file(s) to process.`
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    let request: JobRequest;
    switch (selectedTool.id) {
      case 'pdf_merge':
        request = {
          action: 'pdf_merge',
          params: {
            input_paths: stagedFiles,
            output_dir: outputDir,
            output_filename: mergeOutputFilename || undefined,
          },
        };
        break;
      case 'pdf_split':
        request = {
          action: 'pdf_split',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            mode: splitMode,
            ranges: splitMode === 'ranges' ? splitRanges : undefined,
          },
        };
        break;
      case 'pdf_organize':
        request = {
          action: 'pdf_organize',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            rotations: organizeState.rotations.length > 0 ? organizeState.rotations : undefined,
            page_order: organizeState.pageOrder.length > 0 ? organizeState.pageOrder : undefined,
            deleted_pages: organizeState.deletedPages.length > 0 ? organizeState.deletedPages : undefined,
          },
        };
        break;
      case 'pdf_compress':
        request = {
          action: 'pdf_compress',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            level: compressLevel,
            output_filename: compressFilename || undefined,
          },
        };
        break;
      case 'pdf_watermark':
        request = {
          action: 'pdf_watermark',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            watermark_type: watermarkType,
            text: watermarkType === 'text' ? watermarkText : undefined,
            font_size: watermarkType === 'text' ? watermarkFontSize : undefined,
            color: watermarkType === 'text' ? watermarkColor : undefined,
            image_path: watermarkType === 'image' ? watermarkImagePath : undefined,
            opacity: watermarkOpacity,
            rotation: watermarkRotation,
            position: watermarkPosition,
            pages: watermarkPages || undefined,
            output_filename: watermarkFilename || undefined,
          },
        };
        break;
      case 'pdf_page_numbers':
        request = {
          action: 'pdf_page_numbers',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            format_template: pageNumbersTemplate,
            position: pageNumbersPosition,
            font_size: pageNumbersFontSize,
            margin_pt: pageNumbersMargin,
            start_page_number: pageNumbersStart,
            pages: pageNumbersPages || undefined,
            output_filename: pageNumbersFilename || undefined,
          },
        };
        break;
      case 'pdf_protect':
        if (!protectPassword.trim()) {
          setIsProcessing(false);
          setErrorMessage('Please enter a password to protect the document.');
          return;
        }
        request = {
          action: 'pdf_protect',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            user_password: protectPassword,
            output_filename: protectFilename || undefined,
          },
        };
        break;
      case 'pdf_unlock':
        if (!unlockPassword.trim()) {
          setIsProcessing(false);
          setErrorMessage('Please enter the document password to unlock.');
          return;
        }
        request = {
          action: 'pdf_unlock',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            password: unlockPassword,
            output_filename: unlockFilename || undefined,
          },
        };
        break;
      case 'pdf_crop':
        request = {
          action: 'pdf_crop',
          params: {
            input_path: stagedFiles[0],
            output_dir: outputDir,
            margin_top: cropMarginTop,
            margin_bottom: cropMarginBottom,
            margin_left: cropMarginLeft,
            margin_right: cropMarginRight,
            unit: cropUnit,
            output_filename: cropFilename || undefined,
          },
        };
        break;
      case 'images_to_pdf':
        request = {
          action: 'images_to_pdf',
          params: {
            input_paths: stagedFiles,
            output_dir: outputDir,
            output_filename: imagesToPdfFilename || undefined,
            page_size: imagesToPdfSize,
            orientation: imagesToPdfOrientation,
            margin_mm: imagesToPdfMargin,
          },
        };
        break;
      case 'image_studio':
        request = {
          action: 'image_studio',
          params: {
            input_paths: stagedFiles,
            output_dir: outputDir,
            format: imageStudioFormat,
            quality: imageStudioQuality,
            resize_mode: imageStudioResizeMode,
            target_width: imageStudioResizeMode === 'dimensions' ? imageStudioWidth : undefined,
            target_height: imageStudioResizeMode === 'dimensions' ? imageStudioHeight : undefined,
            scale_percentage: imageStudioResizeMode === 'percentage' ? imageStudioScale : undefined,
            maintain_aspect_ratio: imageStudioAspectRatio,
          },
        };
        break;
      case 'image_watermark':
        request = {
          action: 'image_watermark',
          params: {
            input_paths: stagedFiles,
            output_dir: outputDir,
            watermark_type: imageWatermarkType,
            text: imageWatermarkType === 'text' ? imageWatermarkText : undefined,
            font_size: imageWatermarkType === 'text' ? imageWatermarkFontSize : undefined,
            color: imageWatermarkType === 'text' ? imageWatermarkColor : undefined,
            watermark_image_path: imageWatermarkType === 'image' ? imageWatermarkPath : undefined,
            opacity: imageWatermarkOpacity,
            position: imageWatermarkPosition,
            margin: imageWatermarkMargin,
          },
        };
        break;
    }

    const response = await executeJobBridge(request);
    setIsProcessing(false);

    if (response.success && response.output) {
      setJobResult(response.output);
      // Auto-advance default filenames for subsequent operations
      if (selectedTool.id === 'pdf_merge') {
        setMergeOutputFilename((prev) => incrementFilename(prev || 'merged_document.pdf'));
      } else if (selectedTool.id === 'images_to_pdf') {
        setImagesToPdfFilename((prev) => incrementFilename(prev || 'images_document.pdf'));
      }
    } else {
      setErrorMessage(response.error?.message || 'Processing failed');
    }
  };

  return (
    <div className="h-full w-full bg-canvas text-gray-100 flex flex-col overflow-hidden">
      <Header
        toolSelected={!!selectedToolId}
        onHomeClick={handleBack}
      />

      <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {!selectedTool ? (
          <ToolGrid
            currentCategory={category}
            onSelectCategory={setCategory}
            onSelectTool={handleSelectTool}
          />
        ) : jobResult ? (
          <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-2 text-xs font-semibold text-textSecondary hover:text-textPrimary px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surfaceElevated transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Tools</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block">Current Task</span>
                <span className="text-xs font-bold text-textPrimary">{selectedTool.name}</span>
              </div>
            </div>

            <ResultView
              output={jobResult}
              outputDir={outputDir}
              onReset={() => {
                setJobResult(null);
                setStagedFiles([]);
              }}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
            {/* Nav Back & Tool Meta Bar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-2 text-xs font-semibold text-textSecondary hover:text-textPrimary px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surfaceElevated transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Tools</span>
              </button>

              <div className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <h3 className="text-sm font-bold text-textPrimary">{selectedTool.name}</h3>
                  {selectedTool.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary border border-primary/20">
                      {selectedTool.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-textMuted">{selectedTool.tagline}</p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger flex items-start space-x-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">Execution Error</span>
                  <span className="text-[11px] leading-relaxed block mt-0.5">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* File Staging Box */}
            <DropZone
              acceptedExtensions={selectedTool.acceptedExtensions}
              multiFile={selectedTool.multiFile}
              minFiles={selectedTool.minFiles}
              files={stagedFiles}
              onFilesChange={setStagedFiles}
            />

            {/* Tool-specific Settings Panels (Rendered when files are staged) */}
            {stagedFiles.length > 0 && (
              <>
                {selectedTool.id === 'pdf_merge' && (
                  <PdfMergePanel
                    outputFilename={mergeOutputFilename}
                    onChangeOutputFilename={setMergeOutputFilename}
                  />
                )}
                {selectedTool.id === 'pdf_split' && (
                  <PdfSplitPanel
                    filePath={stagedFiles[0]}
                    mode={splitMode}
                    onChangeMode={setSplitMode}
                    ranges={splitRanges}
                    onChangeRanges={setSplitRanges}
                  />
                )}
                {selectedTool.id === 'pdf_organize' && (
                  <PdfOrganizePanel
                    filePath={stagedFiles[0]}
                    onStateChange={setOrganizeState}
                  />
                )}
                {selectedTool.id === 'pdf_compress' && (
                  <PdfCompressPanel
                    level={compressLevel}
                    onChangeLevel={setCompressLevel}
                    outputFilename={compressFilename}
                    onChangeOutputFilename={setCompressFilename}
                  />
                )}
                {selectedTool.id === 'pdf_watermark' && (
                  <PdfWatermarkPanel
                    watermarkType={watermarkType}
                    onChangeWatermarkType={setWatermarkType}
                    text={watermarkText}
                    onChangeText={setWatermarkText}
                    fontSize={watermarkFontSize}
                    onChangeFontSize={setWatermarkFontSize}
                    color={watermarkColor}
                    onChangeColor={setWatermarkColor}
                    imagePath={watermarkImagePath}
                    onChangeImagePath={setWatermarkImagePath}
                    opacity={watermarkOpacity}
                    onChangeOpacity={setWatermarkOpacity}
                    rotation={watermarkRotation}
                    onChangeRotation={setWatermarkRotation}
                    position={watermarkPosition}
                    onChangePosition={setWatermarkPosition}
                    pages={watermarkPages}
                    onChangePages={setWatermarkPages}
                    outputFilename={watermarkFilename}
                    onChangeOutputFilename={setWatermarkFilename}
                  />
                )}
                {selectedTool.id === 'pdf_page_numbers' && (
                  <PdfPageNumbersPanel
                    formatTemplate={pageNumbersTemplate}
                    onChangeFormatTemplate={setPageNumbersTemplate}
                    position={pageNumbersPosition}
                    onChangePosition={setPageNumbersPosition}
                    fontSize={pageNumbersFontSize}
                    onChangeFontSize={setPageNumbersFontSize}
                    marginPt={pageNumbersMargin}
                    onChangeMarginPt={setPageNumbersMargin}
                    startPageNumber={pageNumbersStart}
                    onChangeStartPageNumber={setPageNumbersStart}
                    pages={pageNumbersPages}
                    onChangePages={setPageNumbersPages}
                    outputFilename={pageNumbersFilename}
                    onChangeOutputFilename={setPageNumbersFilename}
                  />
                )}
                {selectedTool.id === 'pdf_protect' && (
                  <PdfProtectPanel
                    userPassword={protectPassword}
                    onChangeUserPassword={setProtectPassword}
                    outputFilename={protectFilename}
                    onChangeOutputFilename={setProtectFilename}
                  />
                )}
                {selectedTool.id === 'pdf_unlock' && (
                  <PdfUnlockPanel
                    password={unlockPassword}
                    onChangePassword={setUnlockPassword}
                    outputFilename={unlockFilename}
                    onChangeOutputFilename={setUnlockFilename}
                  />
                )}
                {selectedTool.id === 'pdf_crop' && (
                  <PdfCropPanel
                    marginTop={cropMarginTop}
                    onChangeMarginTop={setCropMarginTop}
                    marginBottom={cropMarginBottom}
                    onChangeMarginBottom={setCropMarginBottom}
                    marginLeft={cropMarginLeft}
                    onChangeMarginLeft={setCropMarginLeft}
                    marginRight={cropMarginRight}
                    onChangeMarginRight={setCropMarginRight}
                    unit={cropUnit}
                    onChangeUnit={setCropUnit}
                    outputFilename={cropFilename}
                    onChangeOutputFilename={setCropFilename}
                  />
                )}
                {selectedTool.id === 'images_to_pdf' && (
                  <ImagesToPdfPanel
                    files={stagedFiles}
                    pageSize={imagesToPdfSize}
                    onChangePageSize={setImagesToPdfSize}
                    orientation={imagesToPdfOrientation}
                    onChangeOrientation={setImagesToPdfOrientation}
                    marginMm={imagesToPdfMargin}
                    onChangeMarginMm={setImagesToPdfMargin}
                    outputFilename={imagesToPdfFilename}
                    onChangeOutputFilename={setImagesToPdfFilename}
                  />
                )}
                {selectedTool.id === 'image_studio' && (
                  <ImageStudioPanel
                    files={stagedFiles}
                    format={imageStudioFormat}
                    onChangeFormat={setImageStudioFormat}
                    quality={imageStudioQuality}
                    onChangeQuality={setImageStudioQuality}
                    resizeMode={imageStudioResizeMode}
                    onChangeResizeMode={setImageStudioResizeMode}
                    targetWidth={imageStudioWidth}
                    onChangeTargetWidth={setImageStudioWidth}
                    targetHeight={imageStudioHeight}
                    onChangeTargetHeight={setImageStudioHeight}
                    scalePercentage={imageStudioScale}
                    onChangeScalePercentage={setImageStudioScale}
                    maintainAspectRatio={imageStudioAspectRatio}
                    onChangeMaintainAspectRatio={setImageStudioAspectRatio}
                  />
                )}
                {selectedTool.id === 'image_watermark' && (
                  <ImageWatermarkPanel
                    watermarkType={imageWatermarkType}
                    onChangeWatermarkType={setImageWatermarkType}
                    text={imageWatermarkText}
                    onChangeText={setImageWatermarkText}
                    fontSize={imageWatermarkFontSize}
                    onChangeFontSize={setImageWatermarkFontSize}
                    color={imageWatermarkColor}
                    onChangeColor={setImageWatermarkColor}
                    watermarkImagePath={imageWatermarkPath}
                    onChangeWatermarkImagePath={setImageWatermarkPath}
                    opacity={imageWatermarkOpacity}
                    onChangeOpacity={setImageWatermarkOpacity}
                    position={imageWatermarkPosition}
                    onChangePosition={setImageWatermarkPosition}
                    margin={imageWatermarkMargin}
                    onChangeMargin={setImageWatermarkMargin}
                  />
                )}

                {/* Output Directory Chooser */}
                <div className="bg-surface rounded-2xl border border-border p-4 flex items-center justify-between text-xs">
                  <div className="truncate mr-3">
                    <span className="text-textMuted font-semibold text-[11px] block mb-0.5">Destination Directory</span>
                    <span className="font-mono text-textSecondary truncate block text-[11px]">{outputDir}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePickOutputDir}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surfaceElevated hover:bg-surface text-textSecondary hover:text-textPrimary border border-border transition-colors shrink-0 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-primary" />
                    <span>Change</span>
                  </button>
                </div>

                {/* Execute Job Action Button */}
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={isProcessing || stagedFiles.length < selectedTool.minFiles}
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-[#0077ED] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 border-t border-white/15 flex items-center justify-center space-x-2.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing Locally...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Run {selectedTool.name}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
