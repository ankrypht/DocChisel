import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { JobOutput } from '@docchisel/shared';
import {
  CheckCircle2,
  Share2,
  Sparkles,
  FileCheck,
  ArrowRight,
} from 'lucide-react-native';
import { shareOutputFile, formatBytes } from '../services/mobileBridge';

interface ResultViewProps {
  output: JobOutput;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ output, onReset }) => {
  const orig = output.total_original_bytes;
  const res = output.total_result_bytes;
  const savedBytes = orig > res ? orig - res : 0;
  const savedPercent = orig > 0 && res < orig ? Math.round(((orig - res) / orig) * 100) : 0;

  return (
    <View
      testID="result-view"
      className="bg-surface rounded-3xl border border-border p-6 mb-8 shadow-2xl relative overflow-hidden"
    >
      {/* Success Icon & Header */}
      <View className="items-center mb-4">
        <View className="w-16 h-16 rounded-2xl bg-emerald/15 border border-emerald/40 items-center justify-center mb-3 shadow-lg shadow-emerald/20">
          <CheckCircle2 size={34} color="#10B981" />
        </View>
        <Text className="text-2xl font-black text-textPrimary text-center">
          Processing Completed!
        </Text>
        {output.message && (
          <Text className="text-sm text-textSecondary text-center mt-1.5 px-4 leading-5">
            {output.message}
          </Text>
        )}
      </View>

      {/* File Size Savings Badge */}
      {savedPercent > 0 && (
        <View
          testID="savings-badge"
          className="p-4 rounded-2xl bg-emerald/10 border border-emerald/25 flex-row items-center justify-around mb-4"
        >
          <View className="items-center">
            <Text className="text-xs uppercase tracking-wider text-textMuted font-bold">
              Original Size
            </Text>
            <Text className="text-sm font-mono text-textSecondary font-bold mt-1">
              {formatBytes(orig)}
            </Text>
          </View>

          <View className="items-center">
            <View className="flex-row items-center bg-emerald px-3 py-1 rounded-full shadow-sm">
              <Sparkles size={13} color="#09090B" />
              <Text className="text-xs font-black text-zinc-950 uppercase tracking-wider ml-1">
                Saved {savedPercent}%
              </Text>
            </View>
            <Text className="text-xs text-emerald font-mono font-bold mt-1">
              -{formatBytes(savedBytes)}
            </Text>
          </View>

          <View className="items-center">
            <Text className="text-xs uppercase tracking-wider text-textMuted font-bold">
              Result Size
            </Text>
            <Text className="text-sm font-mono text-emerald font-bold mt-1">
              {formatBytes(res)}
            </Text>
          </View>
        </View>
      )}

      {/* Output Files List */}
      <View className="bg-surfaceElevated rounded-2xl p-4 border border-border mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2.5 px-1">
          Generated Files ({output.files.length})
        </Text>

        <ScrollView className="max-h-48" showsVerticalScrollIndicator={false}>
          {output.files.map((file, idx) => {
            const fileName = file.output_path.split('/').pop() || file.output_path;

            return (
              <View
                key={`${file.output_path}-${idx}`}
                testID={`result-file-${idx}`}
                className="flex-row items-center justify-between p-3 rounded-xl bg-surface border border-border mb-2"
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <FileCheck size={18} color="#10B981" />
                  <View className="ml-2.5 flex-1">
                    <Text
                      className="text-textPrimary text-sm font-medium font-mono"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {fileName}
                    </Text>
                    <Text className="text-textMuted text-xs font-mono mt-0.5">
                      {formatBytes(file.result_bytes)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => shareOutputFile(file.output_path)}
                  className="bg-primary px-3 py-2 rounded-xl flex-row items-center active:bg-primary/80"
                >
                  <Share2 size={13} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold ml-1.5">Share</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Action Buttons */}
      <View className="space-y-3">
        {output.files[0] && (
          <TouchableOpacity
            testID="share-result-button"
            accessibilityLabel="Share or Save Output Document"
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => shareOutputFile(output.files[0].output_path)}
            className="w-full py-4 rounded-2xl bg-emerald flex-row items-center justify-center shadow-lg shadow-emerald/20 active:opacity-90 mb-3 min-h-[52px]"
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm ml-2">
              Share / Save Output Document
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          testID="process-another-button"
          accessibilityLabel="Process Another"
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onReset}
          className="w-full py-3.5 rounded-2xl bg-surfaceElevated border border-border flex-row items-center justify-center min-h-[48px]"
        >
          <Text className="text-textSecondary font-bold text-sm mr-2">
            Process Another
          </Text>
          <ArrowRight size={15} color="#A1A1AA" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
