// Lightweight client-side animated GIF encoder (pure TypeScript, zero external binary dependency)
// Implements standard GIF89a spec with palette quantization and LZW encoding.

export async function createGifFromCanvasFrames(
  frames: ImageData[],
  delayMs: number,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const width = frames[0].width;
  const height = frames[0].height;

  const parts: Uint8Array[] = [];

  // Write GIF header: "GIF89a"
  parts.push(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]));

  // Logical Screen Descriptor (width, height, GCT flag, resolution, sorted, size)
  const lsd = new Uint8Array(7);
  lsd[0] = width & 0xff;
  lsd[1] = (width >> 8) & 0xff;
  lsd[2] = height & 0xff;
  lsd[3] = (height >> 8) & 0xff;
  lsd[4] = 0x00; // No Global Color Table (we use local color tables per frame for better quality)
  lsd[5] = 0; // Background color index
  lsd[6] = 0; // Pixel aspect ratio
  parts.push(lsd);

  // Netscape 2.0 loop extension (infinite loop)
  parts.push(new Uint8Array([
    0x21, 0xff, 0x0b,
    0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, // NETSCAPE2.0
    0x03, 0x01, 0x00, 0x00, 0x00 // loop infinitely
  ]));

  const delayHundreths = Math.max(2, Math.round(delayMs / 10));

  for (let f = 0; f < frames.length; f++) {
    const frame = frames[f];
    const { palette, indexedPixels } = quantizeFrameTo256Colors(frame);

    // Graphic Control Extension (delay, disposal)
    parts.push(new Uint8Array([
      0x21, 0xf9, 0x04,
      0x04, // disposal method: retain
      delayHundreths & 0xff,
      (delayHundreths >> 8) & 0xff,
      0x00, // transparent color index
      0x00  // block terminator
    ]));

    // Image Descriptor
    const id = new Uint8Array(10);
    id[0] = 0x2c; // Image separator
    id[1] = 0; id[2] = 0; // Left position
    id[3] = 0; id[4] = 0; // Top position
    id[5] = width & 0xff;
    id[6] = (width >> 8) & 0xff;
    id[7] = height & 0xff;
    id[8] = (height >> 8) & 0xff;
    id[9] = 0x87; // Local color table flag, 8 bits/pixel (256 colors)
    parts.push(id);

    // Write Local Color Table (256 colors * 3 RGB = 768 bytes)
    parts.push(palette);

    // LZW encode pixels
    const lzwData = lzwEncode(indexedPixels, 8);
    parts.push(lzwData);

    if (onProgress) {
      onProgress(Math.round(((f + 1) / frames.length) * 100));
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // GIF Trailer
  parts.push(new Uint8Array([0x3b]));

  return new Blob(parts as BlobPart[], { type: 'image/gif' });
}

// Simple fast color quantization using 256-color median / uniform cube partitioning
function quantizeFrameTo256Colors(frame: ImageData): { palette: Uint8Array; indexedPixels: Uint8Array } {
  const data = frame.data;
  const numPixels = frame.width * frame.height;
  const indexedPixels = new Uint8Array(numPixels);
  const palette = new Uint8Array(768); // 256 * 3

  // Fixed 6x7x6 color palette or adaptive mapping
  // A clean 6x7x6 web-safe distribution (252 colors + 4 grays)
  let pIdx = 0;
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 7; g++) {
      for (let b = 0; b < 6; b++) {
        if (pIdx < 252 * 3) {
          palette[pIdx++] = Math.round((r / 5) * 255);
          palette[pIdx++] = Math.round((g / 6) * 255);
          palette[pIdx++] = Math.round((b / 5) * 255);
        }
      }
    }
  }
  // Extra neutral points
  const extras = [0, 85, 170, 255];
  for (let i = 0; i < 4; i++) {
    palette[pIdx++] = extras[i];
    palette[pIdx++] = extras[i];
    palette[pIdx++] = extras[i];
  }

  // Map each pixel to closest color in palette using Euclidean distance
  // Optimization: use 4-bit reduced lookup cache
  const cache = new Map<number, number>();

  for (let i = 0; i < numPixels; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    // Downsample color key to reduce cache lookups
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const cached = cache.get(key);
    if (cached !== undefined) {
      indexedPixels[i] = cached;
      continue;
    }

    let bestDist = Infinity;
    let bestIdx = 0;

    for (let c = 0; c < 256; c++) {
      const pr = palette[c * 3];
      const pg = palette[c * 3 + 1];
      const pb = palette[c * 3 + 2];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr * 2 + dg * dg * 4 + db * db * 1; // perceptual weighting
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = c;
        if (dist === 0) break;
      }
    }

    cache.set(key, bestIdx);
    indexedPixels[i] = bestIdx;
  }

  return { palette, indexedPixels };
}

// Simple LZW encoder for GIF stream
function lzwEncode(pixels: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxTableSize = 4096;

  // LZW hash table
  const table = new Map<string, number>();
  for (let i = 0; i < clearCode; i++) {
    table.set(String(i), i);
  }

  const output: number[] = [];
  let curBit = 0;
  let curByte = 0;

  function writeBits(code: number, numBits: number) {
    for (let i = 0; i < numBits; i++) {
      if ((code & (1 << i)) !== 0) {
        curByte |= 1 << curBit;
      }
      curBit++;
      if (curBit === 8) {
        output.push(curByte);
        curByte = 0;
        curBit = 0;
      }
    }
  }

  writeBits(clearCode, codeSize);

  let prefix = '';
  for (let i = 0; i < pixels.length; i++) {
    const k = pixels[i];
    const phrase = prefix === '' ? String(k) : `${prefix},${k}`;

    if (table.has(phrase)) {
      prefix = phrase;
    } else {
      writeBits(table.get(prefix)!, codeSize);

      if (nextCode < maxTableSize) {
        table.set(phrase, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        table.clear();
        for (let j = 0; j < clearCode; j++) {
          table.set(String(j), j);
        }
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }

      prefix = String(k);
    }
  }

  if (prefix !== '') {
    writeBits(table.get(prefix)!, codeSize);
  }
  writeBits(eoiCode, codeSize);

  if (curBit > 0) {
    output.push(curByte);
  }

  // Package into GIF sub-blocks (max 255 bytes each)
  const result: number[] = [minCodeSize];
  let ptr = 0;
  while (ptr < output.length) {
    const chunkSize = Math.min(255, output.length - ptr);
    result.push(chunkSize);
    for (let j = 0; j < chunkSize; j++) {
      result.push(output[ptr + j]);
    }
    ptr += chunkSize;
  }
  result.push(0); // block terminator

  return new Uint8Array(result);
}
