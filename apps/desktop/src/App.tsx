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
} from '@docchisel/shared';
import { Header } from './components/Header';
import { ToolGrid } from './components/ToolGrid';
import { DropZone } from './components/DropZone';
import { PdfMergePanel } from './components/panels/PdfMergePanel';
import { PdfSplitPanel } from './components/panels/PdfSplitPanel';
import { PdfOrganizePanel } from './components/panels/PdfOrganizePanel';
import { ImagesToPdfPanel } from './components/panels/ImagesToPdfPanel';
import { ImageStudioPanel } from './components/panels/ImageStudioPanel';
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

  // 4. images_to_pdf
  const [imagesToPdfSize, setImagesToPdfSize] = useState<PageSize>('a4');
  const [imagesToPdfOrientation, setImagesToPdfOrientation] = useState<PageOrientation>('auto');
  const [imagesToPdfMargin, setImagesToPdfMargin] = useState(10);
  const [imagesToPdfFilename, setImagesToPdfFilename] = useState('images_document.pdf');

  // 5. image_studio
  const [imageStudioFormat, setImageStudioFormat] = useState<ImageTargetFormat>('webp');
  const [imageStudioQuality, setImageStudioQuality] = useState(80);
  const [imageStudioResizeMode, setImageStudioResizeMode] = useState<ImageResizeMode>('none');
  const [imageStudioWidth, setImageStudioWidth] = useState(1920);
  const [imageStudioHeight, setImageStudioHeight] = useState(1080);
  const [imageStudioScale, setImageStudioScale] = useState(75);
  const [imageStudioAspectRatio, setImageStudioAspectRatio] = useState(true);

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
                <h2 className="text-lg font-bold text-textPrimary">{selectedTool.name}</h2>
                <p className="text-xs text-textMuted">{selectedTool.tagline}</p>
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
          <div className="max-w-4xl mx-auto px-6 pt-6 pb-28 space-y-6">
            {/* Top Bar Navigation */}
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
                <h2 className="text-lg font-bold text-textPrimary">{selectedTool.name}</h2>
                <p className="text-xs text-textMuted">{selectedTool.tagline}</p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* File Staging DropZone */}
            <DropZone
              files={stagedFiles}
              onFilesChange={setStagedFiles}
              acceptedExtensions={selectedTool.acceptedExtensions}
              multiFile={selectedTool.multiFile}
              minFiles={selectedTool.minFiles}
            />

            {/* Tool-specific parameter panels (shown when files are staged) */}
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
