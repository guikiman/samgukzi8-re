/**
 * [E46] GPU 텍스처 아틀라스 팩커 — GPUTextureAtlasPacker
 *
 * 목적: 수백 개의 개별 텍스처를 하나의 큰 아틀라스로 묶어
 *       GPU 드로우콜 횟수를 극적으로 감소.
 *
 * 핵심 로직:
 *   1. MaxRects 알고리즘으로 빈 공간 최적화
 *   2. 각 텍스처의 UV 좌표 반환
 */

export interface AtlasRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

export interface PackedTexture {
    readonly id: string;
    readonly rect: AtlasRect;
    readonly uv: { u: number; v: number; u2: number; v2: number };
}

export class GPUTextureAtlasPacker {
    private readonly atlasWidth: number;
    private readonly atlasHeight: number;
    private freeRects: AtlasRect[] = [];
    private packed: Map<string, PackedTexture> = new Map();

    constructor(atlasWidth = 2048, atlasHeight = 2048) {
        this.atlasWidth = atlasWidth;
        this.atlasHeight = atlasHeight;
        this.freeRects.push({ x: 0, y: 0, width: atlasWidth, height: atlasHeight });
    }

    /** 텍스처를 아틀라스에 패킹 */
    pack(id: string, width: number, height: number): PackedTexture | null {
        const rect = this.findBestFit(width, height);
        if (!rect) return null;

        const packed: PackedTexture = {
            id,
            rect: { x: rect.x, y: rect.y, width, height },
            uv: {
                u: rect.x / this.atlasWidth,
                v: rect.y / this.atlasHeight,
                u2: (rect.x + width) / this.atlasWidth,
                v2: (rect.y + height) / this.atlasHeight,
            },
        };

        this.packed.set(id, packed);
        this.splitFreeRect(rect, width, height);
        return packed;
    }

    /** MaxRects: 최적 빈 공간 탐색 */
    private findBestFit(width: number, height: number): AtlasRect | null {
        let best: AtlasRect | null = null;
        let bestWaste = Infinity;

        for (const rect of this.freeRects) {
            if (rect.width >= width && rect.height >= height) {
                const waste = (rect.width - width) + (rect.height - height);
                if (waste < bestWaste) {
                    best = rect;
                    bestWaste = waste;
                }
            }
        }
        return best;
    }

    /** 빈 공간 분할 */
    private splitFreeRect(rect: AtlasRect, usedW: number, usedH: number): void {
        const idx = this.freeRects.indexOf(rect);
        if (idx >= 0) this.freeRects.splice(idx, 1);

        // 우측 여분
        if (rect.width > usedW) {
            this.freeRects.push({
                x: rect.x + usedW,
                y: rect.y,
                width: rect.width - usedW,
                height: usedH,
            });
        }

        // 하단 여분
        if (rect.height > usedH) {
            this.freeRects.push({
                x: rect.x,
                y: rect.y + usedH,
                width: rect.width,
                height: rect.height - usedH,
            });
        }

        // 병합 가능한 빈 공간 병합
        this.mergeFreeRects();
    }

    /** 인접 빈 공간 병합 */
    private mergeFreeRects(): void {
        for (let i = 0; i < this.freeRects.length; i++) {
            for (let j = i + 1; j < this.freeRects.length; j++) {
                const a = this.freeRects[i];
                const b = this.freeRects[j];

                // 수평 병합
                if (a.y === b.y && a.height === b.height && a.x + a.width === b.x) {
                    this.freeRects[i] = { x: a.x, y: a.y, width: a.width + b.width, height: a.height };
                    this.freeRects.splice(j, 1);
                    j--;
                    continue;
                }

                // 수직 병합
                if (a.x === b.x && a.width === b.width && a.y + a.height === b.y) {
                    this.freeRects[i] = { x: a.x, y: a.y, width: a.width, height: a.height + b.height };
                    this.freeRects.splice(j, 1);
                    j--;
                }
            }
        }
    }

    /** 텍스처 제거 */
    remove(id: string): void {
        this.packed.delete(id);
    }

    /** 아틀라스 사용률 */
    getUtilization(): number {
        let used = 0;
        for (const [, pt] of this.packed) {
            used += pt.rect.width * pt.rect.height;
        }
        return used / (this.atlasWidth * this.atlasHeight);
    }

    /** 모든 텍스처 초기화 */
    clear(): void {
        this.packed.clear();
        this.freeRects = [{ x: 0, y: 0, width: this.atlasWidth, height: this.atlasHeight }];
    }
}
