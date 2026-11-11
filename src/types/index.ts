export type ToolMode = 'compress' | 'mp3' | 'trim' | 'convert';

export type Language = 'ar' | 'fr' | 'en';

export interface VideoMetadata {
  file: File;
  name: string;
  size: number; // in bytes
  duration: number; // in seconds
  width: number;
  height: number;
  format: string;
  url: string;
}

export type CompressionPreset = 'whatsapp' | 'email' | 'discord' | 'compact' | 'custom';

export interface CompressionSettings {
  preset: CompressionPreset;
  targetSizeMB: number;
  resolution: 'original' | '1080p' | '720p' | '480p' | '360p';
  fps: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  muteAudio: boolean;
}

export interface MP3Settings {
  bitrate: 128 | 192 | 256 | 320;
  sampleRate: 44100 | 48000;
  channels: 1 | 2; // Mono or Stereo
  format: 'mp3' | 'wav';
}

export interface TrimSettings {
  startTime: number;
  endTime: number;
  mode: 'keep' | 'remove'; // keep inside range, or cut it out
  exportAudioOnly: boolean;
  exportFormat: 'mp4' | 'webm' | 'mp3';
}

export interface ConvertSettings {
  format: 'mp4' | 'webm' | 'gif' | 'mp3' | 'wav';
  aspectRatio: 'original' | '16:9' | '9:16' | '1:1';
  quality: 'high' | 'medium' | 'low';
  gifFps: number;
}

export interface ProcessingProgress {
  isProcessing: boolean;
  stage: string;
  percent: number; // 0 to 100
  detail?: string;
  canCancel?: boolean;
}

export interface ProcessingResult {
  blob: Blob;
  url: string;
  filename: string;
  originalSize: number;
  newSize: number;
  duration: number;
  mimeType: string;
  type: 'video' | 'audio' | 'gif';
}
