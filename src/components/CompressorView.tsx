import React, { useState } from 'react';
import { Smartphone, Mail, Sliders, VolumeX, Sparkles, ArrowRight, Check } from 'lucide-react';
import { CompressionPreset, CompressionSettings, Language, VideoMetadata } from '../types';
import { translations } from '../utils/translations';
import { formatBytes, calculateOptimalBitrate } from '../utils/videoProcessor';

interface CompressorViewProps {
  metadata: VideoMetadata;
  language: Language;
  onStartCompress: (settings: CompressionSettings) => void;
}

export const CompressorView: React.FC<CompressorViewProps> = ({
  metadata,
  language,
  onStartCompress,
}) => {
  const t = translations[language];

  const originalSizeMB = metadata.size / (1024 * 1024);

  // Default target based on original size
  const [preset, setPreset] = useState<CompressionPreset>('whatsapp');
  const [customSizeMB, setCustomSizeMB] = useState<number>(
    Math.min(15.5, Math.max(2, Math.round(originalSizeMB * 0.4 * 10) / 10))
  );
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p' | '480p' | '360p'>('720p');
  const [muteAudio, setMuteAudio] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(30);

  // Determine current active target size
  let activeTargetMB = customSizeMB;
  if (preset === 'whatsapp') {
    activeTargetMB = Math.min(15.5, Math.round(originalSizeMB * 0.7 * 10) / 10);
  } else if (preset === 'email') {
    activeTargetMB = Math.min(24.0, Math.round(originalSizeMB * 0.8 * 10) / 10);
  } else if (preset === 'discord') {
    activeTargetMB = Math.min(9.5, Math.round(originalSizeMB * 0.5 * 10) / 10);
  } else if (preset === 'compact') {
    activeTargetMB = Math.min(5.0, Math.round(originalSizeMB * 0.3 * 10) / 10);
  }

  // Ensure target doesn't exceed original
  activeTargetMB = Math.min(activeTargetMB, originalSizeMB > 1 ? originalSizeMB - 0.2 : originalSizeMB * 0.8);
  activeTargetMB = Math.max(1, Math.round(activeTargetMB * 10) / 10);

  const { videoBitrateBps, audioBitrateBps } = calculateOptimalBitrate(
    activeTargetMB,
    metadata.duration,
    muteAudio
  );

  const savingsPercent = Math.max(0, Math.round(((originalSizeMB - activeTargetMB) / originalSizeMB) * 100));

  const handleStart = () => {
    onStartCompress({
      preset,
      targetSizeMB: activeTargetMB,
      resolution,
      fps,
      videoBitrateKbps: Math.round(videoBitrateBps / 1000),
      audioBitrateKbps: muteAudio ? 0 : Math.round(audioBitrateBps / 1000),
      muteAudio,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {t.compress.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {t.compress.description}
        </p>
      </div>

      {/* Target Presets Grid */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t.compress.presetsTitle}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* WhatsApp preset */}
          <button
            type="button"
            onClick={() => setPreset('whatsapp')}
            className={`p-4 rounded-xl border text-left transition-all ${
              preset === 'whatsapp'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              {preset === 'whatsapp' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">{t.compress.whatsapp}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.compress.whatsappDesc}</p>
            </div>
          </button>

          {/* Email preset */}
          <button
            type="button"
            onClick={() => setPreset('email')}
            className={`p-4 rounded-xl border text-left transition-all ${
              preset === 'email'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              {preset === 'email' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">{t.compress.email}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.compress.emailDesc}</p>
            </div>
          </button>

          {/* Discord/Mobile preset */}
          <button
            type="button"
            onClick={() => setPreset('discord')}
            className={`p-4 rounded-xl border text-left transition-all ${
              preset === 'discord'
                ? 'border-sky-500 bg-sky-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              {preset === 'discord' && <Check className="w-4 h-4 text-sky-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">{t.compress.discord}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.compress.discordDesc}</p>
            </div>
          </button>

          {/* Custom preset */}
          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`p-4 rounded-xl border text-left transition-all ${
              preset === 'custom'
                ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              {preset === 'custom' && <Check className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">{t.compress.custom}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.compress.customDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Custom target slider if selected */}
      {preset === 'custom' && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">{t.compress.targetSize}</span>
            <span className="font-mono text-indigo-400 font-semibold">{customSizeMB} MB</span>
          </div>
          <input
            type="range"
            min="2"
            max={Math.max(25, Math.ceil(originalSizeMB))}
            step="0.5"
            value={customSizeMB}
            onChange={(e) => setCustomSizeMB(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>2 MB</span>
            <span>{Math.max(25, Math.ceil(originalSizeMB))} MB</span>
          </div>
        </div>
      )}

      {/* Settings Row: Resolution & Mute & FPS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Resolution selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">
            {t.compress.resolution}
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="original">{t.compress.originalRes} ({metadata.width}×{metadata.height})</option>
            <option value="1080p">1080p (Full HD)</option>
            <option value="720p">720p (HD Recommended)</option>
            <option value="480p">480p (Standard Web)</option>
            <option value="360p">360p (Lightweight)</option>
          </select>
        </div>

        {/* Framerate selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">
            Framerate (FPS):
          </label>
          <select
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value={30}>30 FPS (Smooth)</option>
            <option value={24}>24 FPS (Cinematic / Smaller)</option>
            <option value={15}>15 FPS (Ultra Compact)</option>
          </select>
        </div>

        {/* Mute audio toggle */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <button
            type="button"
            onClick={() => setMuteAudio(!muteAudio)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors h-[38px] ${
              muteAudio
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <VolumeX className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.compress.muteAudio}</span>
          </button>
        </div>
      </div>

      {/* Savings & Bitrate Calculation Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-950 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{t.processing.originalSize} <strong className="font-mono text-slate-200">{formatBytes(metadata.size)}</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Target: <strong className="font-mono text-indigo-400">{activeTargetMB.toFixed(1)} MB</strong></span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
            <span>{t.compress.bitrateHint} {Math.round(videoBitrateBps / 1000)} kbps video</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{muteAudio ? 'Muted' : `${Math.round(audioBitrateBps / 1000)} kbps audio`}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">{t.compress.expectedSavings}</span>
            <span className="font-mono font-bold text-lg text-emerald-400">
              -{savingsPercent}%
            </span>
          </div>

          <button
            onClick={handleStart}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap"
          >
            {t.compress.compressBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
