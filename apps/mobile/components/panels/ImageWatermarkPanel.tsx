import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ImageWatermarkPosition, PdfWatermarkType } from '@docchisel/shared';
import { Type, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import { TouchSlider } from '../TouchSlider';

interface ImageWatermarkPanelProps {
  watermarkType: PdfWatermarkType;
  onChangeWatermarkType: (t: PdfWatermarkType) => void;
  text: string;
  onChangeText: (t: string) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  color: string;
  onChangeColor: (c: string) => void;
  watermarkImagePath: string;
  onChangeWatermarkImagePath: (p: string) => void;
  opacity: number;
  onChangeOpacity: (o: number) => void;
  position: ImageWatermarkPosition;
  onChangePosition: (pos: ImageWatermarkPosition) => void;
  margin: number;
  onChangeMargin: (m: number) => void;
}

export const ImageWatermarkPanel: React.FC<ImageWatermarkPanelProps> = ({
  watermarkType,
  onChangeWatermarkType,
  text,
  onChangeText,
  fontSize,
  onChangeFontSize,
  color,
  onChangeColor,
  watermarkImagePath,
  onChangeWatermarkImagePath,
  opacity,
  onChangeOpacity,
  position,
  onChangePosition,
  margin,
  onChangeMargin,
}) => {
  const positions: { key: ImageWatermarkPosition; label: string }[] = [
    { key: 'top_left', label: 'Top Left' },
    { key: 'top_center', label: 'Top Center' },
    { key: 'top_right', label: 'Top Right' },
    { key: 'center', label: 'Center' },
    { key: 'bottom_left', label: 'Bottom Left' },
    { key: 'bottom_center', label: 'Bottom Center' },
    { key: 'bottom_right', label: 'Bottom Right' },
  ];

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header & Type Switcher */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Sparkles size={14} color="#F43F5E" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5">
            Watermark Settings
          </Text>
        </View>

        <View className="flex-row bg-surfaceElevated p-1 rounded-xl border border-border">
          <TouchableOpacity
            testID="img-watermark-type-text"
            onPress={() => onChangeWatermarkType('text')}
            className={`flex-row items-center px-3 py-1.5 rounded-lg ${
              watermarkType === 'text' ? 'bg-rose' : ''
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
            testID="img-watermark-type-image"
            onPress={() => onChangeWatermarkType('image')}
            className={`flex-row items-center px-3 py-1.5 rounded-lg ml-1 ${
              watermarkType === 'image' ? 'bg-rose' : ''
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
            testID="img-watermark-text-input"
            value={text}
            onChangeText={onChangeText}
            placeholder="e.g. © 2026 YourBrand"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary mb-3"
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-textSecondary">
              Font Size ({fontSize}px)
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
                onPress={() => onChangeFontSize(Math.min(180, fontSize + 6))}
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
            Watermark Logo Image File Path
          </Text>
          <TextInput
            testID="img-watermark-image-path-input"
            value={watermarkImagePath}
            onChangeText={onChangeWatermarkImagePath}
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
          <Text className="text-xs font-mono font-bold text-rose">
            {Math.round(opacity * 100)}%
          </Text>
        </View>
        <TouchSlider
          value={Math.round(opacity * 100)}
          min={5}
          max={100}
          step={5}
          onChange={(val) => onChangeOpacity(val / 100)}
          accentColor="#F43F5E"
          testID="img-watermark-opacity-slider"
        />
      </View>

      {/* Margin Padding Slider */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-textSecondary">Padding Margin</Text>
          <Text className="text-xs font-mono font-bold text-rose">
            {margin}px
          </Text>
        </View>
        <TouchSlider
          value={margin}
          min={5}
          max={100}
          step={5}
          onChange={(val) => onChangeMargin(val)}
          accentColor="#F43F5E"
          testID="img-watermark-margin-slider"
        />
      </View>

      {/* Position Selector */}
      <View>
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
                    ? 'bg-rose/20 border-rose'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    active ? 'text-rose font-bold' : 'text-textSecondary'
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};
