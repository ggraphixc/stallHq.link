/**
 * Pure JavaScript GIF89a Encoder
 * No external dependencies — uses LZW compression for GIF encoding.
 * Supports animated GIFs with per-frame delays.
 */

interface GifFrame {
  data: Uint8ClampedArray; // RGBA pixel data
  width: number;
  height: number;
  delay: number; // Centiseconds (1/100 of a second)
}

interface GifEncoderOptions {
  width: number;
  height: number;
  quality?: number; // Color quality: 1-30 (lower = better quality, slower). Default: 10
  workers?: number; // Not used but kept for API compat
}

export class GifEncoder {
  private width: number;
  private height: number;
  private quality: number;
  private frames: GifFrame[] = [];

  constructor(options: GifEncoderOptions) {
    this.width = options.width;
    this.height = options.height;
    this.quality = options.quality ?? 10;
  }

  /**
   * Add a frame from canvas pixel data.
   * @param imageData - CanvasRenderingContext2D.getImageData() result
   * @param delay - Frame delay in milliseconds
   */
  addFrame(imageData: ImageData, delay: number = 100): void {
    this.frames.push({
      data: new Uint8ClampedArray(imageData.data),
      width: imageData.width,
      height: imageData.height,
      delay: Math.round(delay / 10), // Convert ms to centiseconds
    });
  }

  /**
   * Encode all frames into a GIF89a binary blob.
   * @returns Blob with type "image/gif"
   */
  async encode(): Promise<Blob> {
    if (this.frames.length === 0) {
      throw new Error("No frames to encode");
    }

    // Build global color table from first frame
    const { palette, indexedFrames } = this.buildPalette();

    // Calculate buffer size
    const bufferSize = this.calculateBufferSize(palette, indexedFrames);
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Write header
    offset = this.writeHeader(view, offset);

    // Write logical screen descriptor
    offset = this.writeLogicalScreenDescriptor(view, offset, palette);

    // Write NETSCAPE extension for looping
    offset = this.writeNetscapeExtension(view, offset);

    // Write frames
    for (let i = 0; i < indexedFrames.length; i++) {
      offset = this.writeFrame(view, offset, indexedFrames[i], palette);
    }

    // Write trailer
    view.setUint8(offset++, 0x3b);

    return new Blob([buffer.slice(0, offset)], { type: "image/gif" });
  }

  /**
   * Build an optimized color palette using median cut quantization.
   */
  private buildPalette(): { palette: [number, number, number][]; indexedFrames: Uint8Array[] } {
    const colorMap = new Map<number, number>();
    const allPixels: number[] = [];

    // Collect all unique colors across all frames
    for (const frame of this.frames) {
      for (let i = 0; i < frame.data.length; i += 4) {
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        const a = frame.data[i + 3];
        if (a < 128) continue; // Skip transparent pixels
        const key = (r << 16) | (g << 8) | b;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
        allPixels.push(key);
      }
    }

    // If fewer than 256 unique colors, use them directly
    let palette: [number, number, number][];
    if (colorMap.size <= 256) {
      palette = Array.from(colorMap.keys()).map((k) => [(k >> 16) & 0xff, (k >> 8) & 0xff, k & 0xff]);
    } else {
      // Use median cut to reduce to 256 colors
      palette = this.medianCut(allPixels, 256);
    }

    // Pad palette to power of 2
    const paletteSize = Math.max(4, Math.pow(2, Math.ceil(Math.log2(Math.max(palette.length, 2)))));
    while (palette.length < paletteSize) {
      palette.push([0, 0, 0]);
    }

    // Build lookup map for fast indexing
    const lookup = new Map<number, number>();
    palette.forEach(([r, g, b], i) => {
      lookup.set((r << 16) | (g << 8) | b, i);
    });

    // Index each frame
    const indexedFrames = this.frames.map((frame) => {
      const indexed = new Uint8Array(frame.width * frame.height);
      for (let i = 0; i < frame.data.length; i += 4) {
        const px = i / 4;
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        const a = frame.data[i + 3];
        if (a < 128) {
          indexed[px] = 0; // Transparent index
        } else {
          const key = (r << 16) | (g << 8) | b;
          indexed[px] = lookup.get(key) ?? this.findClosest(palette, r, g, b);
        }
      }
      return indexed;
    });

    return { palette, indexedFrames };
  }

  /**
   * Median cut color quantization.
   */
  private medianCut(pixels: number[], maxColors: number): [number, number, number][] {
    if (pixels.length === 0) return [[0, 0, 0]];

    const buckets: number[][] = [pixels];

    while (buckets.length < maxColors) {
      // Find the bucket with the largest range
      let maxRange = -1;
      let maxIdx = 0;
      let maxChannel = 0;

      for (let i = 0; i < buckets.length; i++) {
        const bucket = buckets[i];
        if (bucket.length < 2) continue;

        for (let ch = 0; ch < 3; ch++) {
          const shift = (2 - ch) * 8;
          const vals = bucket.map((p) => (p >> shift) & 0xff);
          const range = Math.max(...vals) - Math.min(...vals);
          if (range > maxRange) {
            maxRange = range;
            maxIdx = i;
            maxChannel = ch;
          }
        }
      }

      if (maxRange <= 0) break;

      // Split the bucket at the median
      const bucket = buckets[maxIdx];
      const shift = (2 - maxChannel) * 8;
      bucket.sort((a, b) => ((a >> shift) & 0xff) - ((b >> shift) & 0xff));
      const mid = Math.floor(bucket.length / 2);

      buckets.splice(maxIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
    }

    // Average each bucket
    return buckets.map((bucket) => {
      let rSum = 0, gSum = 0, bSum = 0;
      for (const color of bucket) {
        rSum += (color >> 16) & 0xff;
        gSum += (color >> 8) & 0xff;
        bSum += color & 0xff;
      }
      const len = bucket.length || 1;
      return [Math.round(rSum / len), Math.round(gSum / len), Math.round(bSum / len)] as [number, number, number];
    });
  }

  /**
   * Find the closest palette color to a given RGB value.
   */
  private findClosest(palette: [number, number, number][], r: number, g: number, b: number): number {
    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < palette.length; i++) {
      const [pr, pg, pb] = palette[i];
      const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }
    return minIdx;
  }

  private writeHeader(view: DataView, offset: number): number {
    // GIF89a signature
    const header = "GIF89a";
    for (let i = 0; i < header.length; i++) {
      view.setUint8(offset++, header.charCodeAt(i));
    }
    return offset;
  }

  private writeLogicalScreenDescriptor(view: DataView, offset: number, palette: [number, number, number][]): number {
    view.setUint16(offset, this.width, true); offset += 2; // Canvas width
    view.setUint16(offset, this.height, true); offset += 2; // Canvas height

    // Packed byte: global color table flag (1), color resolution (7), sort (0), size of GCT (7)
    const paletteBits = Math.ceil(Math.log2(palette.length)) - 1;
    view.setUint8(offset++, 0x80 | (0x7 << 4) | paletteBits); // GCT flag + color res + size

    view.setUint8(offset++, 0); // Background color index
    view.setUint8(offset++, 0); // Pixel aspect ratio

    // Write global color table
    for (let i = 0; i < palette.length; i++) {
      view.setUint8(offset++, palette[i][0]);
      view.setUint8(offset++, palette[i][1]);
      view.setUint8(offset++, palette[i][2]);
    }

    return offset;
  }

  private writeNetscapeExtension(view: DataView, offset: number): number {
    // Application extension for looping
    view.setUint8(offset++, 0x21); // Extension introducer
    view.setUint8(offset++, 0xff); // Application extension
    view.setUint8(offset++, 11);   // Block size

    const netscape = "NETSCAPE2.0";
    for (let i = 0; i < netscape.length; i++) {
      view.setUint8(offset++, netscape.charCodeAt(i));
    }

    view.setUint8(offset++, 3);    // Sub-block size
    view.setUint8(offset++, 1);    // Sub-block ID
    view.setUint16(offset, 0, true); offset += 2; // Loop count (0 = infinite)
    view.setUint8(offset++, 0);    // Block terminator

    return offset;
  }

  private writeFrame(
    view: DataView,
    offset: number,
    indexedData: Uint8Array,
    palette: [number, number, number][]
  ): number {
    const frame = this.frames[0]; // Use first frame for delay info (all same)

    // Graphics Control Extension
    view.setUint8(offset++, 0x21); // Extension introducer
    view.setUint8(offset++, 0xf9); // Graphics control extension
    view.setUint8(offset++, 4);    // Block size
    view.setUint8(offset++, 0x00); // Packed: disposal method (0) + transparent flag (0)
    view.setUint16(offset, frame.delay, true); offset += 2; // Delay in centiseconds
    view.setUint8(offset++, 0);    // Transparent color index
    view.setUint8(offset++, 0);    // Block terminator

    // Image Descriptor
    view.setUint8(offset++, 0x2c); // Image separator
    view.setUint16(offset, 0, true); offset += 2; // Left
    view.setUint16(offset, 0, true); offset += 2; // Top
    view.setUint16(offset, this.width, true); offset += 2; // Width
    view.setUint16(offset, this.height, true); offset += 2; // Height

    // Local color table flag = 0 (using global)
    view.setUint8(offset++, 0x00);

    // LZW compress the indexed data
    offset = this.writeLzwData(view, offset, indexedData, palette.length);

    return offset;
  }

  /**
   * LZW compress the indexed pixel data.
   */
  private writeLzwData(view: DataView, offset: number, indexedData: Uint8Array, paletteSize: number): number {
    const minCodeSize = Math.max(2, Math.ceil(Math.log2(paletteSize)));

    view.setUint8(offset++, minCodeSize); // LZW minimum code size

    // LZW compression
    const compressed = this.lzwCompress(indexedData, minCodeSize);

    // Write sub-blocks (max 255 bytes each)
    let pos = 0;
    while (pos < compressed.length) {
      const blockSize = Math.min(255, compressed.length - pos);
      view.setUint8(offset++, blockSize);
      for (let i = 0; i < blockSize; i++) {
        view.setUint8(offset++, compressed[pos++]);
      }
    }

    view.setUint8(offset++, 0); // Block terminator

    return offset;
  }

  /**
   * LZW compression algorithm for GIF.
   */
  private lzwCompress(indexedData: Uint8Array, minCodeSize: number): number[] {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxCode = 4096;

    // Initialize dictionary
    const dictionary = new Map<string, number>();
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i);
    }

    const output: number[] = [];
    let bitBuffer = 0;
    let bitsUsed = 0;

    const writeBits = (code: number, size: number) => {
      bitBuffer |= code << bitsUsed;
      bitsUsed += size;
      while (bitsUsed >= 8) {
        output.push(bitBuffer & 0xff);
        bitBuffer >>= 8;
        bitsUsed -= 8;
      }
    };

    // Start with clear code
    writeBits(clearCode, codeSize);

    let current = String(indexedData[0]);
    for (let i = 1; i < indexedData.length; i++) {
      const next = String(indexedData[i]);
      const combined = current + "," + next;

      if (dictionary.has(combined)) {
        current = combined;
      } else {
        writeBits(dictionary.get(current)!, codeSize);

        if (nextCode < maxCode) {
          dictionary.set(combined, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          // Reset dictionary
          writeBits(clearCode, codeSize);
          dictionary.clear();
          for (let j = 0; j < clearCode; j++) {
            dictionary.set(String(j), j);
          }
          nextCode = eoiCode + 1;
          codeSize = minCodeSize + 1;
        }

        current = next;
      }
    }

    writeBits(dictionary.get(current)!, codeSize);
    writeBits(eoiCode, codeSize);

    // Flush remaining bits
    if (bitsUsed > 0) {
      output.push(bitBuffer & 0xff);
    }

    return output;
  }

  private calculateBufferSize(palette: [number, number, number][], indexedFrames: Uint8Array[]): number {
    // Rough estimate: header + screen desc + GCT + netscape ext + per frame overhead
    let size = 13 + palette.length * 3 + 19; // Header + GCT + Netscape
    for (const frame of indexedFrames) {
      size += 50 + frame.length; // Frame overhead + data
    }
    return size * 2; // Safety margin
  }
}

/**
 * Encode canvas frames to animated GIF.
 * Convenience function for use in PromoCardGenerator.
 */
export async function encodeGif(
  frames: { canvas: HTMLCanvasElement; delay: number }[],
  options?: { quality?: number }
): Promise<Blob> {
  if (frames.length === 0) throw new Error("No frames to encode");

  const firstFrame = frames[0].canvas;
  const encoder = new GifEncoder({
    width: firstFrame.width,
    height: firstFrame.height,
    quality: options?.quality ?? 10,
  });

  const ctx = firstFrame.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  for (const frame of frames) {
    const frameCtx = frame.canvas.getContext("2d");
    if (!frameCtx) continue;
    const imageData = frameCtx.getImageData(0, 0, frame.canvas.width, frame.canvas.height);
    encoder.addFrame(imageData, frame.delay);
  }

  return encoder.encode();
}
