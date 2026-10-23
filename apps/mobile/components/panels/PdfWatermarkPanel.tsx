import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { PdfWatermarkPosition, PdfWatermarkType } from '@docchisel/shared';
import { Type, Image as ImageIcon, Sliders } from 'lucide-react-native';
import { TouchSlider } from '../TouchSlider';

interface PdfWatermarkPanelProps {
  watermarkType: PdfWatermarkType;
  onChangeWatermarkType: (t: PdfWatermarkType) => void;
  text: string;
  onChangeText: (t: string) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  color: string;
  onChangeColor: (c: string) => void;
  imagePath: string;
  onChangeImagePath: (p: string) => void;
  opacity: number;
  onChangeOpacity: (o: number) => void;
  rotation: number;
  onChangeRotation: (r: number) => void;
  position: PdfWatermarkPosition;
  onChangePosition: (pos: PdfWatermarkPosition) => void;
  pages: string;
  onChangePages: (pg: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfWatermarkPanel: React.FC<PdfWatermarkPanelProps> = ({
  watermarkType,
  onChangeWatermarkType,
  text,
  onChangeText,
  fontSize,
  onChangeFontSize,
  color,
  onChangeColor,
  imagePath,
  onChangeImagePath,
  opacity,
  onChangeOpacity,
  rotation,
  onChangeRotation,
  position,
  onChangePosition,
  pages,
  onChangePages,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const positions: { key: PdfWatermarkPosition; label: string }[] = [
    { key: 'top_left', label: 'Top Left' },
    { key: 'top_center', label: 'Top Center' },
    { key: 'top_right', label: 'Top Right' },
    { key: 'center', label: 'Center' },
    { key: 'bottom_left', label: 'Bottom Left' },
    { key: 'bottom_center', label: 'Bottom Center' },
    { key: 'bottom_right', label: 'Bottom Right' },
  ];

  const rotationPresets = [0, 45, 90, -45];

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header & Type Switcher */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Sliders size={14} color="#8B5CF6" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5">
            Watermark Settings
          </Text>
        </View>

        <View className="flex-row bg-surfaceElevated p-1 rounded-xl border border-border">
          <TouchableOpacity
            testID="watermark-type-text"
            onPress={() => onChangeWatermarkType('text')}
            className={`flex-row items-center px-3 py-1.5 rounded-lg ${
              watermarkType === 'text' ? 'bg-violet' : ''
            }`}
          >
            <Type size={12} color={watermarkType === 'text' ? '#FFFFFF' : '#A1A1AA'} />
            <Text
              className={`text-xs font-semibold ml-1 ${
                watermarkType === 'text' ? 'text-white' : 'text-textSecondary'
              }`}
            >
              Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="watermark-type-image"
            onPress={() => onChangeWatermarkType('image')}
            className={`flex-row items-center px-3 py-1.5 rounded-lg ml-1 ${
              watermarkType === 'image' ? 'bg-violet' : ''
            }`}
          >
            <ImageIcon size={12} color={watermarkType === 'image' ? '#FFFFFF' : '#A1A1AA'} />
            <Text
              className={`text-xs font-semibold ml-1 ${
                watermarkType === 'image' ? 'text-white' : 'text-textSecondary'
              }`}
            >
              Logo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Inputs */}
      {watermarkType === 'text' ? (
        <View className="mb-4">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Watermark Text
          </Text>
          <TextInput
            testID="watermark-text-input"
            value={text}
            onChangeText={onChangeText}
            placeholder="e.g. CONFIDENTIAL, DRAFT"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary mb-3"
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-textSecondary">
              Font Size ({fontSize}pt)
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => onChangeFontSize(Math.max(12, fontSize - 6))}
                className="w-8 h-8 rounded-lg bg-surfaceElevated border border-border items-center justify-center mr-2"
              >
                <Text className="text-sm font-bold text-textPrimary">-</Text>
              </TouchableOpacity>
              <TextInput
                keyboardType="numeric"
                value={String(fontSize)}
                onChangeText={(v) => onChangeFontSize(Number(v) || 12)}
                className="w-14 h-8 rounded-lg bg-surfaceElevated border border-border text-center text-xs font-mono text-textPrimary"
              />
              <TouchableOpacity
                onPress={() => onChangeFontSize(Math.min(144, fontSize + 6))}
                className="w-8 h-8 rounded-lg bg-surfaceElevated border border-border items-center justify-center ml-2"
              >
                <Text className="text-sm font-bold text-textPrimary">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View className="mb-4">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Watermark Logo File Path
          </Text>
          <TextInput
            testID="watermark-image-path-input"
            value={imagePath}
            onChangeText={onChangeImagePath}
            placeholder="Path to PNG / JPEG image file"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-textPrimary"
          />
        </View>
      )}

      {/* Opacity Slider */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-textSecondary">Opacity</Text>
          <Text className="text-xs font-mono font-bold text-violet">
            {Math.round(opacity * 100)}%
          </Text>
        </View>
        <TouchSlider
          value={Math.round(opacity * 100)}
          min={5}
          max={100}
          step={5}
          onChange={(val) => onChangeOpacity(val / 100)}
          accentColor="#8B5CF6"
          testID="watermark-opacity-slider"
        />
      </View>

      {/* Rotation Presets */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-2">
          Rotation Angle ({rotation}°)
        </Text>
        <View className="flex-row">
          {rotationPresets.map((r) => {
            const active = rotation === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => onChangeRotation(r)}
                className={`flex-1 py-2 rounded-xl border mr-2 items-center justify-center ${
                  active
                    ? 'bg-violet/20 border-violet'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-xs font-mono font-bold ${
                    active ? 'text-violet' : 'text-textSecondary'
                  }`}
                >
                  {r > 0 ? `+${r}°` : `${r}°`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Position Selector */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-2">
          Watermark Position
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {positions.map((p) => {
            const active = position === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => onChangePosition(p.key)}
                className={`px-3 py-2 rounded-xl border ${
                  active
                    ? 'bg-violet/20 border-violet'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    active ? 'text-violet font-bold' : 'text-textSecondary'
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Target Pages & Filename */}
      <View className="space-y-3">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Target Pages
          </Text>
          <TextInput
            testID="watermark-pages-input"
            value={pages}
            onChangeText={onChangePages}
            placeholder="all or 1-5, 8"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
        </View>

        <View>
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Output PDF Filename (Optional)
          </Text>
          <TextInput
            testID="watermark-output-filename"
            value={outputFilename}
            onChangeText={onChangeOutputFilename}
            placeholder="watermarked_document.pdf"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
        </View>
      </View>
    </View>
  );
};
