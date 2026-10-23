import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOOL_CATALOG, FilterCategory, CATEGORY_FILTERS } from '@docchisel/shared';
import { ToolCard } from '../components/ToolCard';
import { ShieldCheck } from 'lucide-react-native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 720;
  const isLargeTablet = width >= 1024;

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  const filteredTools = TOOL_CATALOG.filter((tool) => {
    if (selectedCategory === 'all') return true;
    return tool.category === selectedCategory;
  });

  return (
    <View className="flex-1 bg-canvas">
      {/* Sticky App Header expanding under status bar */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        }}
        className="bg-surface border-b border-border pb-3.5"
      >
        <View className="flex-row items-center justify-between">
          {/* Prominent Brand Logo & App Name */}
          <View className="flex-row items-center shrink-1 min-w-0">
            <Image
              source={require('../assets/icon.png')}
              style={{ width: 40, height: 40, borderRadius: 10 }}
              className="mr-3 shrink-0"
              resizeMode="contain"
            />
            <View className="flex-row items-center shrink-1 min-w-0">
              <Text className="text-textPrimary text-xl font-black tracking-tight" numberOfLines={1}>
                DocChisel
              </Text>
              <View className="bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                <Text className="text-primary text-[10px] font-mono font-bold">
                  v0.1
                </Text>
              </View>
            </View>
          </View>

          {/* 100% Offline & Private Badge matching Desktop */}
          <View className="flex-row items-center bg-surfaceElevated border border-border px-2.5 py-1.5 rounded-xl shadow-xs shrink-0">
            <ShieldCheck size={13} color="#10B981" />
            <Text className="text-textPrimary text-xs font-semibold ml-1.5">
              100% Offline & Private
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Tool Cards Content */}
      <ScrollView
        className="flex-1 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 32,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        }}
      >
        <View className="w-full max-w-7xl mx-auto">
          {/* Hero Intro */}
          <View className="mb-5 items-center px-2">
            <Text className="text-2xl font-black text-textPrimary text-center tracking-tight">
              Everything you need for PDFs & Images
            </Text>
            <Text className="mt-2 text-xs text-textSecondary text-center leading-5 max-w-sm">
              Ultra-fast operations performed entirely on your device with zero cloud uploads.
            </Text>
          </View>

          {/* Category Filter Chips dynamically wrapped according to screen width/orientation */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            }}
            className="mb-6 px-1"
          >
            {CATEGORY_FILTERS.map((cat) => {
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
                  className="px-5 py-2.5 rounded-2xl border items-center justify-center shadow-xs"
                >
                  <Text
                    style={{ color: active ? '#FFFFFF' : '#D4D4D8' }}
                    className="text-sm font-bold tracking-tight"
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tool Grid Header */}
          <Text className="text-textMuted text-xs uppercase font-bold tracking-wider mb-3">
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
        </View>
      </ScrollView>
    </View>
  );
}
