import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOOL_CATALOG, ToolCategory } from '@docchisel/shared';
import { ToolCard } from '../components/ToolCard';
import { ShieldCheck, Search, HardDrive, Cpu } from 'lucide-react-native';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 720;
  const isLargeTablet = width >= 1024;

  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = TOOL_CATALOG.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-7xl mx-auto">
          {/* App Branding & Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-2xl bg-primary items-center justify-center mr-3 shadow-md shadow-primary/20">
                <HardDrive size={22} color="#FFFFFF" />
              </View>
              <View>
                <View className="flex-row items-center space-x-2">
                  <Text className="text-textPrimary text-2xl font-black tracking-tight">
                    DocChisel
                  </Text>
                  <View className="bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full ml-1.5">
                    <Text className="text-primary text-xs font-mono font-bold">
                      v0.1
                    </Text>
                  </View>
                </View>
                <Text className="text-textSecondary text-xs mt-0.5 font-medium">
                  100% Local PDF & Image Toolkit
                </Text>
              </View>
            </View>

            {/* Privacy badge */}
            <View className="flex-row items-center bg-emerald/10 border border-emerald/25 px-3 py-1.5 rounded-full">
              <ShieldCheck size={15} color="#10B981" />
              <Text className="text-emerald text-xs font-bold ml-1.5">
                Zero Cloud
              </Text>
            </View>
          </View>

          {/* Local Security & Acceleration Banner */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-emerald/10 items-center justify-center mr-3">
                <ShieldCheck size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary text-sm font-semibold">
                  100% Offline & Private
                </Text>
                <Text className="text-textMuted text-xs mt-0.5 leading-4">
                  On-device hardware-accelerated SIMD + Rayon multi-threaded engine.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center bg-cyan/10 border border-cyan/25 px-2.5 py-1 rounded-lg">
              <Cpu size={14} color="#06B6D4" />
              <Text className="text-cyan text-xs font-mono font-bold ml-1">
                SIMD
              </Text>
            </View>
          </View>

          {/* Hero Section */}
          <View className="mb-4">
            <Text className="text-2xl font-extrabold text-textPrimary tracking-tight">
              Everything you need for PDFs & Images
            </Text>
            <Text className="text-sm text-textSecondary mt-1 leading-5">
              Ultra-fast, hardware-accelerated batch operations performed entirely on your device with zero cloud uploads.
            </Text>
          </View>

          {/* Search Input */}
          <View className="bg-surface border border-border rounded-2xl flex-row items-center px-4 py-3 mb-4">
            <Search size={18} color="#A1A1AA" />
            <TextInput
              testID="search-input"
              accessibilityLabel="Search PDF & image tools"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search PDF & image tools..."
              placeholderTextColor="#71717A"
              className="flex-1 text-textPrimary text-sm ml-2.5"
            />
          </View>

          {/* Category Navigation Pills */}
          <View className="flex-row items-center mb-5">
            {(
              [
                { key: 'all', label: 'All Tools' },
                { key: 'pdf', label: 'PDF Tools' },
                { key: 'image', label: 'Image Studio' },
              ] as const
            ).map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  testID={`category-pill-${cat.key}`}
                  accessibilityLabel={`Filter by ${cat.label}`}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={{
                    backgroundColor: active ? '#0B84FE' : '#18181B',
                    borderColor: active ? '#0B84FE' : '#3F3F46',
                  }}
                  className="px-4 py-2.5 rounded-xl border mr-2.5 items-center justify-center"
                >
                  <Text
                    style={{ color: active ? '#FFFFFF' : '#A1A1AA' }}
                    className="text-sm font-semibold"
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tool Cards List (Responsive Grid for Floating Windows & Tablets) */}
          <View className="pb-16">
            <Text className="text-textMuted text-xs uppercase font-bold tracking-wider mb-3.5">
              Available Tools ({filteredTools.length})
            </Text>

            <View className={isTabletOrWide ? 'flex-row flex-wrap gap-x-[2%]' : 'flex-col'}>
              {filteredTools.map((tool) => (
                <View
                  key={tool.id}
                  className={
                    isLargeTablet
                      ? 'w-[32%]'
                      : isTabletOrWide
                      ? 'w-[49%]'
                      : 'w-full'
                  }
                >
                  <ToolCard tool={tool} />
                </View>
              ))}
            </View>

            {filteredTools.length === 0 && (
              <View className="py-12 items-center justify-center bg-surface rounded-2xl border border-border">
                <Text className="text-textSecondary text-sm font-medium">
                  No tools match "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
