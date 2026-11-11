import React, { useState } from 'react';
import { Music, Radio, Disc, Download, Play, Pause, Volume2, Sparkles, Check } from 'lucide-react';
import { Language, MP3Settings, VideoMetadata } from '../types';
import { translations } from '../utils/translations';
import { formatBytes, formatTimecode } from '../utils/videoProcessor';

interface AudioExtractorViewProps {
  metadata: VideoMetadata;
  language: Language;
  onStartExtract: (settings: MP3Settings) => void;
}

export const AudioExtractorView: React.FC<AudioExtractorViewProps> = ({
  metadata,
  language,
  onStartExtract,
}) => {
  const t = translations[language];

  const [bitrate, setBitrate] = useState<128 | 192 | 256 | 320>(192);
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');
  const [channels, setChannels] = useState<1 | 2>(2);
  const [sampleRate, setSampleRate] = useState<44100 | 48000>(44100);

  // Approximate expected audio size
  const expectedAudioSizeMB = format === 'wav'
    ? (metadata.duration * 44100 * 2 * 2) / (1024 * 1024)
    : (metadata.duration * (bitrate * 1000 / 8)) / (1024 * 1024);

  const handleStart = () => {
    onStartExtract({
      bitrate,
      format,
      channels,
      sampleRate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Music className="w-6 h-6 text-indigo-400" />
          {t.mp3.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {t.mp3.description}
        </p>
      </div>

      {/* Bitrate Selector Cards */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t.mp3.qualityTitle}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 320 kbps */}
          <button
            type="button"
            onClick={() => { setFormat('mp3'); setBitrate(320); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              format === 'mp3' && bitrate === 320
                ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">320 kbps</span>
              {format === 'mp3' && bitrate === 320 && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">Studio Master</h4>
              <p className="text-xs text-slate-400 mt-1">{t.mp3.hq}</p>
            </div>
          </button>

          {/* 192 kbps */}
          <button
            type="button"
            onClick={() => { setFormat('mp3'); setBitrate(192); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              format === 'mp3' && bitrate === 192
                ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">192 kbps</span>
              {format === 'mp3' && bitrate === 192 && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">Standard HD</h4>
              <p className="text-xs text-slate-400 mt-1">{t.mp3.standard}</p>
            </div>
          </button>

          {/* 128 kbps */}
          <button
            type="button"
            onClick={() => { setFormat('mp3'); setBitrate(128); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              format === 'mp3' && bitrate === 128
                ? 'border-sky-500 bg-sky-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">128 kbps</span>
              {format === 'mp3' && bitrate === 128 && <Check className="w-4 h-4 text-sky-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">Compact Mobile</h4>
              <p className="text-xs text-slate-400 mt-1">{t.mp3.normal}</p>
            </div>
          </button>

          {/* Lossless WAV */}
          <button
            type="button"
            onClick={() => setFormat('wav')}
            className={`p-4 rounded-xl border text-left transition-all ${
              format === 'wav'
                ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">WAV PCM</span>
              {format === 'wav' && <Check className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-100">Uncompressed</h4>
              <p className="text-xs text-slate-400 mt-1">{t.mp3.losslessWav}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Audio Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Audio Channels:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChannels(2)}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                channels === 2
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              Stereo (2 Channels)
            </button>
            <button
              type="button"
              onClick={() => setChannels(1)}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                channels === 1
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              Mono (1 Channel)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Sample Rate:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSampleRate(44100)}
              className={`flex-1 py-1.5 px-3 text-xs font-mono font-medium rounded-lg border transition-colors ${
                sampleRate === 44100
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              44.1 kHz (CD Audio)
            </button>
            <button
              type="button"
              onClick={() => setSampleRate(48000)}
              className={`flex-1 py-1.5 px-3 text-xs font-mono font-medium rounded-lg border transition-colors ${
                sampleRate === 48000
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              48.0 kHz (Cinema / TV)
            </button>
          </div>
        </div>
      </div>

      {/* Action Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-950 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Video Duration: <strong className="font-mono text-slate-200">{formatTimecode(metadata.duration)}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Est. Audio Size: <strong className="font-mono text-indigo-400">{expectedAudioSizeMB.toFixed(2)} MB</strong></span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pure client-side MP3 encoding via LAME WebAssembly. No server uploads.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          {t.mp3.extractBtn}
        </button>
      </div>
    </div>
  );
};
