// Procedural test video generators using Canvas + Web Audio + MediaRecorder.
// Generates real, valid video files in < 1 second for instant testing of all features.

export async function generateCountdownSampleVideo(): Promise<File> {
  const width = 640;
  const height = 360;
  const fps = 30;
  const durationSec = 6;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Create Web Audio tone synthesizer
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const dest = audioCtx.createMediaStreamDestination();

  // Create stream
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  let mimeType = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 1200000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<File>((resolve, reject) => {
    recorder.onstop = () => {
      audioCtx.close().catch(() => {});
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'sample_countdown_test.webm', { type: 'video/webm' });
      resolve(file);
    };

    recorder.start();

    let frame = 0;
    const totalFrames = durationSec * fps;

    // Trigger audio beeps every second
    const triggerBeep = (freq = 440) => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    };

    const interval = setInterval(() => {
      const timeSec = frame / fps;
      const remainingSec = Math.max(0, Math.ceil(durationSec - timeSec));

      if (frame % fps === 0) {
        triggerBeep(remainingSec === 1 ? 880 : 520);
      }

      // Draw background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Rotating glow ring
      const cx = width / 2;
      const cy = height / 2 - 20;
      const radius = 70;
      const angle = (timeSec * Math.PI) / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.stroke();

      // Progress arc
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (timeSec / durationSec) * Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#6366f1';
      ctx.stroke();

      // Pulsing dot
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Countdown number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(remainingSec), cx, cy);

      // Subtitle
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`ClipForge Sample • ${timeSec.toFixed(1)}s / ${durationSec}.0s`, cx, cy + 95);

      // Audio waveform bar indicator
      ctx.fillStyle = '#4ade80';
      const barCount = 18;
      for (let b = 0; b < barCount; b++) {
        const h = 8 + Math.sin(frame * 0.2 + b) * 14;
        ctx.fillRect(cx - 90 + b * 10, cy + 125 - h / 2, 6, h);
      }

      frame++;
      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / fps);
  });
}

export async function generateMotionSampleVideo(): Promise<File> {
  const width = 640;
  const height = 360;
  const fps = 30;
  const durationSec = 8;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const dest = audioCtx.createMediaStreamDestination();

  // Play pleasant ambient chords
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.08;

  osc1.type = 'triangle';
  osc1.frequency.value = 220; // A3
  osc2.type = 'sine';
  osc2.frequency.value = 329.63; // E4

  osc1.connect(masterGain);
  osc2.connect(masterGain);
  masterGain.connect(dest);

  osc1.start();
  osc2.start();

  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  let mimeType = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 1500000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<File>((resolve) => {
    recorder.onstop = () => {
      osc1.stop();
      osc2.stop();
      audioCtx.close().catch(() => {});
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'sample_ambient_motion.webm', { type: 'video/webm' });
      resolve(file);
    };

    recorder.start();

    let frame = 0;
    const totalFrames = durationSec * fps;

    const interval = setInterval(() => {
      const t = frame / fps;

      // Dark violet background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Ambient geometric shapes
      for (let i = 0; i < 4; i++) {
        const x = width * 0.25 * i + 80 + Math.sin(t + i) * 30;
        const y = height * 0.5 + Math.cos(t * 1.5 + i) * 45;
        const r = 40 + Math.sin(t * 2 + i) * 15;

        const radial = ctx.createRadialGradient(x, y, 5, x, y, r);
        radial.addColorStop(0, i % 2 === 0 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(168, 85, 247, 0.8)');
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Title & Telemetry text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ClipForge • Motion Test Clip', width / 2, height / 2 - 15);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText(`Time: ${t.toFixed(2)}s / ${durationSec.toFixed(2)}s • 640x360 30fps`, width / 2, height / 2 + 18);

      frame++;
      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / fps);
  });
}
