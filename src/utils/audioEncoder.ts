import { Mp3Encoder } from '@breezystack/lamejs';

export interface AudioExtractOptions {
  bitrate: 128 | 192 | 256 | 320;
  sampleRate?: number;
  channels?: 1 | 2;
  startTime?: number;
  endTime?: number;
  format?: 'mp3' | 'wav';
  onProgress?: (percent: number, detail?: string) => void;
}

// Convert float32 PCM samples [-1.0, 1.0] to int16 PCM [-32768, 32767]
function floatToInt16(samples: Float32Array): Int16Array {
  const len = samples.length;
  const result = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return result;
}

// Encode PCM AudioBuffer to MP3 using lamejs
export async function encodeAudioBufferToMp3(
  audioBuffer: AudioBuffer,
  options: AudioExtractOptions
): Promise<Blob> {
  const {
    bitrate = 192,
    channels: forcedChannels,
    startTime = 0,
    endTime = audioBuffer.duration,
    onProgress,
  } = options;

  const actualSampleRate = audioBuffer.sampleRate;
  const numChannels = forcedChannels || Math.min(2, audioBuffer.numberOfChannels) as (1 | 2);

  // Compute start and end sample indexes
  const startSample = Math.max(0, Math.floor(startTime * actualSampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endTime * actualSampleRate));
  const totalSamples = endSample - startSample;

  if (totalSamples <= 0) {
    throw new Error('Trim range results in zero audio duration.');
  }

  // Extract raw channel data
  const rawLeft = audioBuffer.getChannelData(0).subarray(startSample, endSample);
  const leftInt16 = floatToInt16(rawLeft);

  let rightInt16: Int16Array | undefined;
  if (numChannels === 2 && audioBuffer.numberOfChannels > 1) {
    const rawRight = audioBuffer.getChannelData(1).subarray(startSample, endSample);
    rightInt16 = floatToInt16(rawRight);
  } else {
    // If mono, pass the same or handle 1-channel
    rightInt16 = undefined;
  }

  const mp3encoder = new Mp3Encoder(numChannels, actualSampleRate, bitrate);
  const mp3Data: Uint8Array[] = [];

  const sampleBlockSize = 1152; // LAME frame size
  let processed = 0;

  for (let i = 0; i < totalSamples; i += sampleBlockSize) {
    const chunkLeft = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf: Int8Array | Uint8Array;

    if (numChannels === 2 && rightInt16) {
      const chunkRight = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(chunkLeft, chunkRight);
    } else {
      mp3buf = mp3encoder.encodeBuffer(chunkLeft);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    processed = i + chunkLeft.length;
    if (onProgress && i % (sampleBlockSize * 10) === 0) {
      const percent = Math.min(98, Math.round((processed / totalSamples) * 100));
      onProgress(percent, `Encoding MP3 (${bitrate} kbps)...`);
      // yield thread so UI remains responsive
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const flushBuf = mp3encoder.flush();
  if (flushBuf.length > 0) {
    mp3Data.push(new Uint8Array(flushBuf));
  }

  if (onProgress) {
    onProgress(100, 'MP3 ready!');
  }

  return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
}

// Encode AudioBuffer to standard WAV file
export function encodeAudioBufferToWav(
  audioBuffer: AudioBuffer,
  startTime = 0,
  endTime = audioBuffer.duration
): Blob {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = Math.min(2, audioBuffer.numberOfChannels);

  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const totalSamples = endSample - startSample;

  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved 16-bit PCM samples
  const left = audioBuffer.getChannelData(0).subarray(startSample, endSample);
  const right = numChannels > 1 ? audioBuffer.getChannelData(1).subarray(startSample, endSample) : null;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    // Left channel
    let sample = Math.max(-1, Math.min(1, left[i]));
    let val = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;

    // Right channel if stereo
    if (right) {
      sample = Math.max(-1, Math.min(1, right[i]));
      val = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Extract audio from video file using Web Audio API AudioContext
export async function extractAudioFromVideoFile(
  file: File | Blob,
  options: AudioExtractOptions
): Promise<Blob> {
  const { onProgress } = options;

  if (onProgress) {
    onProgress(5, 'Reading video audio track...');
  }

  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) {
    onProgress(20, 'Decoding audio track with Web Audio API...');
  }

  // Create AudioContext
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    if (options.format === 'wav') {
      if (onProgress) onProgress(80, 'Formatting uncompressed WAV audio...');
      const wavBlob = encodeAudioBufferToWav(audioBuffer, options.startTime, options.endTime);
      if (onProgress) onProgress(100, 'WAV ready!');
      return wavBlob;
    }

    // Default to MP3
    return await encodeAudioBufferToMp3(audioBuffer, options);
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}
