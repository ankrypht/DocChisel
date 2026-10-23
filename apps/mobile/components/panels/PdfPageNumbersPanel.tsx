import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { PdfPageNumbersPosition } from '@docchisel/shared';
import { Hash } from 'lucide-react-native';

interface PdfPageNumbersPanelProps {
  formatTemplate: string;
  onChangeFormatTemplate: (tpl: string) => void;
  position: PdfPageNumbersPosition;
  onChangePosition: (pos: PdfPageNumbersPosition) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  marginPt: number;
  onChangeMarginPt: (m: number) => void;
  startPageNumber: number;
  onChangeStartPageNumber: (num: number) => void;
  pages: string;
  onChangePages: (p: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (f: string) => void;
}

export const PdfPageNumbersPanel: React.FC<PdfPageNumbersPanelProps> = ({
  formatTemplate,
  onChangeFormatTemplate,
  position,
  onChangePosition,
  fontSize,
  onChangeFontSize,
  marginPt,
  onChangeMarginPt,
  startPageNumber,
  onChangeStartPageNumber,
  pages,
  onChangePages,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const templates = [
    { label: 'Page 1 of 5', value: 'Page {n} of {total}' },
    { label: '1 / 5', value: '{n} / {total}' },
    { label: 'Page 1', value: 'Page {n}' },
    { label: '1', value: '{n}' },
  ];

  const positions: { key: PdfPageNumbersPosition; label: string }[] = [
    { key: 'top_left', label: 'Top Left' },
    { key: 'top_center', label: 'Top Center' },
    { key: 'top_right', label: 'Top Right' },
    { key: 'bottom_left', label: 'Bottom Left' },
    { key: 'bottom_center', label: 'Bottom Center' },
    { key: 'bottom_right', label: 'Bottom Right' },
  ];

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Hash size={14} color="#0B84FE" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5">
            Page Numbering
          </Text>
        </View>
        <View className="px-2.5 py-0.5 rounded-full bg-blue/10 border border-blue/25">
          <Text className="text-[10px] font-mono font-bold text-blue">
            Dynamic Counter
          </Text>
        </View>
      </View>

      {/* Format Template Quick Chips */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-2">
          Format Template
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-2">
          {templates.map((tpl) => {
            const active = formatTemplate === tpl.value;
            return (
              <TouchableOpacity
                key={tpl.value}
                onPress={() => onChangeFormatTemplate(tpl.value)}
                className={`px-3 py-1.5 rounded-xl border ${
                  active
                    ? 'bg-blue/20 border-blue'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-xs font-mono ${
                    active ? 'text-blue font-bold' : 'text-textSecondary'
                  }`}
                >
                  {tpl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          testID="pagenum-template-input"
          value={formatTemplate}
          onChangeText={onChangeFormatTemplate}
          placeholder="Custom template e.g. {n} of {total}"
          placeholderTextColor="#71717A"
          className="w-full px-3.5 py-2 rounded-xl bg-surfaceElevated border border-border text-xs font-mono text-textPrimary"
        />
      </View>

      {/* Position Selector */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-2">
          Position on Page
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {positions.map((p) => {
            const active = position === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => onChangePosition(p.key)}
                className={`flex-1 min-w-[30%] py-2 rounded-xl border items-center justify-center ${
                  active
                    ? 'bg-blue/20 border-blue'
                    : 'bg-surfaceElevated border-border'
                }`}
              >
                <Text
                  className={`text-xs ${
                    active ? 'text-blue font-bold' : 'text-textSecondary'
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Font Size & Margin Pt Controls */}
      <View className="flex-row space-x-3 mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Font Size ({fontSize}pt)
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => onChangeFontSize(Math.max(6, fontSize - 1))}
              className="w-8 h-8 rounded-lg bg-surfaceElevated border border-border items-center justify-center mr-1"
            >
              <Text className="text-sm font-bold text-textPrimary">-</Text>
            </TouchableOpacity>
            <TextInput
              keyboardType="numeric"
              value={String(fontSize)}
              onChangeText={(v) => onChangeFontSize(Number(v) || 6)}
              className="flex-1 h-8 rounded-lg bg-surfaceElevated border border-border text-center text-xs font-mono text-textPrimary"
            />
            <TouchableOpacity
              onPress={() => onChangeFontSize(Math.min(36, fontSize + 1))}
              className="w-8 h-8 rounded-lg bg-surfaceElevated border border-border items-center justify-center ml-1"
            >
              <Text className="text-sm font-bold text-textPrimary">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 ml-2">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Margin ({marginPt}pt)
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => onChangeMarginPt(Math.max(5, marginPt - 5))}
              className="w-8 h-8 rounded-lg bg-surfaceElevated border border-border items-center justify-center mr-1"
            >
              <Text className="text-sm font-bold text-textPrimary">-</Text>
            </TouchableOpacity>
            <TextInput
              keyboardType="numeric"
              value={String(marginPt)}
              onChangeText={(v) => onChangeMarginPt(Number(v) || 10)}
              className="flex-1 h-8 rounded-lg bg-surfaceElevated border border-border text-center text-xs font-mono text-textPrimary"
            />
            <TouchableOpacity
              onPress={() => onChangeMarginPt(Math.min(100, marginPt + 5))}
              className="w-8 h-8 rounded-lg bg-surfaceElevated border border-border items-center justify-center ml-1"
            >
              <Text className="text-sm font-bold text-textPrimary">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Start Page Number, Pages, Filename */}
      <View className="space-y-3">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Start Page #
          </Text>
          <TextInput
            keyboardType="numeric"
            value={String(startPageNumber)}
            onChangeText={(v) => onChangeStartPageNumber(Number(v) || 1)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
        </View>

        <View className="mb-2">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Target Pages
          </Text>
          <TextInput
            testID="pagenum-pages-input"
            value={pages}
            onChangeText={onChangePages}
            placeholder="all or 1-10"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
        </View>

        <View>
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Output PDF Filename (Optional)
          </Text>
          <TextInput
            testID="pagenum-output-filename"
            value={outputFilename}
            onChangeText={onChangeOutputFilename}
            placeholder="numbered_document.pdf"
            placeholderTextColor="#71717A"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
        </View>
      </View>
    </View>
  );
};
