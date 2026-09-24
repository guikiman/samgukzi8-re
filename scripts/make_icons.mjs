/**
 * make_icons.mjs — 삼국지 테마 앱 아이콘 생성기
 *
 * 레드 배경 + 아이보리 三 글자(픽셀 비트맵) + 금 테두리.
 * 5×5 픽셀 그리드 三 비트맵을 해상도에 맞게 스케일링해 렌더링한다.
 *
 * 출력: src-tauri/icons/{32x32,128x128,128x128@2x,icon}.png
 * 실행: node scripts/make_icons.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// 三 글자 비트맵 (9×9 — 획 3줄 + 좌우 여백)
const SAN_BITMAP = [
    '..#####..',
    '.#######.',
    '..#####..',
    '.........',
    '.........',
    '.#######.',
    '.........',
    '.........',
    '#########',
];

const BG = [0xe9, 0x45, 0x60];      // 게임 테마 레드
const FG = [0xf0, 0xe6, 0xc8];      // 아이보리 (三)
const BORDER = [0xd4, 0xaf, 0x37];  // 금 테두리

/** PNG 인코더 (8bit RGBA) */
function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c;
    }
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, pixels) {
    const raw = Buffer.alloc(size * (size * 4 + 1));
    let off = 0;
    for (let y = 0; y < size; y++) {
        raw[off++] = 0;
        for (let x = 0; x < size; x++) {
            const c = pixels[y * size + x];
            raw[off++] = c[0]; raw[off++] = c[1]; raw[off++] = c[2]; raw[off++] = 255;
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

/** 三 아이콘 렌더 — size×size 픽셀 배열 생성 */
function renderSan(size) {
    const px = new Array(size * size);
    const cell = size / 11; // 비트맵 9 + 상하좌우 여백 2
    const margin = cell;
    const border = Math.max(1, Math.round(size * 0.03));

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let color;
            // 외곽 금 테두리
            if (x < border || y < border || x >= size - border || y >= size - border) {
                color = BORDER;
            } else {
                // 三 비트맵 샘플링 (좌우 중앙 정렬)
                const bx = Math.floor((x - margin) / cell);
                const by = Math.floor((y - margin) / cell);
                const inBitmap = bx >= 0 && bx < 9 && by >= 0 && by < 9;
                color = inBitmap && SAN_BITMAP[by][bx] === '#' ? FG : BG;
            }
            px[y * size + x] = color;
        }
    }
    return px;
}

mkdirSync('src-tauri/icons', { recursive: true });
const outputs = [
    ['src-tauri/icons/32x32.png', 32],
    ['src-tauri/icons/128x128.png', 128],
    ['src-tauri/icons/128x128@2x.png', 256],
    ['src-tauri/icons/icon.png', 512],
];
for (const [path, size] of outputs) {
    writeFileSync(path, encodePng(size, renderSan(size)));
    console.log(`✅ ${path} (${size}px)`);
}

// .ico도 갱신 — 별도 스크립트 재사용
console.log('→ node scripts/make_ico.mjs 로 icon.ico 갱신하세요');
