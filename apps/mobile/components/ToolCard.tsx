import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ToolMetadata, TOOL_THEMES } from '@docchisel/shared';
import {
  Files,
  Split,
  LayoutGrid,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';

interface ToolCardProps {
  tool: ToolMetadata;
}

export function ToolCard({ tool }: ToolCardProps) {
  const router = useRouter();
  const theme = TOOL_THEMES[tool.id] || TOOL_THEMES.pdf_merge;

  const renderIcon = () => {
    const size = 24;
    const color = theme.hexColor;

    switch (tool.id) {
      case 'pdf_merge':
        return <Files size={size} color={color} />;
      case 'pdf_split':
        return <Split size={size} color={color} />;
      case 'pdf_organize':
        return <LayoutGrid size={size} color={color} />;
      case 'images_to_pdf':
        return <ImageIcon size={size} color={color} />;
      case 'image_studio':
        return <Sparkles size={size} color={color} />;
      default:
        return <Files size={size} color={color} />;
    }
  };

  return (
    <TouchableOpacity
      testID={`tool-card-${tool.id}`}
      accessibilityLabel={`Open ${tool.name} tool`}
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={() => router.push(`/tool/${tool.id}` as any)}
      className="bg-surface border border-border rounded-2xl p-5 mb-4 shadow-sm"
    >
      <View className="flex-row items-center justify-between mb-2.5">
        {/* Themed Icon Container */}
        <View
          style={{
            backgroundColor: `${theme.hexColor}1A`,
            borderColor: `${theme.hexColor}40`,
          }}
          className="w-12 h-12 rounded-xl items-center justify-center border"
        >
          {renderIcon()}
        </View>

        {tool.badge && (
          <View
            style={{
              backgroundColor: `${theme.hexColor}1A`,
              borderColor: `${theme.hexColor}4D`,
            }}
            className="px-3 py-1 rounded-full border"
          >
            <Text
              style={{ color: theme.hexColor }}
              className="text-xs font-bold tracking-wide uppercase"
            >
              {tool.badge}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-textPrimary font-bold text-lg mt-1">
        {tool.name}
      </Text>
      <Text className="text-textSecondary text-sm mt-0.5 font-semibold">
        {tool.tagline}
      </Text>
      <Text className="text-textMuted text-sm mt-2 leading-5" numberOfLines={2}>
        {tool.description}
      </Text>

      {/* Select Tool Footer Action */}
      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-border/50">
        <Text className="text-sm font-semibold text-textSecondary">
          Select Tool
        </Text>
        <ArrowRight size={16} color={theme.hexColor} />
      </View>
    </TouchableOpacity>
  );
}
