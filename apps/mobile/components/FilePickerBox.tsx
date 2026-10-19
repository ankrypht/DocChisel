import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  List,
} from 'lucide-react-native';
import { FileThumbnail } from './FileThumbnail';


interface FilePickerBoxProps {
  files: string[];
  onPick: () => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onReorder?: (newFiles: string[]) => void;
  title: string;
  subtitle: string;
  multiple: boolean;
  minFiles?: number;
}

export function FilePickerBox({
  files,
  onPick,
  onRemove,
  onClear,
  onReorder,
  title,
  subtitle,
  multiple,
  minFiles = 1,
}: FilePickerBoxProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getFileName = (uri: string) => {
    const parts = uri.split('/');
    return decodeURIComponent(parts[parts.length - 1] || uri);
  };

  const getFileExtension = (uri: string) => {
    const ext = uri.split('.').pop()?.toLowerCase() || '';
    return ext === 'jpeg' ? 'jpg' : ext;
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!onReorder) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newFiles = [...files];
    const [moved] = newFiles.splice(index, 1);
    newFiles.splice(targetIdx, 0, moved);
    onReorder(newFiles);
  };

  return (
    <View className="mb-5">
      {/* Tap to Pick Box */}
      <TouchableOpacity
        testID="file-picker-dropzone"
        accessibilityLabel={title}
        accessibilityRole="button"
        activeOpacity={0.7}
        onPress={onPick}
        className="border-2 border-dashed border-border rounded-2xl p-6 items-center justify-center bg-surface/50 active:bg-surface active:border-primary mb-4"
      >
        <View className="w-14 h-14 rounded-2xl bg-surfaceElevated border border-border items-center justify-center mb-3 shadow-sm">
          <UploadCloud size={28} color="#0B84FE" />
        </View>
        <Text className="text-textPrimary font-bold text-base mb-1.5 text-center">
          {title}
        </Text>
        <Text className="text-textSecondary text-sm text-center px-4 leading-5">
          {subtitle}
        </Text>
      </TouchableOpacity>

      {/* Staged File Cards */}
      {files.length > 0 && (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-border">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center">
                <Text className="text-textPrimary font-bold text-sm">
                  Staged Files ({files.length})
                </Text>
                {files.length < minFiles && (
                  <View className="ml-1.5 px-1.5 py-0.5 bg-amber/15 border border-amber/30 rounded-md">
                    <Text className="text-[10px] font-mono text-amber font-semibold">
                      Min {minFiles}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row items-center">
              {/* Grid / List View Toggle */}
              {files.length > 1 && (
                <View className="flex-row items-center bg-surfaceElevated rounded-xl p-0.5 border border-border mr-1.5">
                  <TouchableOpacity
                    onPress={() => setViewMode('grid')}
                    className={`p-1 rounded-lg ${viewMode === 'grid' ? 'bg-primary' : ''}`}
                  >
                    <LayoutGrid
                      size={13}
                      color={viewMode === 'grid' ? '#FFFFFF' : '#A1A1AA'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode('list')}
                    className={`p-1 rounded-lg ${viewMode === 'list' ? 'bg-primary' : ''}`}
                  >
                    <List
                      size={13}
                      color={viewMode === 'list' ? '#FFFFFF' : '#A1A1AA'}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {multiple && (
                <TouchableOpacity
                  testID="add-more-files-button"
                  accessibilityLabel="Add More Files"
                  accessibilityRole="button"
                  onPress={onPick}
                  className="bg-primary/10 border border-primary/25 px-2.5 py-1.5 rounded-xl flex-row items-center mr-1.5 active:bg-primary/20"
                >
                  <Plus size={13} color="#0B84FE" />
                  <Text className="text-primary text-xs ml-1 font-bold">Add</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                testID="clear-staged-files-button"
                accessibilityLabel="Clear All Staged Files"
                accessibilityRole="button"
                onPress={onClear}
                className="px-2.5 py-1.5 bg-surfaceElevated border border-border rounded-xl active:bg-surface"
              >
                <Text className="text-textMuted text-xs font-semibold">Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Files List / Grid */}
          {viewMode === 'list' ? (
            <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
              {files.map((file, idx) => {
                const ext = getFileExtension(file);
                const isImage = ['jpg', 'png', 'webp'].includes(ext);
                const isPdf = ext === 'pdf';
                const fileUri = file.startsWith('file://') ? file : `file://${file}`;

                return (
                  <View
                    key={`${file}-${idx}`}
                    className="flex-row items-center justify-between py-3 px-3.5 bg-surfaceElevated rounded-2xl mb-2.5 border border-border"
                  >
                    {/* Thumbnail + Name */}
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="mr-3">
                        <FileThumbnail filePath={file} size="sm" showBadge={false} />
                      </View>

                      <View className="flex-1">
                        <Text
                          className="text-textPrimary text-sm font-semibold"
                          numberOfLines={1}
                          ellipsizeMode="middle"
                        >
                          {getFileName(file)}
                        </Text>
                        <Text className="text-textMuted text-xs font-mono uppercase mt-0.5">
                          {ext} • #{idx + 1}
                        </Text>
                      </View>
                    </View>

                    {/* Actions: Move Up / Down & Remove */}
                    <View className="flex-row items-center space-x-1.5">
                      {multiple && onReorder && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-surface border border-border mr-1.5"
                          >
                            <ArrowUp
                              size={14}
                              color={idx === 0 ? '#3F3F46' : '#A1A1AA'}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMove(idx, 'down')}
                            disabled={idx === files.length - 1}
                            className="p-1.5 rounded-lg bg-surface border border-border mr-2"
                          >
                            <ArrowDown
                              size={14}
                              color={idx === files.length - 1 ? '#3F3F46' : '#A1A1AA'}
                            />
                          </TouchableOpacity>
                        </>
                      )}

                      <TouchableOpacity
                        onPress={() => onRemove(idx)}
                        className="p-1.5 rounded-lg bg-surface border border-border"
                      >
                        <X size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            /* Grid View */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row space-x-3">
                {files.map((file, idx) => {
                  const ext = getFileExtension(file);

                  return (
                    <View
                      key={`${file}-${idx}`}
                      className="w-36 p-3 rounded-2xl bg-surfaceElevated border border-border mr-3 items-center justify-between"
                    >
                      {/* Top Header */}
                      <View className="w-full flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-mono font-bold text-textSecondary">
                          #{idx + 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() => onRemove(idx)}
                          className="p-1 rounded-md"
                        >
                          <X size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Thumbnail Container */}
                      <View className="w-full h-24 mb-2">
                        <FileThumbnail filePath={file} size="full" showBadge={true} />
                      </View>

                      {/* File Name */}
                      <Text
                        className="text-xs text-textPrimary text-center w-full font-medium"
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {getFileName(file)}
                      </Text>

                      {/* Reorder Arrows in Grid */}
                      {multiple && onReorder && files.length > 1 && (
                        <View className="flex-row items-center justify-center mt-2 pt-1.5 border-t border-border/60 w-full space-x-2">
                          <TouchableOpacity
                            onPress={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-surface border border-border mr-1.5"
                          >
                            <ArrowLeft
                              size={13}
                              color={idx === 0 ? '#3F3F46' : '#A1A1AA'}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMove(idx, 'down')}
                            disabled={idx === files.length - 1}
                            className="p-1.5 rounded-lg bg-surface border border-border"
                          >
                            <ArrowRight
                              size={13}
                              color={idx === files.length - 1 ? '#3F3F46' : '#A1A1AA'}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}
