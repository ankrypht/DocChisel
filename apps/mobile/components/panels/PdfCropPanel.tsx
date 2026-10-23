import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { PdfCropUnit } from '@docchisel/shared';
import { Crop } from 'lucide-react-native';

interface PdfCropPanelProps {
  marginTop: number;
  onChangeMarginTop: (v: number) => void;
  marginBottom: number;
  onChangeMarginBottom: (v: number) => void;
  marginLeft: number;
  onChangeMarginLeft: (v: number) => void;
  marginRight: number;
  onChangeMarginRight: (v: number) => void;
  unit: PdfCropUnit;
  onChangeUnit: (u: PdfCropUnit) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfCropPanel: React.FC<PdfCropPanelProps> = ({
  marginTop,
  onChangeMarginTop,
  marginBottom,
  onChangeMarginBottom,
  marginLeft,
  onChangeMarginLeft,
  marginRight,
  onChangeMarginRight,
  unit,
  onChangeUnit,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const units: { key: PdfCropUnit; label: string }[] = [
    { key: 'pt', label: 'Points (pt)' },
    { key: 'mm', label: 'Millimeters (mm)' },
    { key: 'percentage', label: 'Percentage (%)' },
  ];

  const applyPreset = (val: number) => {
    onChangeMarginTop(val);
    onChangeMarginBottom(val);
    onChangeMarginLeft(val);
    onChangeMarginRight(val);
  };

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header & Unit Switcher */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Crop size={14} color="#F97316" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5">
            Crop Margins
          </Text>
        </View>

        <View className="flex-row bg-surfaceElevated p-1 rounded-xl border border-border">
          {units.map((u) => {
            const active = unit === u.key;
            return (
              <TouchableOpacity
                key={u.key}
                onPress={() => onChangeUnit(u.key)}
                className={`px-2.5 py-1 rounded-lg ${
                  active ? 'bg-orange' : ''
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? 'text-white' : 'text-textSecondary'
                  }`}
                >
                  {u.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Quick Presets */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-1.5">
          Quick Margin Presets
        </Text>
        <View className="flex-row gap-2">
          {[
            { label: 'None', val: 0 },
            { label: 'Trim 10', val: unit === 'percentage' ? 3 : 10 },
            { label: 'Trim 25', val: unit === 'percentage' ? 6 : 25 },
            { label: 'Trim 50', val: unit === 'percentage' ? 12 : 50 },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.label}
              onPress={() => applyPreset(preset.val)}
              className="flex-1 py-2 rounded-xl border border-border bg-surfaceElevated items-center justify-center"
            >
              <Text className="text-xs font-semibold text-textSecondary">
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 4 margin directional inputs */}
      <View className="space-y-3 mb-4">
        <View className="flex-row space-x-3 mb-2">
          <View className="flex-1 mr-1.5">
            <Text className="text-xs font-semibold text-textSecondary mb-1">
              Top Margin
            </Text>
            <TextInput
              keyboardType="numeric"
              value={String(marginTop)}
              onChangeText={(v) => onChangeMarginTop(Math.max(0, Number(v) || 0))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm font-mono text-textPrimary"
            />
          </View>
          <View className="flex-1 ml-1.5">
            <Text className="text-xs font-semibold text-textSecondary mb-1">
              Bottom Margin
            </Text>
            <TextInput
              keyboardType="numeric"
              value={String(marginBottom)}
              onChangeText={(v) => onChangeMarginBottom(Math.max(0, Number(v) || 0))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm font-mono text-textPrimary"
            />
          </View>
        </View>

        <View className="flex-row space-x-3">
          <View className="flex-1 mr-1.5">
            <Text className="text-xs font-semibold text-textSecondary mb-1">
              Left Margin
            </Text>
            <TextInput
              keyboardType="numeric"
              value={String(marginLeft)}
              onChangeText={(v) => onChangeMarginLeft(Math.max(0, Number(v) || 0))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm font-mono text-textPrimary"
            />
          </View>
          <View className="flex-1 ml-1.5">
            <Text className="text-xs font-semibold text-textSecondary mb-1">
              Right Margin
            </Text>
            <TextInput
              keyboardType="numeric"
              value={String(marginRight)}
              onChangeText={(v) => onChangeMarginRight(Math.max(0, Number(v) || 0))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm font-mono text-textPrimary"
            />
          </View>
        </View>
      </View>

      {/* Output Filename */}
      <View>
        <Text className="text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </Text>
        <TextInput
          testID="crop-output-filename"
          value={outputFilename}
          onChangeText={onChangeOutputFilename}
          placeholder="cropped_document.pdf"
          placeholderTextColor="#71717A"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
        />
      </View>
    </View>
  );
};
