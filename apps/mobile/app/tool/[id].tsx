import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getToolMetadata,
  ToolId,
  JobRequest,
  PageSize,
  PageOrientation,
  ImageTargetFormat,
  ImageResizeMode,
  PageRotation,
  PdfSplitMode,
  PdfCompressLevel,
  PdfWatermarkType,
  PdfWatermarkPosition,
  PdfPageNumbersPosition,
  PdfCropUnit,
  ImageWatermarkPosition,
  JobOutput,
  TOOL_THEMES,
} from '@docchisel/shared';
import {
  pickPdfDocuments,
  pickImages,
  pickImageDocuments,
  executeJobMobile,
  getAppOutputDir,
  incrementFilename,
} from '../../services/mobileBridge';
import { loadSampleFilesForTool } from '../../services/devSampleLoader';
import { FilePickerBox } from '../../components/FilePickerBox';
import { ResultView } from '../../components/ResultView';
import { PdfMergePanel } from '../../components/panels/PdfMergePanel';
import { PdfSplitPanel } from '../../components/panels/PdfSplitPanel';
import { PdfOrganizePanel } from '../../components/panels/PdfOrganizePanel';
import { ImagesToPdfPanel } from '../../components/panels/ImagesToPdfPanel';
import { ImageStudioPanel } from '../../components/panels/ImageStudioPanel';
import { PdfCompressPanel } from '../../components/panels/PdfCompressPanel';
import { PdfWatermarkPanel } from '../../components/panels/PdfWatermarkPanel';
import { PdfPageNumbersPanel } from '../../components/panels/PdfPageNumbersPanel';
import { PdfProtectPanel } from '../../components/panels/PdfProtectPanel';
import { PdfUnlockPanel } from '../../components/panels/PdfUnlockPanel';
import { PdfCropPanel } from '../../components/panels/PdfCropPanel';
import { ImageWatermarkPanel } from '../../components/panels/ImageWatermarkPanel';
import { ArrowLeft, Play, AlertCircle, Folder, Sparkles } from 'lucide-react-native';

export default function ToolWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tool = getToolMetadata(id as ToolId);
  const theme = tool ? TOOL_THEMES[tool.id] || TOOL_THEMES.pdf_merge : TOOL_THEMES.pdf_merge;

  // Staging state
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [outputDir, setOutputDir] = useState<string>('App Cache Directory');

  // Load real app output dir on mount
  useEffect(() => {
    getAppOutputDir().then(setOutputDir).catch(console.warn);
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

  // 6. pdf_compress
  const [compressLevel, setCompressLevel] = useState<PdfCompressLevel>('recommended');
  const [compressFilename, setCompressFilename] = useState('');

  // 7. pdf_watermark
  const [pdfWatermarkType, setPdfWatermarkType] = useState<PdfWatermarkType>('text');
  const [pdfWatermarkText, setPdfWatermarkText] = useState('CONFIDENTIAL');
  const [pdfWatermarkFontSize, setPdfWatermarkFontSize] = useState(48);
  const [pdfWatermarkColor, setPdfWatermarkColor] = useState('#FF0000');
  const [pdfWatermarkImagePath, setPdfWatermarkImagePath] = useState('');
  const [pdfWatermarkOpacity, setPdfWatermarkOpacity] = useState(0.3);
  const [pdfWatermarkRotation, setPdfWatermarkRotation] = useState(45);
  const [pdfWatermarkPosition, setPdfWatermarkPosition] = useState<PdfWatermarkPosition>('center');
  const [pdfWatermarkPages, setPdfWatermarkPages] = useState('all');
  const [pdfWatermarkFilename, setPdfWatermarkFilename] = useState('');

  // 8. pdf_page_numbers
  const [pageNumbersFormat, setPageNumbersFormat] = useState('Page {n} of {total}');
  const [pageNumbersPosition, setPageNumbersPosition] = useState<PdfPageNumbersPosition>('bottom_center');
  const [pageNumbersFontSize, setPageNumbersFontSize] = useState(10);
  const [pageNumbersMarginPt, setPageNumbersMarginPt] = useState(30);
  const [pageNumbersStart, setPageNumbersStart] = useState(1);
  const [pageNumbersPages, setPageNumbersPages] = useState('all');
  const [pageNumbersFilename, setPageNumbersFilename] = useState('');

  // 9. pdf_protect
  const [protectUserPassword, setProtectUserPassword] = useState('');
  const [protectFilename, setProtectFilename] = useState('');

  // 10. pdf_unlock
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockFilename, setUnlockFilename] = useState('');

  // 11. pdf_crop
  const [cropMarginTop, setCropMarginTop] = useState(20);
  const [cropMarginBottom, setCropMarginBottom] = useState(20);
  const [cropMarginLeft, setCropMarginLeft] = useState(20);
  const [cropMarginRight, setCropMarginRight] = useState(20);
  const [cropUnit, setCropUnit] = useState<PdfCropUnit>('pt');
  const [cropFilename, setCropFilename] = useState('');

  // 12. image_watermark
  const [imageWatermarkType, setImageWatermarkType] = useState<PdfWatermarkType>('text');
  const [imageWatermarkText, setImageWatermarkText] = useState('© DocChisel');
  const [imageWatermarkFontSize, setImageWatermarkFontSize] = useState(36);
  const [imageWatermarkColor, setImageWatermarkColor] = useState('#FFFFFF');
  const [imageWatermarkImagePath, setImageWatermarkImagePath] = useState('');
  const [imageWatermarkOpacity, setImageWatermarkOpacity] = useState(0.5);
  const [imageWatermarkPosition, setImageWatermarkPosition] = useState<ImageWatermarkPosition>('bottom_right');
  const [imageWatermarkMargin, setImageWatermarkMargin] = useState(20);

  // Execution State
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobResult, setJobResult] = useState<JobOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically reset scroll to top when job finishes or when resetting
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [jobResult]);

  if (!tool) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center p-6">
        <Text className="text-textPrimary text-base font-semibold">Tool Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-primary px-4 py-2.5 rounded-xl"
        >
          <Text className="text-white text-sm font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isImageTool =
    tool.id === 'images_to_pdf' ||
    tool.category === 'img_optimize' ||
    tool.category === 'img_security' ||
    !tool.acceptedExtensions.includes('.pdf');

  const addUris = (uris: string[]) => {
    if (uris.length > 0) {
      if (tool.multiFile) {
        setStagedFiles((prev) => Array.from(new Set([...prev, ...uris])));
      } else {
        setStagedFiles(uris.slice(0, 1));
      }
      setJobResult(null);
      setErrorMessage(null);
    }
  };

  const handleLoadSampleFiles = async () => {
    try {
      setIsProcessing(true);
      const paths = await loadSampleFilesForTool(tool.id);
      setStagedFiles(paths);
      setErrorMessage(null);
      setJobResult(null);
    } catch (err: unknown) {
      setErrorMessage(
        `Failed to load dev sample files: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFiles = async () => {
    if (!isImageTool) {
      const uris = await pickPdfDocuments(tool.multiFile);
      addUris(uris);
      return;
    }

    Alert.alert(
      'Select Images',
      'Choose where you would like to pick images from:',
      [
        {
          text: 'Photo Library',
          onPress: async () => {
            const uris = await pickImages(tool.multiFile);
            addUris(uris);
          },
        },
        {
          text: 'Device Files / Downloads',
          onPress: async () => {
            const uris = await pickImageDocuments(tool.multiFile);
            addUris(uris);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRemoveFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    setJobResult(null);
  };

  const handleClearFiles = () => {
    setStagedFiles([]);
    setJobResult(null);
    setErrorMessage(null);
  };

  const handleExecute = async () => {
    if (stagedFiles.length < tool.minFiles) {
      setErrorMessage(
        `This tool requires at least ${tool.minFiles} file(s) to process.`
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const appOutputDir = await getAppOutputDir();
      setOutputDir(appOutputDir);

      let request: JobRequest;
      switch (tool.id) {
        case 'pdf_merge':
          request = {
            action: 'pdf_merge',
            params: {
              input_paths: stagedFiles,
              output_dir: appOutputDir,
              output_filename: mergeOutputFilename || undefined,
            },
          };
          break;
        case 'pdf_split':
          request = {
            action: 'pdf_split',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
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
              output_dir: appOutputDir,
              rotations:
                organizeState.rotations.length > 0 ? organizeState.rotations : undefined,
              page_order:
                organizeState.pageOrder.length > 0 ? organizeState.pageOrder : undefined,
              deleted_pages:
                organizeState.deletedPages.length > 0
                  ? organizeState.deletedPages
                  : undefined,
            },
          };
          break;
        case 'images_to_pdf':
          request = {
            action: 'images_to_pdf',
            params: {
              input_paths: stagedFiles,
              output_dir: appOutputDir,
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
              output_dir: appOutputDir,
              format: imageStudioFormat,
              quality: imageStudioQuality,
              resize_mode: imageStudioResizeMode,
              target_width:
                imageStudioResizeMode === 'dimensions' ? imageStudioWidth : undefined,
              target_height:
                imageStudioResizeMode === 'dimensions' ? imageStudioHeight : undefined,
              scale_percentage:
                imageStudioResizeMode === 'percentage' ? imageStudioScale : undefined,
              maintain_aspect_ratio: imageStudioAspectRatio,
            },
          };
          break;
        case 'pdf_compress':
          request = {
            action: 'pdf_compress',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
              output_filename: compressFilename || undefined,
              level: compressLevel,
            },
          };
          break;
        case 'pdf_watermark':
          request = {
            action: 'pdf_watermark',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
              output_filename: pdfWatermarkFilename || undefined,
              watermark_type: pdfWatermarkType,
              text: pdfWatermarkType === 'text' ? pdfWatermarkText : undefined,
              font_size: pdfWatermarkType === 'text' ? pdfWatermarkFontSize : undefined,
              color: pdfWatermarkType === 'text' ? pdfWatermarkColor : undefined,
              image_path: pdfWatermarkType === 'image' ? pdfWatermarkImagePath : undefined,
              opacity: pdfWatermarkOpacity,
              rotation: pdfWatermarkRotation,
              position: pdfWatermarkPosition,
              pages: pdfWatermarkPages || undefined,
            },
          };
          break;
        case 'pdf_page_numbers':
          request = {
            action: 'pdf_page_numbers',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
              output_filename: pageNumbersFilename || undefined,
              format_template: pageNumbersFormat,
              position: pageNumbersPosition,
              font_size: pageNumbersFontSize,
              margin_pt: pageNumbersMarginPt,
              start_page_number: pageNumbersStart,
              pages: pageNumbersPages || undefined,
            },
          };
          break;
        case 'pdf_protect':
          if (!protectUserPassword) {
            setErrorMessage('Please enter a password to protect the document.');
            setIsProcessing(false);
            return;
          }
          request = {
            action: 'pdf_protect',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
              output_filename: protectFilename || undefined,
              user_password: protectUserPassword,
            },
          };
          break;
        case 'pdf_unlock':
          if (!unlockPassword) {
            setErrorMessage('Please enter the password to unlock the document.');
            setIsProcessing(false);
            return;
          }
          request = {
            action: 'pdf_unlock',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
              output_filename: unlockFilename || undefined,
              password: unlockPassword,
            },
          };
          break;
        case 'pdf_crop':
          request = {
            action: 'pdf_crop',
            params: {
              input_path: stagedFiles[0],
              output_dir: appOutputDir,
              output_filename: cropFilename || undefined,
              margin_top: cropMarginTop,
              margin_bottom: cropMarginBottom,
              margin_left: cropMarginLeft,
              margin_right: cropMarginRight,
              unit: cropUnit,
            },
          };
          break;
        case 'image_watermark':
          request = {
            action: 'image_watermark',
            params: {
              input_paths: stagedFiles,
              output_dir: appOutputDir,
              watermark_type: imageWatermarkType,
              text: imageWatermarkType === 'text' ? imageWatermarkText : undefined,
              font_size: imageWatermarkType === 'text' ? imageWatermarkFontSize : undefined,
              color: imageWatermarkType === 'text' ? imageWatermarkColor : undefined,
              watermark_image_path:
                imageWatermarkType === 'image' ? imageWatermarkImagePath : undefined,
              opacity: imageWatermarkOpacity,
              position: imageWatermarkPosition,
              margin: imageWatermarkMargin,
            },
          };
          break;
      }

      const response = await executeJobMobile(request);

      if (response.success && response.output) {
        setJobResult(response.output);
        // Auto-advance default filenames for subsequent operations
        if (tool.id === 'pdf_merge') {
          setMergeOutputFilename((prev) => incrementFilename(prev || 'merged_document.pdf'));
        } else if (tool.id === 'images_to_pdf') {
          setImagesToPdfFilename((prev) => incrementFilename(prev || 'images_document.pdf'));
        } else if (tool.id === 'pdf_compress' && compressFilename) {
          setCompressFilename((prev) => incrementFilename(prev));
        } else if (tool.id === 'pdf_watermark' && pdfWatermarkFilename) {
          setPdfWatermarkFilename((prev) => incrementFilename(prev));
        } else if (tool.id === 'pdf_page_numbers' && pageNumbersFilename) {
          setPageNumbersFilename((prev) => incrementFilename(prev));
        } else if (tool.id === 'pdf_protect' && protectFilename) {
          setProtectFilename((prev) => incrementFilename(prev));
        } else if (tool.id === 'pdf_unlock' && unlockFilename) {
          setUnlockFilename((prev) => incrementFilename(prev));
        } else if (tool.id === 'pdf_crop' && cropFilename) {
          setCropFilename((prev) => incrementFilename(prev));
        }
      } else {
        setErrorMessage(response.error?.message || 'Processing failed');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Expanded comfortable responsive container for tablets and multi-windows */}
        <View className="max-w-5xl mx-auto w-full">
          {/* Top Bar Navigation */}
          <View className="mt-1 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity
                testID="back-button"
                accessibilityLabel="Go back to all tools"
                accessibilityRole="button"
                onPress={() => router.back()}
                className="flex-row items-center bg-surface border border-border px-3.5 py-2 rounded-xl"
              >
                <ArrowLeft size={16} color="#A1A1AA" />
                <Text className="text-textSecondary text-sm font-semibold ml-2">
                  All Tools
                </Text>
              </TouchableOpacity>

              {tool.badge && (
                <View
                  style={{
                    backgroundColor: `${theme.hexColor}1A`,
                    borderColor: `${theme.hexColor}40`,
                  }}
                  className="px-2.5 py-1 rounded-full border"
                >
                  <Text
                    style={{ color: theme.hexColor }}
                    className="text-xs font-mono font-bold uppercase"
                  >
                    {tool.badge}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-textPrimary text-2xl font-black tracking-tight">
              {tool.name}
            </Text>
            <Text className="text-textMuted text-xs mt-1">
              {tool.tagline}
            </Text>
          </View>

        {/* Result View or Staged Workflow */}
        {jobResult ? (
          <ResultView
            output={jobResult}
            onReset={() => {
              setJobResult(null);
              setStagedFiles([]);
              setErrorMessage(null);
            }}
          />
        ) : (
          <View className="pb-16">
            {/* Error Message */}
            {errorMessage && (
              <View className="p-4 rounded-xl bg-danger/10 border border-danger/30 mb-4 flex-row items-center">
                <AlertCircle size={18} color="#EF4444" />
                <Text className="text-danger text-sm ml-2.5 flex-1 leading-5">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* DEV: Load Sample Test Files Button */}
            {__DEV__ && (
              <TouchableOpacity
                testID="dev-load-samples-button"
                accessibilityLabel="Load Sample Test Files"
                accessibilityRole="button"
                activeOpacity={0.8}
                onPress={handleLoadSampleFiles}
                disabled={isProcessing}
                className="mb-4 py-3 px-4 rounded-2xl bg-violet/15 border border-violet/30 flex-row items-center justify-center active:bg-violet/25 shadow-sm"
              >
                <Sparkles size={16} color="#8B5CF6" />
                <Text className="text-violet font-bold text-sm ml-2">
                  ⚡ DEV: Load Sample Test Files
                </Text>
              </TouchableOpacity>
            )}

            {/* Staging DropZone / FilePickerBox */}
            <FilePickerBox
              files={stagedFiles}
              onPick={handlePickFiles}
              onRemove={handleRemoveFile}
              onClear={handleClearFiles}
              onReorder={setStagedFiles}
              title={
                isImageTool
                  ? tool.multiFile
                    ? 'Tap to Choose Images'
                    : 'Tap to Choose Image'
                  : tool.multiFile
                  ? 'Tap to Choose PDFs'
                  : 'Tap to Choose PDF'
              }
              subtitle={`Supports ${tool.acceptedExtensions.join(', ')} • 100% processed locally on device`}
              multiple={tool.multiFile}
              minFiles={tool.minFiles}
            />

            {/* Tool-specific parameter panels (shown when files are staged) */}
            {stagedFiles.length > 0 && (
              <>
                {tool.id === 'pdf_merge' && (
                  <PdfMergePanel
                    outputFilename={mergeOutputFilename}
                    onChangeOutputFilename={setMergeOutputFilename}
                  />
                )}

                {tool.id === 'pdf_split' && (
                  <PdfSplitPanel
                    filePath={stagedFiles[0]}
                    mode={splitMode}
                    onChangeMode={setSplitMode}
                    ranges={splitRanges}
                    onChangeRanges={setSplitRanges}
                  />
                )}

                {tool.id === 'pdf_organize' && (
                  <PdfOrganizePanel
                    filePath={stagedFiles[0]}
                    onStateChange={setOrganizeState}
                  />
                )}

                {tool.id === 'images_to_pdf' && (
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

                {tool.id === 'image_studio' && (
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

                {tool.id === 'pdf_compress' && (
                  <PdfCompressPanel
                    level={compressLevel}
                    onChangeLevel={setCompressLevel}
                    outputFilename={compressFilename}
                    onChangeOutputFilename={setCompressFilename}
                  />
                )}

                {tool.id === 'pdf_watermark' && (
                  <PdfWatermarkPanel
                    watermarkType={pdfWatermarkType}
                    onChangeWatermarkType={setPdfWatermarkType}
                    text={pdfWatermarkText}
                    onChangeText={setPdfWatermarkText}
                    fontSize={pdfWatermarkFontSize}
                    onChangeFontSize={setPdfWatermarkFontSize}
                    color={pdfWatermarkColor}
                    onChangeColor={setPdfWatermarkColor}
                    imagePath={pdfWatermarkImagePath}
                    onChangeImagePath={setPdfWatermarkImagePath}
                    opacity={pdfWatermarkOpacity}
                    onChangeOpacity={setPdfWatermarkOpacity}
                    rotation={pdfWatermarkRotation}
                    onChangeRotation={setPdfWatermarkRotation}
                    position={pdfWatermarkPosition}
                    onChangePosition={setPdfWatermarkPosition}
                    pages={pdfWatermarkPages}
                    onChangePages={setPdfWatermarkPages}
                    outputFilename={pdfWatermarkFilename}
                    onChangeOutputFilename={setPdfWatermarkFilename}
                  />
                )}

                {tool.id === 'pdf_page_numbers' && (
                  <PdfPageNumbersPanel
                    formatTemplate={pageNumbersFormat}
                    onChangeFormatTemplate={setPageNumbersFormat}
                    position={pageNumbersPosition}
                    onChangePosition={setPageNumbersPosition}
                    fontSize={pageNumbersFontSize}
                    onChangeFontSize={setPageNumbersFontSize}
                    marginPt={pageNumbersMarginPt}
                    onChangeMarginPt={setPageNumbersMarginPt}
                    startPageNumber={pageNumbersStart}
                    onChangeStartPageNumber={setPageNumbersStart}
                    pages={pageNumbersPages}
                    onChangePages={setPageNumbersPages}
                    outputFilename={pageNumbersFilename}
                    onChangeOutputFilename={setPageNumbersFilename}
                  />
                )}

                {tool.id === 'pdf_protect' && (
                  <PdfProtectPanel
                    userPassword={protectUserPassword}
                    onChangeUserPassword={setProtectUserPassword}
                    outputFilename={protectFilename}
                    onChangeOutputFilename={setProtectFilename}
                  />
                )}

                {tool.id === 'pdf_unlock' && (
                  <PdfUnlockPanel
                    password={unlockPassword}
                    onChangePassword={setUnlockPassword}
                    outputFilename={unlockFilename}
                    onChangeOutputFilename={setUnlockFilename}
                  />
                )}

                {tool.id === 'pdf_crop' && (
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

                {tool.id === 'image_watermark' && (
                  <ImageWatermarkPanel
                    watermarkType={imageWatermarkType}
                    onChangeWatermarkType={setImageWatermarkType}
                    text={imageWatermarkText}
                    onChangeText={setImageWatermarkText}
                    fontSize={imageWatermarkFontSize}
                    onChangeFontSize={setImageWatermarkFontSize}
                    color={imageWatermarkColor}
                    onChangeColor={setImageWatermarkColor}
                    watermarkImagePath={imageWatermarkImagePath}
                    onChangeWatermarkImagePath={setImageWatermarkImagePath}
                    opacity={imageWatermarkOpacity}
                    onChangeOpacity={setImageWatermarkOpacity}
                    position={imageWatermarkPosition}
                    onChangePosition={setImageWatermarkPosition}
                    margin={imageWatermarkMargin}
                    onChangeMargin={setImageWatermarkMargin}
                  />
                )}

                {/* Destination Directory Notice */}
                <View className="bg-surface rounded-2xl border border-border p-4 mb-4 flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-textMuted font-bold text-xs uppercase tracking-wider">
                      Output Directory (App Storage)
                    </Text>
                    <Text
                      className="font-mono text-textSecondary text-xs mt-1"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {outputDir}
                    </Text>
                  </View>
                  <View className="p-2.5 rounded-xl bg-surfaceElevated border border-border">
                    <Folder size={16} color="#0B84FE" />
                  </View>
                </View>

                {/* Execute Action Button */}
                <TouchableOpacity
                  testID="run-tool-button"
                  accessibilityLabel={`Run ${tool.name}`}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                  onPress={handleExecute}
                  disabled={isProcessing || stagedFiles.length < tool.minFiles}
                  className={`w-full py-4 rounded-2xl flex-row items-center justify-center mb-8 min-h-[52px] ${
                    isProcessing || stagedFiles.length < tool.minFiles
                      ? 'bg-primary/40'
                      : 'bg-primary active:bg-primary/90'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-semibold text-sm ml-2">
                        Processing Locally...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                      <Text className="text-white font-bold text-base ml-2">
                        Run {tool.name}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  </SafeAreaView>
  );
}
