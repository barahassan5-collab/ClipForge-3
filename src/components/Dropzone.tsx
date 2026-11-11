import React, { useRef, useState } from 'react';
import { Upload, Film, Sparkles, RefreshCw, AlertCircle, FileVideo } from 'lucide-react';
import { Language, VideoMetadata } from '../types';
import { translations } from '../utils/translations';
import { formatBytes, formatTimecode, getVideoMetadata } from '../utils/videoProcessor';
import { generateCountdownSampleVideo, generateMotionSampleVideo } from '../utils/sampleVideos';

interface DropzoneProps {
  metadata: VideoMetadata | null;
  onVideoSelected: (meta: VideoMetadata) => void;
  language: Language;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  metadata,
  onVideoSelected,
  language,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const meta = await getVideoMetadata(file);
      onVideoSelected(meta);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to read video file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const loadSample = async (type: 'countdown' | 'motion') => {
    setIsLoadingSample(true);
    setErrorMsg(null);
    try {
      const file = type === 'countdown' ? await generateCountdownSampleVideo() : await generateMotionSampleVideo();
      const meta = await getVideoMetadata(file);
      onVideoSelected(meta);
    } catch (err: unknown) {
      setErrorMsg('Could not generate sample video: ' + (err as Error).message);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // If a file is already loaded, render a sleek compact inspector bar with change button
  if (metadata) {
    return (
      <div className="bg-slate-900/80 dark:bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileVideo className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 truncate" title={metadata.name}>
                {metadata.name}
              </h3>
              {/* Unboxed metadata separated by middots */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5 flex-wrap">
                <span>{formatBytes(metadata.size)}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{formatTimecode(metadata.duration)}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{metadata.width}×{metadata.height}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="uppercase">{metadata.format}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t.dropzone.changeFile}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mkv,.mov,.avi,.flv,.wmv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Drag-and-drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {t.dropzone.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {t.dropzone.subtitle}
            </p>
          </div>

          <div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Film className="w-4 h-4" />
              {t.dropzone.chooseBtn}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mkv,.mov,.avi,.flv,.wmv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Instant sample video options */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t.dropzone.orTrySample}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoadingSample}
            onClick={() => loadSample('countdown')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-50"
          >
            {isLoadingSample ? 'Generating...' : t.dropzone.sampleCountdown}
          </button>
          <button
            type="button"
            disabled={isLoadingSample}
            onClick={() => loadSample('motion')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-50"
          >
            {isLoadingSample ? 'Generating...' : t.dropzone.sampleDrone}
          </button>
        </div>
      </div>
    </div>
  );
};
