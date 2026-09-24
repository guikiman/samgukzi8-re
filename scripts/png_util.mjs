/**
 * png_util.mjs — PNG 디코더 (최소 구현: 8bit RGBA/RGB, non-interlaced)
 *
 * scripts/make_ico.mjs에서 아이콘 리사이즈를 위해 원시 RGBA 픽셀 추출에 사용.
 */

import { inflateSync } from 'node:zlib';

/** PNG 시그니처 */
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * PNG 버퍼를 파싱해 { width, height, rgba } 반환
 * @param {Buffer} buf PNG 파일 버퍼
 */
export function pngToRaw(buf) {
    if (!buf.subarray(0, 8).equals(PNG_SIG)) {
        throw new Error('유효한 PNG 파일이 아닙니다');
    }

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatChunks = [];

    while (offset < buf.length) {
        const len = buf.readUInt32BE(offset);
        const type = buf.toString('ascii', offset + 4, offset + 8);
        const data = buf.subarray(offset + 8, offset + 8 + len);

        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data[8];
            colorType = data[9];
            if (bitDepth !== 8) throw new Error(`미지원 bit depth: ${bitDepth} (8만 지원)`);
            if (colorType !== 6 && colorType !== 2) {
                throw new Error(`미지원 color type: ${colorType} (6=RGBA, 2=RGB만 지원)`);
            }
        } else if (type === 'IDAT') {
            idatChunks.push(data);
        } else if (type === 'IEND') {
            break;
        }
        offset += 12 + len; // length(4) + type(4) + data(len) + crc(4)
    }

    const compressed = Buffer.concat(idatChunks);
    const stride = width * (colorType === 6 ? 4 : 3);
    const raw = inflateSync(compressed);

    // 필터 복원 (per-scanline filter byte)
    const out = Buffer.alloc(width * height * 4);
    let prevRow = Buffer.alloc(stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        const rowStart = y * (stride + 1) + 1;
        const row = Buffer.from(raw.subarray(rowStart, rowStart + stride));

        // unfilter
        for (let i = 0; i < stride; i++) {
            const a = i >= (colorType === 6 ? 4 : 3) ? row[i - (colorType === 6 ? 4 : 3)] : 0;
            const b = prevRow[i];
            const c = i >= (colorType === 6 ? 4 : 3) ? prevRow[i - (colorType === 6 ? 4 : 3)] : 0;
            let val = row[i];
            switch (filter) {
                case 1: val = (val + a) & 0xff; break; // Sub
                case 2: val = (val + b) & 0xff; break; // Up
                case 3: val = (val + ((a + b) >> 1)) & 0xff; break; // Average
                case 4: { // Paeth
                    const p = a + b - c;
                    const pa = Math.abs(p - a);
                    const pb = Math.abs(p - b);
                    const pc = Math.abs(p - c);
                    const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
                    val = (val + pred) & 0xff;
                    break;
                }
            }
            row[i] = val;
        }
        prevRow = row;

        // RGB → RGBA 확장 또는 그대로
        for (let x = 0; x < width; x++) {
            const di = (y * width + x) * 4;
            if (colorType === 6) {
                out[di] = row[x * 4];
                out[di + 1] = row[x * 4 + 1];
                out[di + 2] = row[x * 4 + 2];
                out[di + 3] = row[x * 4 + 3];
            } else {
                out[di] = row[x * 3];
                out[di + 1] = row[x * 3 + 1];
                out[di + 2] = row[x * 3 + 2];
                out[di + 3] = 255;
            }
        }
    }

    return { width, height, rgba: out };
}
