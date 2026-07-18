/**
 * [Task 73] 아틀라스 디프래그멘터 — AtlasDefragmenter
 *
 * 목적: 아틀라스 내 제거된 리전으로 인한 단편화를
 *       최적화하여 공간 효율 복원.
 *
 * 핵심 로직:
 *   1. 사용 중인 리전 목록 스캔
 *   2. 단편화율 계산 (사용 가능 공간 / 전체 공간)
 *   3. 단편화 심각 시 리패킹 제안
 */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export class AtlasDefragmenter {
  private readonly atlasWidth: number;
  private readonly atlasHeight: number;
  private usedRegions: Rect[] = [];
  private freeRegions: Rect[] = [];

  constructor(width: number, height: number) {
    this.atlasWidth = width;
    this.atlasHeight = height;
    this.freeRegions = [{ x: 0, y: 0, w: width, h: height }];
  }

  /**
   * 리전 할당
   */
  alloc(w: number, h: number): Rect | null {
    for (let i = 0; i < this.freeRegions.length; i++) {
      const f = this.freeRegions[i];
      if (f.w >= w && f.h >= h) {
        const alloc: Rect = { x: f.x, y: f.y, w, h };
        this.usedRegions.push(alloc);

        // 남은 공간 분할
        this.freeRegions.splice(i, 1);
        if (f.w > w) {
          this.freeRegions.push({ x: f.x + w, y: f.y, w: f.w - w, h });
        }
        if (f.h > h) {
          this.freeRegions.push({ x: f.x, y: f.y + h, w: f.w, h: f.h - h });
        }

        return alloc;
      }
    }
    return null;
  }

  /**
   * 리전 제거
   */
  free(rect: Rect): void {
    const idx = this.usedRegions.findIndex(
      (r) => r.x === rect.x && r.y === rect.y,
    );
    if (idx >= 0) {
      this.usedRegions.splice(idx, 1);
      this.freeRegions.push(rect);
      this.coalesce();
    }
  }

  /**
   * 단편화율 계산 (0 ~ 1)
   */
  getFragmentationRatio(): number {
    const totalArea = this.atlasWidth * this.atlasHeight;
    const freeArea = this.freeRegions.reduce((sum, r) => sum + r.w * r.h, 0);
    return freeArea / totalArea;
  }

  /**
   * 단편화가 심각한가?
   */
  isFragmented(threshold = 0.3): boolean {
    return this.getFragmentationRatio() > threshold;
  }

  /**
   * 인접 자유 영역 병합
   */
  private coalesce(): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < this.freeRegions.length; i++) {
        for (let j = i + 1; j < this.freeRegions.length; j++) {
          const a = this.freeRegions[i];
          const b = this.freeRegions[j];

          // 같은 행에서 인접
          if (a.y === b.y && a.h === b.h && (a.x + a.w === b.x || b.x + b.w === a.x)) {
            const merged: Rect = {
              x: Math.min(a.x, b.x),
              y: a.y,
              w: a.w + b.w,
              h: a.h,
            };
            this.freeRegions.splice(j, 1);
            this.freeRegions.splice(i, 1, merged);
            changed = true;
            break;
          }

          // 같은 열에서 인접
          if (a.x === b.x && a.w === b.w && (a.y + a.h === b.y || b.y + b.h === a.y)) {
            const merged: Rect = {
              x: a.x,
              y: Math.min(a.y, b.y),
              w: a.w,
              h: a.h + b.h,
            };
            this.freeRegions.splice(j, 1);
            this.freeRegions.splice(i, 1, merged);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }
  }
}
