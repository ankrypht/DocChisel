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
} from 'lucide-react-native';

interface ToolCardProps {
  tool: ToolMetadata;
}

export function ToolCard({ tool }: ToolCardProps) {
  const router = useRouter();
  const theme = TOOL_THEMES[tool.id] || TOOL_THEMES.pdf_merge;

  const renderIcon = () => {
    const size = 22;
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
      style={{
        borderColor: `${theme.hexColor}60`,
        shadowColor: theme.hexColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
      }}
      className="bg-surface border rounded-2xl p-4 mb-3.5"
    >
      <View className="flex-row items-center mb-2">
        {/* Themed Icon Container */}
        <View
          style={{
            backgroundColor: `${theme.hexColor}1A`,
            borderColor: `${theme.hexColor}40`,
          }}
          className="w-11 h-11 rounded-xl items-center justify-center border mr-3"
        >
          {renderIcon()}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-textPrimary font-bold text-base">
              {tool.name}
            </Text>
            {tool.badge && (
              <View
                style={{
                  backgroundColor: `${theme.hexColor}1A`,
                  borderColor: `${theme.hexColor}40`,
                }}
                className="px-2 py-0.5 rounded-full border"
              >
                <Text
                  style={{ color: theme.hexColor }}
                  className="text-[10px] font-bold tracking-wide uppercase"
                >
                  {tool.badge}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text className="text-textSecondary text-xs leading-5">
        {tool.description}
      </Text>
    </TouchableOpacity>
  );
}
