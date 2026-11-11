import {
  CompressionSettings,
  ConvertSettings,
  ProcessingProgress,
  ProcessingResult,
  TrimSettings,
  VideoMetadata,
} from '../types';
import { createGifFromCanvasFrames } from './gifEncoder';

// Extract metadata from a video file
export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.src = url;

  return new Promise<VideoMetadata>((resolve, reject) => {
    video.onloadedmetadata = () => {
      resolve({
        file,
        name: file.name,
        size: file.size,
        duration: video.duration || 0,
        width: video.videoWidth || 640,
        height: video.videoHeight || 360,
        format: file.name.split('.').pop()?.toUpperCase() || 'VIDEO',
        url,
      });
    };
    video.onerror = () => {
      reject(new Error('Unable to read video metadata. Please ensure the file is a valid video.'));
    };
  });
}

// Format bytes into readable string
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format seconds into HH:MM:SS or MM:SS.ms
export function formatTimecode(seconds: number, includeMs = false): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);

  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  if (includeMs) {
    return `${paddedMins}:${paddedSecs}.${ms}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

// Calculate target dimensions based on resolution setting & aspect ratio
export function calculateDimensions(
  originalW: number,
  originalH: number,
  resolutionPreset: 'original' | '1080p' | '720p' | '480p' | '360p',
  aspectRatio: 'original' | '16:9' | '9:16' | '1:1' = 'original'
): { targetW: number; targetH: number; drawW: number; drawH: number; offsetX: number; offsetY: number } {
  let maxDim = 1920;
  if (resolutionPreset === '1080p') maxDim = 1080;
  else if (resolutionPreset === '720p') maxDim = 720;
  else if (resolutionPreset === '480p') maxDim = 480;
  else if (resolutionPreset === '360p') maxDim = 360;
  else maxDim = Math.max(originalW, originalH);

  let targetW = originalW;
  let targetH = originalH;

  // Scale down if exceeds max dimension
  const scale = Math.min(1, maxDim / Math.max(originalW, originalH));
  targetW = Math.round((originalW * scale) / 2) * 2; // ensure even dimensions
  targetH = Math.round((originalH * scale) / 2) * 2;

  // Handle aspect ratio conversions
  if (aspectRatio === '16:9') {
    const desiredRatio = 16 / 9;
    const canvasW = Math.round(Math.max(targetW, targetH * desiredRatio) / 2) * 2;
    const canvasH = Math.round((canvasW / desiredRatio) / 2) * 2;
    return {
      targetW: canvasW,
      targetH: canvasH,
      drawW: canvasW,
      drawH: canvasH,
      offsetX: 0,
      offsetY: 0,
    };
  } else if (aspectRatio === '9:16') {
    const desiredRatio = 9 / 16;
    const canvasH = Math.round(Math.max(targetH, targetW / desiredRatio) / 2) * 2;
    const canvasW = Math.round((canvasH * desiredRatio) / 2) * 2;
    return {
      targetW: canvasW,
      targetH: canvasH,
      drawW: canvasW,
      drawH: canvasH,
      offsetX: 0,
      offsetY: 0,
    };
  } else if (aspectRatio === '1:1') {
    const side = Math.round(Math.min(targetW, targetH) / 2) * 2;
    return {
      targetW: side,
      targetH: side,
      drawW: side,
      drawH: side,
      offsetX: 0,
      offsetY: 0,
    };
  }

  return {
    targetW,
    targetH,
    drawW: targetW,
    drawH: targetH,
    offsetX: 0,
    offsetY: 0,
  };
}

// Calculate optimal bitrate given a target file size in MB and duration in seconds
export function calculateOptimalBitrate(
  targetSizeMB: number,
  durationSec: number,
  muteAudio = false
): { videoBitrateBps: number; audioBitrateBps: number } {
  const safeDuration = Math.max(1, durationSec);
  // Reserve ~8% for container overhead (headers, index, timestamps)
  const totalTargetBytes = targetSizeMB * 1024 * 1024 * 0.92;
  const totalBits = totalTargetBytes * 8;
  const totalBitrateBps = Math.floor(totalBits / safeDuration);

  const audioBitrateBps = muteAudio ? 0 : Math.min(128000, Math.floor(totalBitrateBps * 0.15));
  const videoBitrateBps = Math.max(120000, totalBitrateBps - audioBitrateBps);

  return { videoBitrateBps, audioBitrateBps };
}

// Core processor for compression, format conversion, and trimming
export async function processVideo(
  videoFile: File,
  options: {
    compression?: CompressionSettings;
    trim?: TrimSettings;
    convert?: ConvertSettings;
    onProgress: (p: ProcessingProgress) => void;
    abortSignal?: AbortSignal;
  }
): Promise<ProcessingResult> {
  const { compression, trim, convert, onProgress, abortSignal } = options;

  onProgress({
    isProcessing: true,
    stage: 'Initializing video decoder...',
    percent: 5,
    canCancel: true,
  });

  const videoUrl = URL.createObjectURL(videoFile);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = false;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video element.'));
  });

  const totalDuration = video.duration || 10;
  const startTime = trim ? trim.startTime : 0;
  const endTime = trim ? Math.min(totalDuration, trim.endTime) : totalDuration;
  const processDuration = Math.max(0.5, endTime - startTime);

  // Resolution and Dimensions
  const resolutionPreset = compression ? compression.resolution : 'original';
  const aspectChoice = convert ? convert.aspectRatio : 'original';
  const dims = calculateDimensions(video.videoWidth, video.videoHeight, resolutionPreset, aspectChoice);

  // If user requested GIF export
  if (convert && convert.format === 'gif') {
    return await processVideoToGif(video, startTime, endTime, dims.targetW, dims.targetH, convert.gifFps || 15, onProgress, abortSignal);
  }

  // Setup Offscreen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = dims.targetW;
  canvas.height = dims.targetH;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  // Target Bitrate calculation
  let targetVideoBps = 1500000;
  let targetAudioBps = 128000;
  const mute = compression ? compression.muteAudio : false;

  if (compression) {
    const calculated = calculateOptimalBitrate(compression.targetSizeMB, processDuration, mute);
    targetVideoBps = calculated.videoBitrateBps;
    targetAudioBps = calculated.audioBitrateBps;
  }

  // Determine container mimeType
  const requestedFormat = (convert ? convert.format : trim ? trim.exportFormat : 'mp4');
  let chosenMime = 'video/webm;codecs=vp8,opus';
  let targetExt = 'webm';

  if (requestedFormat === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
    chosenMime = 'video/mp4;codecs=avc1,mp4a.40.2';
    targetExt = 'mp4';
  } else if (requestedFormat === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
    chosenMime = 'video/mp4';
    targetExt = 'mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    chosenMime = 'video/webm;codecs=vp9,opus';
    targetExt = 'webm';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    chosenMime = 'video/webm';
    targetExt = 'webm';
  }

  // Audio stream capture via Web Audio API
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const sourceNode = audioCtx.createMediaElementSource(video);
  const audioDest = audioCtx.createMediaStreamDestination();

  if (!mute) {
    sourceNode.connect(audioDest);
  }

  // Video track from Canvas
  const targetFps = compression ? compression.fps : 30;
  const canvasStream = canvas.captureStream(targetFps);

  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  if (!mute && audioDest.stream.getAudioTracks().length > 0) {
    tracks.push(...audioDest.stream.getAudioTracks());
  }

  const combinedStream = new MediaStream(tracks);

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: chosenMime,
    videoBitsPerSecond: targetVideoBps,
    audioBitsPerSecond: targetAudioBps,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Seek video to startTime
  onProgress({
    isProcessing: true,
    stage: 'Seeking to starting position...',
    percent: 10,
    canCancel: true,
  });

  await new Promise<void>((resolve) => {
    video.currentTime = startTime;
    video.onseeked = () => resolve();
  });

  // Start processing loop
  return new Promise<ProcessingResult>((resolve, reject) => {
    let animFrameId: number;

    const cleanup = () => {
      cancelAnimationFrame(animFrameId);
      video.pause();
      URL.revokeObjectURL(videoUrl);
      audioCtx.close().catch(() => {});
    };

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        cleanup();
        if (recorder.state !== 'inactive') recorder.stop();
        reject(new Error('Operation cancelled by user.'));
      });
    }

    recorder.onstop = () => {
      cleanup();
      const outputBlob = new Blob(chunks, { type: chosenMime });
      const outputUrl = URL.createObjectURL(outputBlob);

      const baseName = videoFile.name.replace(/\.[^/.]+$/, '');
      const actionSuffix = compression ? '_compressed' : trim ? '_trimmed' : '_converted';
      const filename = `${baseName}${actionSuffix}.${targetExt}`;

      resolve({
        blob: outputBlob,
        url: outputUrl,
        filename,
        originalSize: videoFile.size,
        newSize: outputBlob.size,
        duration: processDuration,
        mimeType: chosenMime,
        type: 'video',
      });
    };

    recorder.start(250); // emit chunks every 250ms
    video.play();

    const renderLoop = () => {
      if (abortSignal?.aborted) return;

      const current = video.currentTime;
      const progressRatio = Math.max(0, Math.min(1, (current - startTime) / processDuration));

      // Draw video frame to canvas with proper centering
      ctx.drawImage(video, 0, 0, dims.targetW, dims.targetH);

      onProgress({
        isProcessing: true,
        stage: compression
          ? `Compressing: ${formatTimecode(current)} / ${formatTimecode(endTime)}`
          : `Rendering frames: ${Math.round(progressRatio * 100)}%`,
        percent: Math.min(99, Math.round(10 + progressRatio * 88)),
        detail: `Resolution: ${dims.targetW}x${dims.targetH} • Bitrate: ${Math.round(targetVideoBps / 1000)}k`,
        canCancel: true,
      });

      if (current >= endTime || video.ended) {
        onProgress({
          isProcessing: true,
          stage: 'Finalizing compressed container...',
          percent: 99,
          canCancel: false,
        });
        recorder.stop();
        return;
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);
  });
}

// Convert video frames to Animated GIF
async function processVideoToGif(
  video: HTMLVideoElement,
  startTime: number,
  endTime: number,
  targetW: number,
  targetH: number,
  fps: number,
  onProgress: (p: ProcessingProgress) => void,
  abortSignal?: AbortSignal
): Promise<ProcessingResult> {
  // Cap GIF dimensions to keep memory and CPU fast
  const gifW = Math.min(480, targetW);
  const gifH = Math.round((gifW * (targetH / targetW)) / 2) * 2;

  const canvas = document.createElement('canvas');
  canvas.width = gifW;
  canvas.height = gifH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const duration = Math.min(15, endTime - startTime); // Cap GIF to 15s max
  const totalFrames = Math.floor(duration * fps);
  const frameIntervalSec = 1 / fps;
  const frames: ImageData[] = [];

  onProgress({
    isProcessing: true,
    stage: 'Sampling video frames for GIF...',
    percent: 10,
    canCancel: true,
  });

  for (let f = 0; f < totalFrames; f++) {
    if (abortSignal?.aborted) throw new Error('Operation cancelled.');

    const seekTime = startTime + f * frameIntervalSec;
    await new Promise<void>((res) => {
      video.currentTime = seekTime;
      video.onseeked = () => res();
    });

    ctx.drawImage(video, 0, 0, gifW, gifH);
    frames.push(ctx.getImageData(0, 0, gifW, gifH));

    const samplePercent = Math.round(10 + (f / totalFrames) * 40);
    onProgress({
      isProcessing: true,
      stage: `Captured frame ${f + 1} of ${totalFrames}`,
      percent: samplePercent,
      canCancel: true,
    });
  }

  onProgress({
    isProcessing: true,
    stage: 'Encoding GIF with LZW color palette...',
    percent: 55,
    canCancel: true,
  });

  const gifBlob = await createGifFromCanvasFrames(frames, Math.round(1000 / fps), (lzwPercent) => {
    onProgress({
      isProcessing: true,
      stage: 'Compressing GIF palette...',
      percent: Math.min(99, Math.round(55 + (lzwPercent / 100) * 44)),
      canCancel: true,
    });
  });

  const url = URL.createObjectURL(gifBlob);
  return {
    blob: gifBlob,
    url,
    filename: 'clip_animated.gif',
    originalSize: frames.length * gifW * gifH * 4,
    newSize: gifBlob.size,
    duration,
    mimeType: 'image/gif',
    type: 'gif',
  };
}
