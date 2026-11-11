import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Music,
  Scissors,
  RefreshCw,
  ShieldCheck,
  Zap,
  Smartphone,
  Mail,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  CompressionSettings,
  ConvertSettings,
  Language,
  MP3Settings,
  ProcessingProgress,
  ProcessingResult,
  ToolMode,
  TrimSettings,
  VideoMetadata,
} from './types';
import { translations } from './utils/translations';
import { Navbar } from './components/Navbar';
import { Dropzone } from './components/Dropzone';
import { CompressorView } from './components/CompressorView';
import { AudioExtractorView } from './components/AudioExtractorView';
import { TrimmerView } from './components/TrimmerView';
import { ConverterView } from './components/ConverterView';
import { ProcessingModal } from './components/ProcessingModal';
import { ResultModal } from './components/ResultModal';
import { extractAudioFromVideoFile } from './utils/audioEncoder';
import { processVideo } from './utils/videoProcessor';

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [currentMode, setCurrentMode] = useState<ToolMode>('compress');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Active loaded video
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Processing & result state
  const [progress, setProgress] = useState<ProcessingProgress>({
    isProcessing: false,
    stage: '',
    percent: 0,
  });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const t = translations[language];

  // Sync theme class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProgress({ isProcessing: false, stage: '', percent: 0 });
  };

  // 1. Video Compressor execution
  const handleStartCompress = async (settings: CompressionSettings) => {
    if (!metadata) return;

    abortControllerRef.current = new AbortController();
    try {
      const res = await processVideo(metadata.file, {
        compression: settings,
        onProgress: (p) => setProgress(p),
        abortSignal: abortControllerRef.current.signal,
      });
      setProgress({ isProcessing: false, stage: '', percent: 100 });
      setResult(res);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        alert('Compression error: ' + (err as Error).message);
      }
      setProgress({ isProcessing: false, stage: '', percent: 0 });
    }
  };

  // 2. Video to MP3 Extractor execution
  const handleStartExtractMp3 = async (
    settings: MP3Settings,
    customStart?: number,
    customEnd?: number
  ) => {
    if (!metadata) return;

    setProgress({
      isProcessing: true,
      stage: 'Extracting audio track...',
      percent: 10,
      canCancel: false,
    });

    try {
      const startTime = customStart ?? 0;
      const endTime = customEnd ?? metadata.duration;
      const blob = await extractAudioFromVideoFile(metadata.file, {
        bitrate: settings.bitrate,
        format: settings.format,
        channels: settings.channels,
        sampleRate: settings.sampleRate,
        startTime,
        endTime,
        onProgress: (percent, detail) => {
          setProgress({
            isProcessing: true,
            stage: detail || 'Encoding audio...',
            percent,
            detail: `${settings.format.toUpperCase()} ${settings.bitrate}kbps`,
            canCancel: false,
          });
        },
      });

      const url = URL.createObjectURL(blob);
      const baseName = metadata.name.replace(/\.[^/.]+$/, '');
      const filename = `${baseName}.${settings.format}`;

      setProgress({ isProcessing: false, stage: '', percent: 100 });
      setResult({
        blob,
        url,
        filename,
        originalSize: metadata.size,
        newSize: blob.size,
        duration: endTime - startTime,
        mimeType: settings.format === 'wav' ? 'audio/wav' : 'audio/mp3',
        type: 'audio',
      });
    } catch (err: unknown) {
      alert('Audio extraction error: ' + (err as Error).message);
      setProgress({ isProcessing: false, stage: '', percent: 0 });
    }
  };

  // 3. Trimmer & Cutter execution
  const handleStartTrim = async (settings: TrimSettings) => {
    if (!metadata) return;

    abortControllerRef.current = new AbortController();
    try {
      const res = await processVideo(metadata.file, {
        trim: settings,
        onProgress: (p) => setProgress(p),
        abortSignal: abortControllerRef.current.signal,
      });
      setProgress({ isProcessing: false, stage: '', percent: 100 });
      setResult(res);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        alert('Trimming error: ' + (err as Error).message);
      }
      setProgress({ isProcessing: false, stage: '', percent: 0 });
    }
  };

  // Quick extract audio from trimmer directly
  const handleExtractAudioFromTrim = (startTime: number, endTime: number) => {
    handleStartExtractMp3(
      {
        bitrate: 192,
        format: 'mp3',
        channels: 2,
        sampleRate: 44100,
      },
      startTime,
      endTime
    );
  };

  // 4. Format Converter execution
  const handleStartConvert = async (settings: ConvertSettings) => {
    if (!metadata) return;

    // If converting to audio only format (MP3 or WAV)
    if (settings.format === 'mp3' || settings.format === 'wav') {
      return handleStartExtractMp3({
        bitrate: 192,
        format: settings.format,
        channels: 2,
        sampleRate: 44100,
      });
    }

    abortControllerRef.current = new AbortController();
    try {
      const res = await processVideo(metadata.file, {
        convert: settings,
        onProgress: (p) => setProgress(p),
        abortSignal: abortControllerRef.current.signal,
      });
      setProgress({ isProcessing: false, stage: '', percent: 100 });
      setResult(res);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        alert('Conversion error: ' + (err as Error).message);
      }
      setProgress({ isProcessing: false, stage: '', percent: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30">
      {/* Top Bar Navigation */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(m) => setCurrentMode(m)}
        language={language}
        onSelectLanguage={(l) => setLanguage(l)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.badgePrivacy}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance">
            {language === 'ar' ? (
              <>
                ضغط، تحويل لـ MP3، و <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">قص مقاطع الفيديو</span>
              </>
            ) : language === 'fr' ? (
              <>
                Compressez, convertissez en MP3 et <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">découpez vos vidéos</span>
              </>
            ) : (
              <>
                Compress, Convert to MP3, & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Cut Video Clips</span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            {t.tagline}
          </p>
        </div>

        {/* File Dropzone & Video Inspector */}
        <section aria-label="Upload Video">
          <Dropzone
            metadata={metadata}
            onVideoSelected={(meta) => setMetadata(meta)}
            language={language}
          />
        </section>

        {/* Tool Modes Tabs & Workspace */}
        {metadata && (
          <section className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 sm:p-8 backdrop-blur-sm space-y-6">
            {/* Mode selection buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCurrentMode('compress')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  currentMode === 'compress'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{t.modes.compress}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode('mp3')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  currentMode === 'mp3'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>{t.modes.mp3}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode('trim')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  currentMode === 'trim'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>{t.modes.trim}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode('convert')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  currentMode === 'convert'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.modes.convert}</span>
              </button>
            </div>

            {/* Render active tool */}
            <div className="pt-2">
              {currentMode === 'compress' && (
                <CompressorView
                  metadata={metadata}
                  language={language}
                  onStartCompress={handleStartCompress}
                />
              )}

              {currentMode === 'mp3' && (
                <AudioExtractorView
                  metadata={metadata}
                  language={language}
                  onStartExtract={(settings) => handleStartExtractMp3(settings)}
                />
              )}

              {currentMode === 'trim' && (
                <TrimmerView
                  metadata={metadata}
                  language={language}
                  onStartTrim={handleStartTrim}
                  onExtractAudioSegment={handleExtractAudioFromTrim}
                />
              )}

              {currentMode === 'convert' && (
                <ConverterView
                  metadata={metadata}
                  language={language}
                  onStartConvert={handleStartConvert}
                />
              )}
            </div>
          </section>
        )}

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {language === 'ar' ? 'جاهز لـ WhatsApp والبريد' : language === 'fr' ? 'Prêt pour WhatsApp & Mail' : 'WhatsApp & Email Ready'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'ضغط ذكي لتقليص حجم الفيديو تحت 16MB لواتساب و 25MB لـ Gmail دون فقدان الجودة.'
                : 'Smart target bitrate calculation ensures your videos never bounce or get blocked by upload limits.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {language === 'ar' ? 'استخراج MP3 فائق السرعة' : language === 'fr' ? 'Extraction MP3 Rapide' : 'Pure Client-Side MP3'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'استخرج الصوت بصيغة MP3 حتى 320kbps أو WAV نقي مباشرة بدون خوادم خارجية.'
                : 'Extract pristine studio-grade MP3 audio up to 320 kbps using native Web Audio & LAME.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {language === 'ar' ? 'قص وتقطيع بدقة 0.1 ثانية' : language === 'fr' ? 'Découpage Précis' : 'Frame-Accurate Trimming'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'شريط زمني تفاعلي لتحديد البداية والنهاية بدقة وتصدير المقطع فوراً.'
                : 'Interactive timeline scrubber with 0.1s step controls and instant range extraction.'}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ClipForge Studio</span>
            <span aria-hidden="true">·</span>
            <span>Video Compressor, MP3 Converter & Precision Trimmer</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero server upload · 100% Client-Side Privacy</span>
          </div>
        </div>
      </footer>

      {/* Processing Modal Overlay */}
      <ProcessingModal
        progress={progress}
        language={language}
        onCancel={handleCancel}
      />

      {/* Result Modal Overlay */}
      <ResultModal
        result={result}
        language={language}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
