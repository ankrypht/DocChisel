import React, { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { FileText, Image as ImageIcon } from 'lucide-react-native';
import { getPdfPageCountMobile } from '../services/mobileBridge';
import { renderPdfThumbnail } from '../services/pdfThumbnailService';

interface FileThumbnailProps {
  filePath: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showBadge?: boolean;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  filePath,
  size = 'md',
  showBadge = true,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';
  const fileUri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadThumb() {
      try {
        if (isImage) {
          if (isMounted) {
            setThumbUrl(fileUri);
            setIsLoading(false);
          }
        } else if (isPdf) {
          // 1. Fetch total page count in background
          getPdfPageCountMobile(filePath)
            .then((count) => {
              if (isMounted) setPageCount(count);
            })
            .catch(() => {});

          // 2. Fetch native page 1 thumbnail
          const uri = await renderPdfThumbnail(filePath, 1, 260);
          if (isMounted) {
            if (uri) {
              setThumbUrl(uri);
            }
            setIsLoading(false);
          }
        } else {
          if (isMounted) setIsLoading(false);
        }
      } catch (err) {
        console.warn('[FileThumbnail] Failed to load thumb:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadThumb();

    return () => {
      isMounted = false;
    };
  }, [filePath, isImage, isPdf]);

  const containerSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    full: 'w-full h-full',
  };

  const iconSizes = {
    sm: 20,
    md: 26,
    lg: 32,
    full: 28,
  };

  return (
    <View
      className={`${containerSizes[size]} bg-zinc-950 rounded-xl overflow-hidden items-center justify-center border border-border relative`}
    >
      {thumbUrl ? (
        <Image
          source={{ uri: thumbUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={isPdf ? 'contain' : 'cover'}
        />
      ) : isLoading ? (
        <ActivityIndicator size="small" color={isPdf ? '#EF4444' : '#0B84FE'} />
      ) : isPdf ? (
        <FileText size={iconSizes[size]} color="#EF4444" />
      ) : isImage ? (
        <ImageIcon size={iconSizes[size]} color="#0B84FE" />
      ) : (
        <FileText size={iconSizes[size]} color="#71717A" />
      )}

      {/* Page Count or Extension Badge */}
      {showBadge && (
        <View className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-zinc-950/90 rounded border border-zinc-700/90 shadow-sm">
          {isPdf ? (
            <Text className="text-[10px] font-mono font-bold text-zinc-100">
              {pageCount !== null ? `${pageCount}p` : 'PDF'}
            </Text>
          ) : isImage ? (
            <Text className="text-[10px] font-mono uppercase font-bold text-textSecondary">
              {ext === 'jpeg' ? 'jpg' : ext}
            </Text>
          ) : (
            <Text className="text-[10px] font-mono uppercase font-bold text-textSecondary">
              {ext}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
