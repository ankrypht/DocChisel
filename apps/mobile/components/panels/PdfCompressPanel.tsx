import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { PdfCompressLevel } from '@docchisel/shared';
import { Minimize2, Zap, ShieldCheck } from 'lucide-react-native';

interface PdfCompressPanelProps {
  level: PdfCompressLevel;
  onChangeLevel: (lvl: PdfCompressLevel) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfCompressPanel: React.FC<PdfCompressPanelProps> = ({
  level,
  onChangeLevel,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const levels: {
    key: PdfCompressLevel;
    title: string;
    description: string;
    badge: string;
    quality: string;
    icon: typeof Zap;
  }[] = [
    {
      key: 'extreme',
      title: 'Extreme Compression',
      description: 'Maximum file size reduction with lower image quality.',
      badge: 'Up to -80%',
      quality: 'Low (45%)',
      icon: Minimize2,
    },
    {
      key: 'recommended',
      title: 'Recommended Compression',
      description: 'Ideal balance between visual fidelity and great size savings.',
      badge: 'Up to -60%',
      quality: 'Balanced (65%)',
      icon: Zap,
    },
    {
      key: 'low',
      title: 'Less Compression',
      description: 'High quality retained with minimal image downsampling.',
      badge: 'Up to -30%',
      quality: 'High (80%)',
      icon: ShieldCheck,
    },
  ];

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted">
          Compression Settings
        </Text>
        <View className="px-2.5 py-0.5 rounded-full bg-emerald/10 border border-emerald/25">
          <Text className="text-[10px] font-mono font-bold text-emerald">
            100% Local & Offline
          </Text>
        </View>
      </View>

      {/* Preset Cards */}
      <View className="space-y-2.5 mb-4">
        {levels.map((item) => {
          const active = level === item.key;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              testID={`compress-level-${item.key}`}
              accessibilityLabel={`${item.title} ${item.badge}`}
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={() => onChangeLevel(item.key)}
              className={`p-3.5 rounded-xl border mb-2 ${
                active
                  ? 'bg-emerald/10 border-emerald/60 shadow-sm'
                  : 'bg-surfaceElevated border-border'
              }`}
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center">
                  <Icon
                    size={16}
                    color={active ? '#10B981' : '#A1A1AA'}
                  />
                  <Text
                    className={`text-sm font-bold ml-2 ${
                      active ? 'text-textPrimary' : 'text-textSecondary'
                    }`}
                  >
                    {item.title}
                  </Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-md ${
                    active ? 'bg-emerald' : 'bg-zinc-800'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      active ? 'text-zinc-950' : 'text-textSecondary'
                    }`}
                  >
                    {item.badge}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-textMuted leading-5 mb-2">
                {item.description}
              </Text>

              <View className="pt-2 border-t border-border/50 flex-row items-center justify-between">
                <Text className="text-[11px] text-textMuted">Image Quality:</Text>
                <Text className="text-[11px] font-semibold text-textSecondary">
                  {item.quality}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filename Input */}
      <View>
        <Text className="text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </Text>
        <TextInput
          testID="compress-output-filename"
          accessibilityLabel="Output PDF Filename"
          value={outputFilename}
          onChangeText={onChangeOutputFilename}
          placeholder="compressed_document.pdf"
          placeholderTextColor="#71717A"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
        />
      </View>
    </View>
  );
};
