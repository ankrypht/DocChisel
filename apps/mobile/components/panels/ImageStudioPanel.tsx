import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ImageTargetFormat, ImageResizeMode } from '@docchisel/shared';
import { TouchSlider } from '../TouchSlider';
import { Sparkles, Check } from 'lucide-react-native';

interface ImageStudioPanelProps {
  files?: string[];
  format: ImageTargetFormat;
  onChangeFormat: (f: ImageTargetFormat) => void;
  quality: number;
  onChangeQuality: (q: number) => void;
  resizeMode: ImageResizeMode;
  onChangeResizeMode: (m: ImageResizeMode) => void;
  targetWidth: number;
  onChangeTargetWidth: (w: number) => void;
  targetHeight: number;
  onChangeTargetHeight: (h: number) => void;
  scalePercentage: number;
  onChangeScalePercentage: (s: number) => void;
  maintainAspectRatio: boolean;
  onChangeMaintainAspectRatio: (m: boolean) => void;
}

export const ImageStudioPanel: React.FC<ImageStudioPanelProps> = ({
  files = [],
  format,
  onChangeFormat,
  quality,
  onChangeQuality,
  resizeMode,
  onChangeResizeMode,
  targetWidth,
  onChangeTargetWidth,
  targetHeight,
  onChangeTargetHeight,
  scalePercentage,
  onChangeScalePercentage,
  maintainAspectRatio,
  onChangeMaintainAspectRatio,
}) => {
  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <Sparkles size={15} color="#F43F5E" />
          <Text
            className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5 flex-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Image Settings
          </Text>
        </View>
        {files.length > 0 && (
          <View className="bg-rose/10 border border-rose/30 px-2.5 py-0.5 rounded-full flex-shrink-0">
            <Text className="text-[10px] font-mono font-bold text-rose">
              {files.length} Image(s)
            </Text>
          </View>
        )}
      </View>

      {/* Pipeline Preview Tag */}
      <View className="p-3 rounded-xl bg-surfaceElevated border border-border mb-3.5 flex-row items-center justify-between">
        <View className="flex-row items-center flex-shrink-0">
          <Text className="text-textSecondary text-xs mr-2">Output:</Text>
          <View className="bg-surface px-2 py-0.5 rounded border border-border mr-2">
            <Text className="text-textPrimary font-mono font-bold text-xs uppercase">
              {format}
            </Text>
          </View>
          {format !== 'png' && (
            <Text className="text-emerald font-mono font-semibold text-xs">
              {quality}%
            </Text>
          )}
        </View>
        <Text className="text-[10px] text-textMuted font-mono flex-1 text-right ml-2" numberOfLines={1}>
          {resizeMode === 'none'
            ? 'Size: Original'
            : resizeMode === 'percentage'
            ? `Size: ${scalePercentage}% Scale`
            : `Size: Max ${targetWidth}×${targetHeight}px`}
        </Text>
      </View>

      {/* Target Format */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-textSecondary mb-2">
          Output Format
        </Text>
        <View className="flex-row">
          {[
            { id: 'webp', label: 'WebP', hint: 'Best' },
            { id: 'jpeg', label: 'JPEG', hint: 'Universal' },
            { id: 'png', label: 'PNG', hint: 'Lossless' },
            { id: 'preserve', label: 'Original', hint: 'Keep Ext' },
          ].map((item, idx, arr) => (
            <TouchableOpacity
              key={item.id}
              testID={`format-${item.id}`}
              accessibilityLabel={`Format ${item.label}`}
              accessibilityRole="button"
              onPress={() => onChangeFormat(item.id as ImageTargetFormat)}
              className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${
                idx < arr.length - 1 ? 'mr-2' : ''
              } ${
                format === item.id
                  ? 'bg-primary border-primary'
                  : 'bg-surfaceElevated border-border'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  format === item.id ? 'text-white' : 'text-textPrimary'
                }`}
              >
                {item.label}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  format === item.id ? 'text-white/80' : 'text-textMuted'
                }`}
              >
                {item.hint}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Compression Quality Slider (for webp, jpeg, preserve) */}
      {format !== 'png' && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-textSecondary">
              Compression Quality
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-textMuted font-medium mr-2">
                {quality >= 80 ? 'Balanced' : 'High Comp.'}
              </Text>
              <View
                className={`px-2.5 py-0.5 rounded-lg border ${
                  quality >= 80
                    ? 'bg-emerald/15 border-emerald/30'
                    : quality >= 50
                    ? 'bg-amber/15 border-amber/30'
                    : 'bg-danger/15 border-danger/30'
                }`}
              >
                <Text
                  className={`text-xs font-mono font-bold ${
                    quality >= 80 ? 'text-emerald' : quality >= 50 ? 'text-amber' : 'text-danger'
                  }`}
                >
                  {quality}%
                </Text>
              </View>
            </View>
          </View>

          <TouchSlider
            testID="quality-slider"
            value={quality}
            min={10}
            max={100}
            step={1}
            onChange={onChangeQuality}
            accentColor="#0B84FE"
          />

          <View className="flex-row items-center justify-between mt-2.5">
            {[20, 50, 80, 95].map((q, idx, arr) => (
              <TouchableOpacity
                key={q}
                onPress={() => onChangeQuality(q)}
                className={`flex-1 py-2 rounded-lg border items-center justify-center ${
                  idx < arr.length - 1 ? 'mr-1.5' : ''
                } ${
                  quality === q
                    ? 'bg-primary/20 border-primary'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-xs font-mono font-bold ${
                    quality === q ? 'text-primary' : 'text-textSecondary'
                  }`}
                >
                  {q}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Resize Controls */}
      <View>
        <Text className="text-sm font-semibold text-textSecondary mb-2">
          Resize Image
        </Text>
        <View className="flex-row mb-3.5">
          {[
            { id: 'none', label: 'No Resize' },
            { id: 'percentage', label: 'Scale %' },
            { id: 'dimensions', label: 'Dimensions' },
          ].map((modeItem, idx, arr) => (
            <TouchableOpacity
              key={modeItem.id}
              testID={`resize-mode-${modeItem.id}`}
              accessibilityLabel={`Resize mode ${modeItem.label}`}
              accessibilityRole="button"
              onPress={() => onChangeResizeMode(modeItem.id as ImageResizeMode)}
              className={`flex-1 py-2.5 px-3 rounded-xl border items-center justify-center ${
                idx < arr.length - 1 ? 'mr-2' : ''
              } ${
                resizeMode === modeItem.id
                  ? 'bg-primary border-primary'
                  : 'bg-surfaceElevated border-border'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  resizeMode === modeItem.id ? 'text-white' : 'text-textSecondary'
                }`}
              >
                {modeItem.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {resizeMode === 'none' && (
          <View className="p-3.5 bg-surfaceElevated rounded-2xl border border-border">
            <Text className="text-xs text-textMuted leading-5">
              Preserves the original pixel dimensions and resolution of your images.
            </Text>
          </View>
        )}

        {resizeMode === 'percentage' && (
          <View className="p-4 bg-surfaceElevated rounded-2xl border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-textSecondary">Scale Factor</Text>
              <Text className="text-primary font-mono font-bold text-sm">
                {scalePercentage}%
              </Text>
            </View>
            <TouchSlider
              testID="scale-slider"
              value={scalePercentage}
              min={10}
              max={200}
              step={5}
              onChange={onChangeScalePercentage}
              accentColor="#0B84FE"
            />
            <View className="flex-row items-center justify-between mt-2.5">
              {[25, 50, 75, 100, 150].map((s, idx, arr) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => onChangeScalePercentage(s)}
                  className={`flex-1 py-2 rounded-lg border items-center justify-center ${
                    idx < arr.length - 1 ? 'mr-1.5' : ''
                  } ${
                    scalePercentage === s
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-mono font-bold ${
                      scalePercentage === s ? 'text-primary' : 'text-textSecondary'
                    }`}
                  >
                    {s}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {resizeMode === 'dimensions' && (
          <View className="p-4 bg-surfaceElevated rounded-2xl border border-border">
            <View className="flex-row space-x-3 mb-3">
              <View className="flex-1 mr-2.5">
                <Text className="text-xs text-textMuted font-medium mb-1.5">Max Width (px)</Text>
                <TextInput
                  testID="target-width-input"
                  accessibilityLabel="Target Width in pixels"
                  value={String(targetWidth)}
                  onChangeText={(val) => onChangeTargetWidth(Number(val) || 0)}
                  keyboardType="numeric"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-textPrimary font-mono"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-textMuted font-medium mb-1.5">Max Height (px)</Text>
                <TextInput
                  testID="target-height-input"
                  accessibilityLabel="Target Height in pixels"
                  value={String(targetHeight)}
                  onChangeText={(val) => onChangeTargetHeight(Number(val) || 0)}
                  keyboardType="numeric"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-textPrimary font-mono"
                />
              </View>
            </View>

            <TouchableOpacity
              testID="aspect-ratio-toggle"
              accessibilityLabel="Maintain proportional aspect ratio"
              accessibilityRole="checkbox"
              activeOpacity={0.7}
              onPress={() => onChangeMaintainAspectRatio(!maintainAspectRatio)}
              className="flex-row items-center mt-1"
            >
              <View
                className={`w-5 h-5 rounded-md border mr-2.5 items-center justify-center ${
                  maintainAspectRatio
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                {maintainAspectRatio && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text className="text-sm text-textSecondary font-medium">
                Keep aspect ratio (preserves image proportions without stretching)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};
