import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { PdfSplitMode } from '@docchisel/shared';
import { Split, CheckCircle2, FileText } from 'lucide-react-native';
import { getPdfPageCountMobile } from '../../services/mobileBridge';
import { renderPdfThumbnails } from '../../services/pdfThumbnailService';


interface PdfSplitPanelProps {
  filePath?: string;
  mode: PdfSplitMode;
  onChangeMode: (mode: PdfSplitMode) => void;
  ranges: string;
  onChangeRanges: (val: string) => void;
}

// Helper to check if a page number is in the user's range string
function isPageInRange(page: number, rangeStr: string): boolean {
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startS, endS] = trimmed.split('-');
      const start = parseInt(startS, 10);
      const end = parseInt(endS, 10);
      if (!isNaN(start) && !isNaN(end) && page >= start && page <= end) {
        return true;
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (p === page) return true;
    }
  }
  return false;
}

// Helper to convert set of selected page numbers to compact range string
function pageNumbersToRanges(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

export const PdfSplitPanel: React.FC<PdfSplitPanelProps> = ({
  filePath,
  mode,
  onChangeMode,
  ranges,
  onChangeRanges,
}) => {
  const [pageCount, setPageCount] = useState<number>(0);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  useEffect(() => {
    if (!filePath) {
      setPageCount(0);
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
        setPageCount(total);
        setIsLoadingPages(false);

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
          console.warn('[PdfSplitPanel] Thumbnail rendering error:', err);
        } finally {
          if (isMounted) {
            setIsLoadingThumbnails(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setPageCount(1);
          setIsLoadingPages(false);
          setIsLoadingThumbnails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  const handleTogglePage = (pageNumber: number) => {
    const isCurrentlySelected = isPageInRange(pageNumber, ranges);
    const currentSelected: number[] = [];
    for (let p = 1; p <= pageCount; p++) {
      if (isPageInRange(p, ranges)) {
        currentSelected.push(p);
      }
    }

    const updated = isCurrentlySelected
      ? currentSelected.filter((p) => p !== pageNumber)
      : [...currentSelected, pageNumber];

    onChangeRanges(pageNumbersToRanges(updated));
  };

  const handleSelectAll = () => {
    if (pageCount > 0) {
      onChangeRanges(pageNumbersToRanges(Array.from({ length: pageCount }, (_, i) => i + 1)));
    }
  };

  const handleSelectOdd = () => {
    if (pageCount > 0) {
      const odd = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
      onChangeRanges(pageNumbersToRanges(odd));
    }
  };

  const handleSelectEven = () => {
    if (pageCount > 0) {
      const even = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p % 2 === 0);
      onChangeRanges(pageNumbersToRanges(even));
    }
  };

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted">
          Split & Extract Modes
        </Text>
        {isLoadingPages && (
          <View className="flex-row items-center space-x-1">
            <ActivityIndicator size="small" color="#0B84FE" />
            <Text className="text-xs text-primary ml-1">Detecting pages...</Text>
          </View>
        )}
      </View>

      {/* Mode Switcher */}
      <View className="flex-row p-1 bg-surfaceElevated rounded-xl border border-border mb-4">
        <TouchableOpacity
          testID="split-mode-burst"
          accessibilityLabel="Split mode: Burst every page"
          accessibilityRole="button"
          onPress={() => onChangeMode('burst')}
          className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center mr-1 ${
            mode === 'burst' ? 'bg-primary' : ''
          }`}
        >
          <Split size={16} color={mode === 'burst' ? '#FFFFFF' : '#A1A1AA'} />
          <Text
            className={`text-sm font-bold ml-2 ${
              mode === 'burst' ? 'text-white' : 'text-textSecondary'
            }`}
          >
            Burst Every Page
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="split-mode-ranges"
          accessibilityLabel="Split mode: Custom ranges"
          accessibilityRole="button"
          onPress={() => onChangeMode('ranges')}
          className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center ${
            mode === 'ranges' ? 'bg-primary' : ''
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              mode === 'ranges' ? 'text-white' : 'text-textSecondary'
            }`}
          >
            Custom Ranges
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'burst' ? (
        <View className="p-3.5 rounded-xl bg-surfaceElevated border border-border">
          <Text className="text-sm text-textSecondary leading-5">
            Extracts each page into a separate single-page PDF document.
          </Text>
        </View>
      ) : (
        <View className="space-y-3">
          <View>
            <View className="flex-row flex-wrap items-center justify-between mb-2 gap-y-1.5">
              <Text className="text-sm font-semibold text-textSecondary mr-2">
                Selected Page Ranges
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-surfaceElevated border border-border mr-1.5"
                >
                  <Text className="text-xs text-textSecondary font-semibold">All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSelectOdd}
                  className="px-2.5 py-1 rounded-lg bg-surfaceElevated border border-border mr-1.5"
                >
                  <Text className="text-xs text-textSecondary font-semibold">Odd</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSelectEven}
                  className="px-2.5 py-1 rounded-lg bg-surfaceElevated border border-border mr-1.5"
                >
                  <Text className="text-xs text-textSecondary font-semibold">Even</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChangeRanges('')}
                  className="px-2.5 py-1 rounded-lg bg-surfaceElevated border border-border"
                >
                  <Text className="text-xs text-danger font-semibold">Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              testID="split-ranges-input"
              accessibilityLabel="Selected page ranges"
              value={ranges}
              onChangeText={onChangeRanges}
              placeholder="e.g. 1-3, 5, 8-10"
              placeholderTextColor="#71717A"
              className="w-full px-4 py-3 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
            />
            <Text className="text-xs text-textMuted mt-2 leading-5">
              Tap any page below to toggle it, or type your desired page ranges above.
            </Text>
          </View>
        </View>
      )}

      {/* Visual Page Cards Gallery */}
      {pageCount > 0 && (
        <View className="mt-4 pt-3.5 border-t border-border">
          <Text className="text-xs font-bold text-textMuted mb-3">
            Document Pages ({pageCount}) {mode === 'ranges' && '— Tap to Select'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            <View className="flex-row space-x-3">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = mode === 'ranges' ? isPageInRange(pageNum, ranges) : true;

                return (
                  <TouchableOpacity
                    key={pageNum}
                    testID={`split-page-${pageNum}`}
                    accessibilityLabel={`Page ${pageNum} ${isSelected ? 'Selected' : 'Unselected'}`}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                    onPress={() => mode === 'ranges' && handleTogglePage(pageNum)}
                    className={`w-32 p-3 rounded-2xl border items-center justify-between mr-3 ${
                      isSelected
                        ? 'bg-surfaceElevated border-primary'
                        : 'bg-surface border-border opacity-40'
                    }`}
                  >
                    <View className="w-full flex-row items-center justify-between mb-2">
                      <Text className="text-xs font-mono font-bold text-textPrimary">
                        Page {pageNum}
                      </Text>
                      {mode === 'ranges' && isSelected && (
                        <CheckCircle2 size={15} color="#0B84FE" />
                      )}
                    </View>

                    {/* Visual Page Sheet */}
                    <View className="w-full h-28 bg-zinc-950/70 rounded-xl border border-border items-center justify-center shadow-inner overflow-hidden relative">
                      {thumbnails[pageNum] ? (
                        <Image
                          source={{ uri: thumbnails[pageNum] }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View className="items-center justify-center">
                          {isLoadingThumbnails ? (
                            <ActivityIndicator size="small" color="#0B84FE" />
                          ) : (
                            <FileText size={26} color={isSelected ? '#0B84FE' : '#71717A'} />
                          )}
                          <Text className="text-[10px] font-mono text-textMuted mt-1.5 font-bold">
                            P.{pageNum}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      className="mt-2 text-xs text-textMuted font-mono text-center"
                      numberOfLines={1}
                    >
                      {mode === 'burst'
                        ? `page_${String(pageNum).padStart(3, '0')}.pdf`
                        : isSelected
                        ? 'Included'
                        : 'Excluded'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};
