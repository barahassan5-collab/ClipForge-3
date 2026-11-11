import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle, RefreshCw, ArrowRight, Play, Film, Music } from 'lucide-react';
import { Language, ProcessingResult } from '../types';
import { translations } from '../utils/translations';
import { formatBytes, formatTimecode } from '../utils/videoProcessor';

interface ResultModalProps {
  result: ProcessingResult | null;
  language: Language;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  language,
  onClose,
}) => {
  const t = translations[language];

  useEffect(() => {
    if (result) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#6366f1', '#38bdf8', '#34d399', '#f43f5e'],
        });
      } catch {
        // Safe fallback if confetti canvas fails
      }
    }
  }, [result]);

  if (!result) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isSmaller = result.newSize < result.originalSize;
  const savingsPercent = isSmaller
    ? Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {t.processing.doneTitle}
          </h3>
          <p className="text-xs text-slate-400 font-mono truncate max-w-sm mx-auto">
            {result.filename}
          </p>
        </div>

        {/* Media Preview Box */}
        <div className="rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center max-h-[280px]">
          {result.type === 'video' && (
            <video
              src={result.url}
              controls
              playsInline
              className="w-full h-full max-h-[260px] object-contain"
            />
          )}

          {result.type === 'audio' && (
            <div className="p-6 w-full text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <audio src={result.url} controls className="w-full" />
            </div>
          )}

          {result.type === 'gif' && (
            <img
              src={result.url}
              alt="Generated GIF"
              className="w-full h-full max-h-[260px] object-contain"
            />
          )}
        </div>

        {/* File Metrics Comparison */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-center">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              {t.processing.originalSize}
            </span>
            <span className="font-mono text-sm text-slate-400 line-through">
              {formatBytes(result.originalSize)}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              {t.processing.newSize}
            </span>
            <span className="font-mono text-base font-bold text-emerald-400">
              {formatBytes(result.newSize)}
            </span>
          </div>

          {isSmaller && (
            <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
              <span>{t.processing.saved}</span>
              <strong className="text-sm font-bold">-{savingsPercent}%</strong>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t.processing.download}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t.processing.anotherOperation}
          </button>
        </div>
      </div>
    </div>
  );
};
