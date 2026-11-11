import React, { useState } from 'react';
import { RefreshCw, Film, Image as ImageIcon, Music, Check, Sparkles } from 'lucide-react';
import { ConvertSettings, Language, VideoMetadata } from '../types';
import { translations } from '../utils/translations';
import { formatTimecode } from '../utils/videoProcessor';

interface ConverterViewProps {
  metadata: VideoMetadata;
  language: Language;
  onStartConvert: (settings: ConvertSettings) => void;
}

export const ConverterView: React.FC<ConverterViewProps> = ({
  metadata,
  language,
  onStartConvert,
}) => {
  const t = translations[language];

  const [format, setFormat] = useState<'mp4' | 'webm' | 'gif' | 'mp3' | 'wav'>('mp4');
  const [aspectRatio, setAspectRatio] = useState<'original' | '16:9' | '9:16' | '1:1'>('original');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [gifFps, setGifFps] = useState<number>(15);

  const handleStart = () => {
    onStartConvert({
      format,
      aspectRatio,
      quality,
      gifFps,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-400" />
          {t.convert.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {t.convert.description}
        </p>
      </div>

      {/* Format Selection Grid */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t.convert.targetFormat}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* MP4 */}
          <button
            type="button"
            onClick={() => setFormat('mp4')}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
              format === 'mp4'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-400">MP4</span>
              {format === 'mp4' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2">H.264 Universal</p>
          </button>

          {/* WebM */}
          <button
            type="button"
            onClick={() => setFormat('webm')}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
              format === 'webm'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400">WebM</span>
              {format === 'webm' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2">VP9 Modern Web</p>
          </button>

          {/* GIF */}
          <button
            type="button"
            onClick={() => setFormat('gif')}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
              format === 'gif'
                ? 'border-pink-500 bg-pink-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-pink-400">GIF</span>
              {format === 'gif' && <Check className="w-4 h-4 text-pink-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2">Animated Loop</p>
          </button>

          {/* MP3 */}
          <button
            type="button"
            onClick={() => setFormat('mp3')}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
              format === 'mp3'
                ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-400">MP3</span>
              {format === 'mp3' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2">Audio Only</p>
          </button>

          {/* WAV */}
          <button
            type="button"
            onClick={() => setFormat('wav')}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
              format === 'wav'
                ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-400">WAV</span>
              {format === 'wav' && <Check className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2">Lossless Audio</p>
          </button>
        </div>
      </div>

      {/* Aspect Ratio & Frame Options (if video or GIF) */}
      {format !== 'mp3' && format !== 'wav' && (
        <div className="space-y-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">
              {t.convert.aspectRatio}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('original')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  aspectRatio === 'original'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                {t.convert.aspectOriginal}
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                {t.convert.aspect169}
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                {t.convert.aspect916}
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  aspectRatio === '1:1'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                {t.convert.aspect11}
              </button>
            </div>
          </div>

          {format === 'gif' && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t.convert.gifFps}</span>
                <span className="font-mono text-indigo-400 font-semibold">{gifFps} FPS</span>
              </div>
              <div className="flex gap-2">
                {[10, 15, 20].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGifFps(rate)}
                    className={`flex-1 py-1 px-3 text-xs font-mono font-medium rounded-lg border transition-colors ${
                      gifFps === rate
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {rate} FPS {rate === 15 ? '(Recommended)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-950 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Converting from: <strong className="font-mono text-slate-200">{metadata.format}</strong></span>
            <span aria-hidden="true">→</span>
            <span>Target: <strong className="font-mono text-indigo-400 uppercase">{format}</strong></span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Processed instantly using standard HTML5 Canvas & Media streams.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" />
          {t.convert.convertBtn}
        </button>
      </div>
    </div>
  );
};
