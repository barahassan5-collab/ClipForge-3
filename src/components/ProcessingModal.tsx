import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { Language, ProcessingProgress } from '../types';
import { translations } from '../utils/translations';

interface ProcessingModalProps {
  progress: ProcessingProgress;
  language: Language;
  onCancel: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  progress,
  language,
  onCancel,
}) => {
  const t = translations[language];

  if (!progress.isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
        {/* Animated spinner */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-100">
            {t.processing.inProgress}
          </h3>
          <p className="text-xs text-slate-400">
            {t.processing.pleaseWait}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 truncate max-w-[240px] text-left">
              {progress.stage}
            </span>
            <span className="text-indigo-400 font-bold ml-2">
              {progress.percent}%
            </span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-200 ease-out rounded-full"
              style={{ width: `${Math.max(4, Math.min(100, progress.percent))}%` }}
            />
          </div>

          {progress.detail && (
            <p className="text-[11px] text-slate-500 font-mono text-left">
              {progress.detail}
            </p>
          )}
        </div>

        {/* Cancel button */}
        {progress.canCancel && (
          <div className="pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t.processing.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
