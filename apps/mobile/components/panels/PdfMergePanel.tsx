import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface PdfMergePanelProps {
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfMergePanel: React.FC<PdfMergePanelProps> = ({
  outputFilename,
  onChangeOutputFilename,
}) => {
  return (
    <View className="bg-surface rounded-2xl border border-border p-5 mb-4">
      <Text className="text-xs font-bold uppercase tracking-wider text-textMuted mb-3">
        Merge Configuration
      </Text>

      <View>
        <Text className="text-sm font-semibold text-textSecondary mb-2">
          Output PDF Filename
        </Text>
        <TextInput
          testID="merge-output-filename-input"
          accessibilityLabel="Output PDF Filename"
          value={outputFilename}
          onChangeText={onChangeOutputFilename}
          placeholder="merged_document.pdf"
          placeholderTextColor="#71717A"
          className="w-full px-4 py-3 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
        />
        <Text className="text-xs text-textMuted mt-2 leading-5">
          Files will be merged in the exact sequence shown above in the staging cards. Use the up/down arrows to reorder.
        </Text>
      </View>
    </View>
  );
};
