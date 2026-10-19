import React, { useState } from 'react';
import {
  UploadCloud,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  LayoutGrid,
  List,
} from 'lucide-react';
import { selectFilesDialog } from '../services/tauriBridge';
import { FileThumbnail } from './FileThumbnail';

interface DropZoneProps {
  files: string[];
  onFilesChange: (files: string[]) => void;
  acceptedExtensions: string[];
  multiFile: boolean;
  minFiles: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  files,
  onFilesChange,
  acceptedExtensions,
  multiFile,
  minFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handlePickFiles = async () => {
    const selected = await selectFilesDialog(multiFile, acceptedExtensions);
    if (selected && selected.length > 0) {
      if (multiFile) {
        const merged = Array.from(new Set([...files, ...selected]));
        onFilesChange(merged);
      } else {
        onFilesChange([selected[0]]);
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newFiles = [...files];
    const [moved] = newFiles.splice(index, 1);
    newFiles.splice(targetIdx, 0, moved);
    onFilesChange(newFiles);
  };

  const getFileName = (path: string) => {
    return path.split(/[/\\]/).pop() || path;
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Area */}
      <div
        onClick={handlePickFiles}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handlePickFiles();
        }}
        className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border hover:border-primary/50 bg-surface/50 hover:bg-surface'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-surfaceElevated border border-border flex items-center justify-center text-primary shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-textPrimary">
              Click to choose files or drop them here
            </p>
            <p className="text-xs text-textMuted mt-0.5">
              Supports: {acceptedExtensions.join(', ')} •{' '}
              {multiFile ? 'Multiple files allowed' : 'Single file'}
            </p>
          </div>
        </div>
      </div>

      {/* Staged File Cards */}
      {files.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-textSecondary">
                Staged Files ({files.length}
                {files.length < minFiles ? ` - Needs at least ${minFiles}` : ''})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Grid / List View Toggle */}
              {files.length > 1 && (
                <div className="flex items-center bg-surfaceElevated rounded-lg p-0.5 border border-border mr-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-primary text-white'
                        : 'text-textMuted hover:text-textPrimary'
                    }`}
                    title="Grid View with Thumbnails"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-primary text-white'
                        : 'text-textMuted hover:text-textPrimary'
                    }`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {multiFile && (
                <button
                  type="button"
                  onClick={handlePickFiles}
                  className="flex items-center space-x-1.5 text-xs text-primary hover:text-white font-medium px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onFilesChange([])}
                className="text-xs text-textMuted hover:text-danger hover:bg-danger/10 font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Visual Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={file + idx}
                  className="group relative rounded-xl border border-border bg-surfaceElevated p-2.5 flex flex-col justify-between hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/10"
                >
                  {/* Sequence Tag & Remove Button */}
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-textSecondary">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(idx);
                      }}
                      className="p-1 rounded-md text-textMuted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      title="Remove File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/50 mb-2 border border-border/50">
                    <FileThumbnail
                      filePath={file}
                      className="w-full h-full"
                      showBadge={true}
                    />
                  </div>

                  {/* Truncated Name */}
                  <p
                    className="text-[11px] font-medium text-textPrimary truncate w-full mb-2"
                    title={file}
                  >
                    {getFileName(file)}
                  </p>

                  {/* Reorder Controls */}
                  {multiFile && (
                    <div className="w-full pt-1.5 border-t border-border/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-md text-textSecondary hover:text-primary hover:bg-surface disabled:opacity-20 disabled:hover:text-textSecondary disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-wider">
                        Order
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === files.length - 1}
                        className="p-1 rounded-md text-textSecondary hover:text-primary hover:bg-surface disabled:opacity-20 disabled:hover:text-textSecondary disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Compact List View with Thumbnails */
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={file + idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-surfaceElevated border border-border text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate mr-3">
                    <span className="text-textMuted font-mono text-[10px] w-4 text-right">
                      {idx + 1}.
                    </span>
                    <FileThumbnail
                      filePath={file}
                      className="w-10 h-10 rounded-md"
                      showBadge={false}
                    />
                    <div className="truncate">
                      <p className="text-textPrimary font-medium truncate" title={file}>
                        {getFileName(file)}
                      </p>
                      <span className="text-[10px] font-mono text-textMuted uppercase">
                        {file.split('.').pop()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {multiFile && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMove(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1.5 rounded-md text-textSecondary hover:text-primary hover:bg-surface disabled:opacity-20 disabled:hover:text-textSecondary disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMove(idx, 'down');
                          }}
                          disabled={idx === files.length - 1}
                          className="p-1.5 rounded-md text-textSecondary hover:text-primary hover:bg-surface disabled:opacity-20 disabled:hover:text-textSecondary disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(idx);
                      }}
                      className="p-1.5 rounded-md text-textMuted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
