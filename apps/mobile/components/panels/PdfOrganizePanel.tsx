import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { PageRotation } from '@docchisel/shared';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  FileText,
} from 'lucide-react-native';
import { getPdfPageCountMobile } from '../../services/mobileBridge';
import { renderPdfThumbnails } from '../../services/pdfThumbnailService';

interface PageItem {
  originalPage: number;
  rotation: 0 | 90 | 180 | 270;
  deleted: boolean;
}

interface PdfOrganizePanelProps {
  filePath?: string;
  onStateChange: (state: {
    rotations: PageRotation[];
    pageOrder: number[];
    deletedPages: number[];
  }) => void;
}

export const PdfOrganizePanel: React.FC<PdfOrganizePanelProps> = ({
  filePath,
  onStateChange,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  useEffect(() => {
    if (!filePath) {
      setPages([]);
      setThumbnails({});
      return;
    }

    let isMounted = true;
    setIsLoadingPages(true);
    setIsLoadingThumbnails(true);

    getPdfPageCountMobile(filePath)
      .then(async (count) => {
        if (!isMounted) return;
        const total = Math.max(1, count);
        const initialPages: PageItem[] = Array.from({ length: total }, (_, i) => ({
          originalPage: i + 1,
          rotation: 0,
          deleted: false,
        }));
        setPages(initialPages);
        setIsLoadingPages(false);
        onStateChange({
          rotations: [],
          pageOrder: initialPages.map((p) => p.originalPage),
          deletedPages: [],
        });

        try {
          await renderPdfThumbnails(filePath, total, 260, (thumb) => {
            if (isMounted) {
              setThumbnails((prev) => ({
                ...prev,
                [thumb.pageNumber]: thumb.uri,
              }));
            }
          });
        } catch (err) {
          console.warn('[PdfOrganizePanel] Thumbnail render error:', err);
        } finally {
          if (isMounted) {
            setIsLoadingThumbnails(false);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = [{ originalPage: 1, rotation: 0 as const, deleted: false }];
        setPages(fallback);
        setIsLoadingPages(false);
        setIsLoadingThumbnails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  const emitChanges = (updated: PageItem[]) => {
    setPages(updated);

    const rotations: PageRotation[] = [];
    const pageOrder: number[] = [];
    const deletedPages: number[] = [];

    updated.forEach((p) => {
      if (p.deleted) {
        deletedPages.push(p.originalPage);
      } else {
        pageOrder.push(p.originalPage);
        if (p.rotation !== 0) {
          rotations.push({ page_number: p.originalPage, degrees: p.rotation });
        }
      }
    });

    onStateChange({ rotations, pageOrder, deletedPages });
  };

  const handleRotate = (idx: number, clockwise: boolean = true) => {
    const updated = [...pages];
    const currentRot = updated[idx].rotation;
    const diff = clockwise ? 90 : 270;
    const nextRot = ((currentRot + diff) % 360) as 0 | 90 | 180 | 270;
    updated[idx] = { ...updated[idx], rotation: nextRot };
    emitChanges(updated);
  };

  const handleRotateAll = () => {
    const updated = pages.map((p) => ({
      ...p,
      rotation: (((p.rotation + 90) % 360) as 0 | 90 | 180 | 270),
    }));
    emitChanges(updated);
  };

  const handleToggleDelete = (idx: number) => {
    const updated = [...pages];
    updated[idx] = { ...updated[idx], deleted: !updated[idx].deleted };
    emitChanges(updated);
  };

  const handleMove = (idx: number, dir: 'left' | 'right') => {
    if (dir === 'left' && idx === 0) return;
    if (dir === 'right' && idx === pages.length - 1) return;

    const targetIdx = dir === 'left' ? idx - 1 : idx + 1;
    const updated = [...pages];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    emitChanges(updated);
  };

  const handleReset = () => {
    const reset = pages.map((_, i) => ({
      originalPage: i + 1,
      rotation: 0 as const,
      deleted: false,
    }));
    emitChanges(reset);
  };

  const activePagesCount = pages.filter((p) => !p.deleted).length;

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header Controls */}
      <View className="pb-3 border-b border-border mb-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-textMuted">
            Page Layout & Rotations
          </Text>
          <View className="bg-purple/10 border border-purple/30 px-2.5 py-0.5 rounded-full">
            <Text className="text-xs font-mono font-bold text-purple">
              {activePagesCount}/{pages.length} Active
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-border/30">
          <Text className="text-xs text-textMuted flex-1 mr-2" numberOfLines={1}>
            Rotate, reorder, or remove pages
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              testID="organize-rotate-all-button"
              accessibilityLabel="Rotate all pages 90 degrees"
              accessibilityRole="button"
              onPress={handleRotateAll}
              className="flex-row items-center bg-surfaceElevated px-2.5 py-1.5 rounded-xl border border-border mr-1.5 active:bg-surface"
            >
              <RotateCw size={13} color="#8B5CF6" />
              <Text className="text-xs font-bold text-textSecondary ml-1">+90° All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="organize-reset-button"
              accessibilityLabel="Reset page organization"
              accessibilityRole="button"
              onPress={handleReset}
              className="flex-row items-center bg-surfaceElevated px-2.5 py-1.5 rounded-xl border border-border active:bg-surface"
            >
              <RefreshCcw size={13} color="#71717A" />
              <Text className="text-xs font-semibold text-textMuted ml-1">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoadingPages ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text className="text-xs text-textMuted mt-2">Analyzing PDF pages...</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row">
            {pages.map((p, idx) => {
              return (
                <View
                  key={p.originalPage}
                  className={`w-48 p-3 rounded-2xl border mr-3 ${
                    p.deleted
                      ? 'bg-surfaceElevated/40 border-danger/40 opacity-40'
                      : 'bg-surfaceElevated border-border'
                  }`}
                >
                  {/* Sequence & Rotation Badges */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-bold font-mono text-textSecondary">
                      #{idx + 1}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-md ${
                        p.rotation !== 0
                          ? 'bg-purple/20 border border-purple/40'
                          : 'bg-surface border border-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-mono font-bold ${
                          p.deleted ? 'text-danger' : p.rotation !== 0 ? 'text-purple' : 'text-textMuted'
                        }`}
                      >
                        {p.deleted ? 'Removed' : `${p.rotation}°`}
                      </Text>
                    </View>
                  </View>

                  {/* Visual Page Sheet */}
                  <View className="w-full h-32 bg-zinc-950/80 rounded-xl border border-border items-center justify-center relative overflow-hidden">
                    {thumbnails[p.originalPage] ? (
                      <View
                        style={{
                          width: '100%',
                          height: '100%',
                          transform: [{ rotate: `${p.rotation}deg` }],
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Image
                          source={{ uri: thumbnails[p.originalPage] }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          transform: [{ rotate: `${p.rotation}deg` }],
                        }}
                        className="items-center justify-center"
                      >
                        {isLoadingThumbnails ? (
                          <ActivityIndicator size="small" color="#8B5CF6" />
                        ) : (
                          <FileText size={32} color={p.deleted ? '#EF4444' : '#8B5CF6'} />
                        )}
                        <Text className="text-xs font-mono font-bold text-textSecondary mt-1.5">
                          Page {p.originalPage}
                        </Text>
                      </View>
                    )}

                    {/* Deleted Overlay */}
                    {p.deleted && (
                      <View className="absolute inset-0 bg-danger/80 items-center justify-center">
                        <Trash2 size={20} color="#FFFFFF" />
                        <Text className="text-white text-xs font-bold mt-1">Removed</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions Toolbar */}
                  <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-border/50">
                    {/* Rotate Buttons */}
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        testID={`page-rotate-ccw-${p.originalPage}`}
                        accessibilityLabel={`Rotate Page ${p.originalPage} Counter-Clockwise`}
                        accessibilityRole="button"
                        onPress={() => handleRotate(idx, false)}
                        disabled={p.deleted}
                        className="p-1.5 rounded-lg mr-1 bg-surface border border-border/60"
                      >
                        <RotateCcw size={14} color={p.deleted ? '#71717A' : '#8B5CF6'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`page-rotate-cw-${p.originalPage}`}
                        accessibilityLabel={`Rotate Page ${p.originalPage} Clockwise`}
                        accessibilityRole="button"
                        onPress={() => handleRotate(idx, true)}
                        disabled={p.deleted}
                        className="p-1.5 rounded-lg bg-surface border border-border/60"
                      >
                        <RotateCw size={14} color={p.deleted ? '#71717A' : '#8B5CF6'} />
                      </TouchableOpacity>
                    </View>

                    {/* Reorder Arrows */}
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        testID={`page-move-left-${p.originalPage}`}
                        accessibilityLabel={`Move Page ${p.originalPage} Left`}
                        accessibilityRole="button"
                        onPress={() => handleMove(idx, 'left')}
                        disabled={idx === 0 || p.deleted}
                        className="p-1.5 rounded-lg mr-1 bg-surface border border-border/60"
                      >
                        <ArrowLeft
                          size={14}
                          color={idx === 0 || p.deleted ? '#3F3F46' : '#A1A1AA'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`page-move-right-${p.originalPage}`}
                        accessibilityLabel={`Move Page ${p.originalPage} Right`}
                        accessibilityRole="button"
                        onPress={() => handleMove(idx, 'right')}
                        disabled={idx === pages.length - 1 || p.deleted}
                        className="p-1.5 rounded-lg bg-surface border border-border/60"
                      >
                        <ArrowRight
                          size={14}
                          color={idx === pages.length - 1 || p.deleted ? '#3F3F46' : '#A1A1AA'}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Delete / Restore */}
                    <TouchableOpacity
                      testID={`page-delete-${p.originalPage}`}
                      accessibilityLabel={`Toggle Delete Page ${p.originalPage}`}
                      accessibilityRole="button"
                      onPress={() => handleToggleDelete(idx)}
                      className="p-1.5 rounded-lg bg-surface border border-border/60"
                    >
                      <Trash2 size={14} color={p.deleted ? '#10B981' : '#EF4444'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};
