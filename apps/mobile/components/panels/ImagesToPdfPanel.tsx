import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { PageSize, PageOrientation } from '@docchisel/shared';
import { Eye, ChevronLeft, ChevronRight, Sliders, Image as ImageIcon } from 'lucide-react-native';
import { TouchSlider } from '../TouchSlider';

interface ImagesToPdfPanelProps {
  files?: string[];
  pageSize: PageSize;
  onChangePageSize: (size: PageSize) => void;
  orientation: PageOrientation;
  onChangeOrientation: (o: PageOrientation) => void;
  marginMm: number;
  onChangeMarginMm: (m: number) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

const MM_TO_PT = 72.0 / 25.4;

export const ImagesToPdfPanel: React.FC<ImagesToPdfPanelProps> = ({
  files = [],
  pageSize,
  onChangePageSize,
  orientation,
  onChangeOrientation,
  marginMm,
  onChangeMarginMm,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<
    Record<number, { w: number; h: number }>
  >({});

  // Proactively fetch native image dimensions for accurate PDF geometry preview
  useEffect(() => {
    if (activePageIndex >= files.length) {
      setActivePageIndex(Math.max(0, files.length - 1));
    }

    files.forEach((fileUri, idx) => {
      const uri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
      Image.getSize(
        uri,
        (w, h) => {
          setImageDimensions((prev) => ({
            ...prev,
            [idx]: { w, h },
          }));
        },
        () => {
          // fallback
          setImageDimensions((prev) => ({
            ...prev,
            [idx]: { w: 1920, h: 1080 },
          }));
        }
      );
    });
  }, [files]);

  const activeFile = files[activePageIndex] || '';
  const activeFileName = activeFile.split('/').pop() || '';
  const currentDims = imageDimensions[activePageIndex] || { w: 1920, h: 1080 };
  const imgW = Math.max(1, currentDims.w);
  const imgH = Math.max(1, currentDims.h);

  // 1. Calculate PDF geometry matching crates/core_engine/src/tools/images_to_pdf.rs 100%
  const marginPt = Math.max(0, marginMm * MM_TO_PT);

  const [baseW, baseH] = (() => {
    switch (pageSize) {
      case 'a4':
        return [595.28, 841.89];
      case 'letter':
        return [612.0, 792.0];
      case 'fit':
        return [imgW + 2.0 * marginPt, imgH + 2.0 * marginPt];
    }
  })();

  const isLandscape = (() => {
    switch (orientation) {
      case 'landscape':
        return true;
      case 'portrait':
        return false;
      case 'auto':
        return imgW > imgH;
    }
  })();

  const [pageW, pageH] = isLandscape
    ? [Math.max(baseW, baseH), Math.min(baseW, baseH)]
    : [Math.min(baseW, baseH), Math.max(baseW, baseH)];

  const availW = Math.max(1, pageW - 2.0 * marginPt);
  const availH = Math.max(1, pageH - 2.0 * marginPt);

  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const leftPercent = ((marginPt + (availW - drawW) / 2.0) / pageW) * 100;
  const topPercent = ((marginPt + (availH - drawH) / 2.0) / pageH) * 100;
  const widthPercent = (drawW / pageW) * 100;
  const heightPercent = (drawH / pageH) * 100;

  // Pixel sizing for the virtual sheet canvas on mobile screens
  const MAX_CANVAS_W = 280;
  const MAX_CANVAS_H = 210;
  const pageRatio = pageW / pageH;

  let sheetWidth: number;
  let sheetHeight: number;

  if (pageRatio > MAX_CANVAS_W / MAX_CANVAS_H) {
    sheetWidth = MAX_CANVAS_W;
    sheetHeight = Math.round(MAX_CANVAS_W / pageRatio);
  } else {
    sheetHeight = MAX_CANVAS_H;
    sheetWidth = Math.round(MAX_CANVAS_H * pageRatio);
  }

  const activeUri = activeFile
    ? activeFile.startsWith('file://')
      ? activeFile
      : `file://${activeFile}`
    : '';

  return (
    <View className="space-y-4 mb-4">
      {/* Live PDF Document Formed Preview Card */}
      {files.length > 0 && (
        <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
            <View className="flex-row items-center">
              <Eye size={15} color="#0B84FE" />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-textPrimary ml-1.5 mr-2">
                Live PDF Output Preview
              </Text>
              <View className="bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-mono font-bold text-primary">
                  {activePageIndex + 1}/{files.length}
                </Text>
              </View>
            </View>

            {/* Page Navigators */}
            {files.length > 1 && (
              <View className="flex-row items-center bg-surfaceElevated rounded-lg border border-border p-0.5">
                <TouchableOpacity
                  onPress={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                  disabled={activePageIndex === 0}
                  className="p-1"
                >
                  <ChevronLeft
                    size={14}
                    color={activePageIndex === 0 ? '#3F3F46' : '#FAFAFA'}
                  />
                </TouchableOpacity>
                <Text className="text-[10px] font-mono px-1.5 text-textSecondary">
                  {activePageIndex + 1}/{files.length}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setActivePageIndex((p) => Math.min(files.length - 1, p + 1))
                  }
                  disabled={activePageIndex === files.length - 1}
                  className="p-1"
                >
                  <ChevronRight
                    size={14}
                    color={activePageIndex === files.length - 1 ? '#3F3F46' : '#FAFAFA'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Virtual PDF Sheet Canvas */}
          <View className="items-center justify-center py-4 bg-zinc-950/80 rounded-xl border border-border min-h-[220px]">
            {/* The Actual PDF Physical Sheet */}
            <View
              style={{
                width: sheetWidth,
                height: sheetHeight,
              }}
              className="relative bg-white rounded-[2px] overflow-hidden border border-zinc-400/50 shadow-md"
            >
              {activeUri ? (
                <View
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                >
                  <Image
                    source={{ uri: activeUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="stretch"
                  />
                  {marginMm > 0 && (
                    <View className="absolute inset-0 border border-black/10 pointer-events-none" />
                  )}
                </View>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <ImageIcon size={24} color="#A1A1AA" />
                </View>
              )}
            </View>

            {/* Sub-label under page with authentic specs */}
            <View className="mt-3 items-center">
              <Text className="text-[11px] font-mono text-zinc-200 font-medium truncate max-w-xs text-center">
                {activeFileName}
              </Text>
              <View className="flex-row flex-wrap items-center justify-center mt-1">
                <Text className="text-[10px] font-mono text-textSecondary uppercase font-bold">
                  {pageSize === 'fit' ? 'FIT TO IMAGE' : pageSize}
                </Text>
                <Text className="text-[10px] text-zinc-500 mx-1.5">•</Text>
                <Text className="text-[10px] font-mono text-textSecondary">
                  {isLandscape ? 'Landscape' : 'Portrait'}
                  {orientation === 'auto' ? ' (Auto)' : ''}
                </Text>
                <Text className="text-[10px] text-zinc-500 mx-1.5">•</Text>
                <Text
                  className={`text-[10px] font-mono ${
                    marginMm === 0 ? 'text-emerald font-semibold' : 'text-textSecondary'
                  }`}
                >
                  {marginMm === 0 ? '0mm Bleed' : `${marginMm}mm Margin`}
                </Text>
                <Text className="text-[10px] text-zinc-500 mx-1.5">•</Text>
                <Text className="text-[10px] font-mono text-textMuted">
                  {imgW}×{imgH}px
                </Text>
              </View>
            </View>
          </View>

          {/* Thumbnail Strip for Multi-Page Jumping */}
          {files.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 py-1">
              <View className="flex-row space-x-2">
                {files.map((file, idx) => {
                  const isActive = idx === activePageIndex;
                  const thumbUri = file.startsWith('file://') ? file : `file://${file}`;

                  return (
                    <TouchableOpacity
                      key={file + idx}
                      activeOpacity={0.7}
                      onPress={() => setActivePageIndex(idx)}
                      className={`p-1 rounded-xl border mr-2 items-center ${
                        isActive
                          ? 'border-primary bg-primary/20'
                          : 'border-border bg-surfaceElevated opacity-60'
                      }`}
                    >
                      <View className="w-12 h-14 bg-white rounded-md overflow-hidden items-center justify-center border border-zinc-300">
                        <Image
                          source={{ uri: thumbUri }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                      <Text className="text-[9px] font-mono font-bold mt-1 text-textSecondary">
                        #{idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Settings Configuration Card */}
      <View className="bg-surface rounded-2xl border border-border p-4">
        <View className="flex-row items-center mb-4">
          <Sliders size={18} color="#0B84FE" />
          <Text className="text-xs font-bold uppercase tracking-wider text-textMuted ml-2">
            Page & Layout Settings
          </Text>
        </View>

        {/* Page Size */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-textSecondary mb-2">
            Page Dimensions
          </Text>
          <View className="flex-row">
            {(['a4', 'letter', 'fit'] as PageSize[]).map((size, idx, arr) => (
              <TouchableOpacity
                key={size}
                testID={`page-size-${size}`}
                accessibilityLabel={`Page size ${size}`}
                accessibilityRole="button"
                onPress={() => onChangePageSize(size)}
                className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                  idx < arr.length - 1 ? 'mr-2' : ''
                } ${
                  pageSize === size
                    ? 'bg-primary border-primary'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-sm font-bold uppercase ${
                    pageSize === size ? 'text-white' : 'text-textSecondary'
                  }`}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Orientation */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-textSecondary mb-2">
            Orientation
          </Text>
          <View className="flex-row">
            {(['auto', 'portrait', 'landscape'] as PageOrientation[]).map((o, idx, arr) => (
              <TouchableOpacity
                key={o}
                testID={`orientation-${o}`}
                accessibilityLabel={`Orientation ${o}`}
                accessibilityRole="button"
                onPress={() => onChangeOrientation(o)}
                className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                  idx < arr.length - 1 ? 'mr-2' : ''
                } ${
                  orientation === o
                    ? 'bg-primary border-primary'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${
                    orientation === o ? 'text-white' : 'text-textSecondary'
                  }`}
                >
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

          {/* Margin Slider */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-textSecondary">
                Page Margins
              </Text>
              <Text className="text-sm font-mono text-primary font-bold">
                {marginMm === 0
                  ? '0 mm (Full Bleed)'
                  : `${marginMm} mm (${(marginMm * MM_TO_PT).toFixed(0)}pt margin)`}
              </Text>
            </View>

            <TouchSlider
              testID="margin-slider"
              value={marginMm}
              min={0}
              max={30}
              step={1}
              onChange={onChangeMarginMm}
              accentColor="#0B84FE"
            />

          <View className="flex-row items-center justify-between mt-2.5">
            {[0, 5, 10, 15, 20].map((val, idx, arr) => (
              <TouchableOpacity
                key={val}
                onPress={() => onChangeMarginMm(val)}
                className={`flex-1 py-2 rounded-lg border items-center justify-center ${
                  idx < arr.length - 1 ? 'mr-1.5' : ''
                } ${
                  marginMm === val
                    ? 'bg-primary/20 border-primary'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-xs font-mono font-bold ${
                    marginMm === val ? 'text-primary' : 'text-textSecondary'
                  }`}
                >
                  {val === 0 ? '0mm' : `${val}mm`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Output Filename */}
        <View>
          <Text className="text-sm font-semibold text-textSecondary mb-2">
            Output PDF Filename
          </Text>
          <TextInput
            testID="images-to-pdf-filename-input"
            accessibilityLabel="Output PDF Filename"
            value={outputFilename}
            onChangeText={onChangeOutputFilename}
            placeholder="images_document.pdf"
            placeholderTextColor="#71717A"
            className="w-full px-4 py-3 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
        </View>
      </View>
    </View>
  );
};
