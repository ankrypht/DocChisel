import React from 'react';
import { View, Text } from 'react-native';
import { formatBytes } from '../services/mobileBridge';

interface SavingsBadgeProps {
  originalBytes: number;
  resultBytes: number;
}

export function SavingsBadge({ originalBytes, resultBytes }: SavingsBadgeProps) {
  if (originalBytes <= 0) return null;

  const diff = originalBytes - resultBytes;
  const percent = Math.round((diff / originalBytes) * 100);

  if (diff <= 0) {
    return (
      <View className="bg-surfaceElevated border border-border px-3 py-1.5 rounded-xl self-start">
        <Text className="text-textSecondary text-xs">
          Size: {formatBytes(resultBytes)}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-emerald/10 border border-emerald/25 px-3 py-2 rounded-xl">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-emerald font-bold text-sm">
            Saved {percent}% ({formatBytes(diff)})
          </Text>
          <Text className="text-textMuted text-xs mt-0.5 font-mono">
            {formatBytes(originalBytes)} → {formatBytes(resultBytes)}
          </Text>
        </View>
        <View className="bg-emerald/20 px-2.5 py-1 rounded-lg border border-emerald/30">
          <Text className="text-emerald font-bold text-xs font-mono">
            -{percent}%
          </Text>
        </View>
      </View>
    </View>
  );
}
