/**
 * make_ico.mjs — PNG 파일로부터 Windows .ico 생성
 *
 * Windows Tauri 빌드는 tauri.conf.json의 bundle.icon에 등록된
 * icons/icon.ico를 요구한다(tauri-build 리소스 컴파일용).
 *
 * ICO 형식: ICONDIR + ICONDIRENTRY(들) + PNG 데이터 (Vista+ PNG-in-ICO 지원)
 *
 * 사용: node scripts/make_ico.mjs [src.png] [out.ico] [sizes...]
 * 기본: node scripts/make_ico.mjs src-tauri/icons/icon.png src-tauri/icons/icon.ico 16 24 32 48 64 128 256
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pngToRaw } from './png_util.mjs';

const [,, srcPath = 'src-tauri/icons/icon.png', outPath = 'src-tauri/icons/icon.ico', ...sizeArgs] = process.argv;
const sizes = sizeArgs.length > 0 ? sizeArgs.map(Number) : [16, 24, 32, 48, 64, 128, 256];

const png = readFileSync(srcPath);
const { width, height, rgba } = pngToRaw(png);

// 간단한 area-average 리사이즈
function resize(target) {
    const out = Buffer.alloc(target * target * 4);
    const ratio = width / target;
    for (let y = 0; y < target; y++) {
        for (let x = 0; x < target; x++) {
            const sx = Math.min(width - 1, Math.floor((x + 0.5) * ratio));
            const sy = Math.min(height - 1, Math.floor((y + 0.5) * ratio));
            const si = (sy * width + sx) * 4;
            const di = (y * target + x) * 4;
            out[di] = rgba[si];
            out[di + 1] = rgba[si + 1];
            out[di + 2] = rgba[si + 2];
            out[di + 3] = rgba[si + 3];
        }
    }
    return out;
}

// ICO 조립
const images = sizes.map((s) => {
    const raw = resize(s);
    // BMP (BITMAPINFOHEADER + BGRA 픽셀 + AND 마스크)
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);              // biSize
    header.writeInt32LE(s, 4);                // biWidth
    header.writeInt32LE(s * 2, 8);            // biHeight (XOR+AND)
    header.writeUInt16LE(1, 12);              // biPlanes
    header.writeUInt16LE(32, 14);             // biBitCount
    header.writeUInt32LE(0, 20);              // biCompression = BI_RGB
    const andMaskSize = s * Math.ceil(s / 32) * 4; // 행 정렬 4바이트
    const bmp = Buffer.concat([header, raw, Buffer.alloc(andMaskSize)]);
    return { size: s, data: bmp };
});

// PNG 임베딩 방식이 더 간단하지만, 최대 호환을 위해 BMP 방식 사용
const count = images.length;
const icondir = Buffer.alloc(6);
icondir.writeUInt16LE(0, 0);   // reserved
icondir.writeUInt16LE(1, 2);   // type = icon
icondir.writeUInt16LE(count, 4); // count

const entries = [];
let offset = 6 + count * 16;
for (const img of images) {
    const e = Buffer.alloc(16);
    e[0] = img.size >= 256 ? 0 : img.size; // width (256 → 0)
    e[1] = img.size >= 256 ? 0 : img.size; // height
    e[2] = 0;  // colors
    e[3] = 0;  // reserved
    e.writeUInt16LE(1, 4);   // planes
    e.writeUInt16LE(32, 6);  // bpp
    e.writeUInt32LE(img.data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.data.length;
    entries.push(e);
}

const ico = Buffer.concat([icondir, ...entries, ...images.map((i) => i.data)]);
writeFileSync(outPath, ico);
console.log(`✅ ${outPath} 생성 완료 (${sizes.join('/')}px, ${ico.length} bytes)`);
