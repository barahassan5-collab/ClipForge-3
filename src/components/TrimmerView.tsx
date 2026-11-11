import React, { useRef, useState, useEffect } from 'react';
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Download,
  Music,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Language, TrimSettings, VideoMetadata } from '../types';
import { translations } from '../utils/translations';
import { formatTimecode } from '../utils/videoProcessor';

interface TrimmerViewProps {
  metadata: VideoMetadata;
  language: Language;
  onStartTrim: (settings: TrimSettings) => void;
  onExtractAudioSegment: (startTime: number, endTime: number) => void;
}

export const TrimmerView: React.FC<TrimmerViewProps> = ({
  metadata,
  language,
  onStartTrim,
  onExtractAudioSegment,
}) => {
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const duration = metadata.duration || 10;
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Trim range handles
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(duration);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');

  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const trimmedDuration = Math.max(0.1, endTime - startTime);

  // Sync video time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Loop or stop if passed endTime when playing segment
      if (cur >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime < startTime || currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const playSegmentOnly = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const seekTo = (time: number) => {
    const clamped = Math.max(0, Math.min(duration, time));
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
  };

  const stepTime = (delta: number) => {
    seekTo(currentTime + delta);
  };

  const setStartAtCurrent = () => {
    const newStart = Math.min(currentTime, endTime - 0.2);
    setStartTime(Math.max(0, newStart));
  };

  const setEndAtCurrent = () => {
    const newEnd = Math.max(currentTime, startTime + 0.2);
    setEndTime(Math.min(duration, newEnd));
  };

  // Timeline drag interactions
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = clickRatio * duration;
    seekTo(targetTime);
  };

  // Keyboard shortcuts (space to play/pause, left/right arrows to step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focused in input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepTime(e.shiftKey ? -1 : -0.1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepTime(e.shiftKey ? 1 : 0.1);
      } else if (e.key === '[') {
        e.preventDefault();
        setStartAtCurrent();
      } else if (e.key === ']') {
        e.preventDefault();
        setEndAtCurrent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, startTime, endTime, isPlaying]);

  const handleStartTrim = () => {
    onStartTrim({
      startTime,
      endTime,
      mode: 'keep',
      exportAudioOnly: false,
      exportFormat,
    });
  };

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const currentPercent = (currentTime / duration) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Scissors className="w-6 h-6 text-indigo-400" />
          {t.trim.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {t.trim.description}
        </p>
      </div>

      {/* Video Viewport & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Main Video Frame */}
        <div className="relative aspect-video max-h-[460px] bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={metadata.url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Large Center Play Overlay if paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              aria-label="Play video"
            >
              <Play className="w-7 h-7 ml-1" />
            </button>
          )}

          {/* Range badge overlay */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono text-slate-200">
            <span>Range: {formatTimecode(startTime, true)} → {formatTimecode(endTime, true)}</span>
          </div>

          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono text-indigo-400 font-semibold">
            <span>Duration: {formatTimecode(trimmedDuration, true)}</span>
          </div>
        </div>

        {/* Playback Transport Strip */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={playSegmentOnly}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors whitespace-nowrap"
            >
              {t.trim.playSegment}
            </button>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={() => stepTime(-0.1)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                title="Step backward 0.1s"
              >
                {t.trim.stepBack}
              </button>
              <button
                onClick={() => stepTime(0.1)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                title="Step forward 0.1s"
              >
                {t.trim.stepForward}
              </button>
            </div>
          </div>

          {/* Timecode Readout */}
          <div className="font-mono text-xs text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white font-semibold">{formatTimecode(currentTime, true)}</span>
            <span className="text-slate-600">/</span>
            <span>{formatTimecode(duration, true)}</span>
          </div>

          {/* Quick Mark In / Mark Out buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={setStartAtCurrent}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors whitespace-nowrap"
              title="Set Start position here (Shortcut: [ )"
            >
              {t.trim.setStart}
            </button>
            <button
              onClick={setEndAtCurrent}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors whitespace-nowrap"
              title="Set End position here (Shortcut: ] )"
            >
              {t.trim.setEnd}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Visual Timeline Bar & Handles */}
        <div className="px-5 py-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>00:00.0</span>
            <span className="text-indigo-400 font-medium">Drag handles or scrub timeline</span>
            <span>{formatTimecode(duration, true)}</span>
          </div>

          {/* Interactive track */}
          <div
            ref={timelineRef}
            onClick={handleTimelineMouseDown}
            className="relative h-14 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer overflow-hidden select-none"
          >
            {/* Filmstrip faux pattern */}
            <div className="absolute inset-0 opacity-15 flex">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-slate-500 h-full flex flex-col justify-between py-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-sm mx-auto" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-sm mx-auto" />
                </div>
              ))}
            </div>

            {/* Inactive left region (dimmed) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none"
              style={{ width: `${startPercent}%` }}
            />

            {/* Active Highlight Selection Zone */}
            <div
              className="absolute top-0 bottom-0 bg-indigo-500/25 border-y-2 border-indigo-400 pointer-events-none"
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
              }}
            />

            {/* Inactive right region (dimmed) */}
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none"
              style={{ width: `${100 - endPercent}%` }}
            />

            {/* Current Playhead indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{ left: `${currentPercent}%` }}
            >
              <div className="w-3 h-3 bg-rose-500 rotate-45 -translate-x-[5px] -translate-y-1 shadow" />
            </div>

            {/* Start Handle [ */}
            <div
              className="absolute top-0 bottom-0 w-4 bg-indigo-600 rounded-l-md cursor-ew-resize z-10 flex items-center justify-center hover:bg-indigo-500 shadow-md -translate-x-full"
              style={{ left: `${startPercent}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingStart(true);
              }}
            >
              <div className="w-0.5 h-4 bg-white/70 rounded-full" />
            </div>

            {/* End Handle ] */}
            <div
              className="absolute top-0 bottom-0 w-4 bg-indigo-600 rounded-r-md cursor-ew-resize z-10 flex items-center justify-center hover:bg-indigo-500 shadow-md"
              style={{ left: `${endPercent}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingEnd(true);
              }}
            >
              <div className="w-0.5 h-4 bg-white/70 rounded-full" />
            </div>
          </div>

          {/* Mouse drag listeners for start and end handles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.trim.startPoint}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={endTime - 0.2}
                  value={Number(startTime.toFixed(2))}
                  onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono text-white font-semibold"
                />
                <span className="text-slate-500 font-mono">sec</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.trim.endPoint}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min={startTime + 0.2}
                  max={duration}
                  value={Number(endTime.toFixed(2))}
                  onChange={(e) => setEndTime(Math.min(duration, parseFloat(e.target.value) || duration))}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono text-white font-semibold"
                />
                <span className="text-slate-500 font-mono">sec</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-950 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{t.trim.duration}: <strong className="font-mono text-indigo-400 text-sm">{formatTimecode(trimmedDuration, true)}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Will save <strong className="font-mono text-emerald-400">~{Math.round(((duration - trimmedDuration) / duration) * 100)}%</strong> space</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-slate-400">{t.trim.exportAs}</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setExportFormat('mp4')}
                className={`px-2.5 py-1 rounded text-xs font-medium font-mono ${
                  exportFormat === 'mp4' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                MP4
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('webm')}
                className={`px-2.5 py-1 rounded text-xs font-medium font-mono ${
                  exportFormat === 'webm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                WebM
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onExtractAudioSegment(startTime, endTime)}
            className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            title="Extract only the audio of this trimmed range as MP3"
          >
            <Music className="w-3.5 h-3.5" />
            {t.trim.extractAudioFromTrim}
          </button>

          <button
            onClick={handleStartTrim}
            className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {t.trim.trimBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
