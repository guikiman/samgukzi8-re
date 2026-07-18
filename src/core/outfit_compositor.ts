/**
 * [Task 79] 복장 컴포지터 — OutfitCompositor
 *
 * 목적: 무장 초상화에 장비/의상 레이어를 동적으로
 *       합성하여 캐릭터 외형 변경.
 *
 * 핵심 로직:
 *   1. 베이스 초상화 + 장비 레이어 합성
 *   2. 레이어별 블렌드 모드 지원
 */

export interface OutfitLayer {
  readonly name: string;
  readonly u: number;
  readonly v: number;
  readonly w: number;
  readonly h: number;
  readonly blendMode: "normal" | "multiply" | "screen";
}

export interface OutfitPreset {
  readonly id: string;
  readonly layers: OutfitLayer[];
}

export class OutfitCompositor {
  private presets = new Map<string, OutfitPreset>();

  /**
   * 복장 프리셋 등록
   */
  registerPreset(id: string, layers: OutfitLayer[]): void {
    this.presets.set(id, { id, layers });
  }

  /**
   * 프리셋 조회
   */
  getPreset(id: string): OutfitPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * 베이스 이미지에 레이어 합성
   */
  composite(
    baseCtx: CanvasRenderingContext2D,
    outfitId: string,
    srcCanvas: HTMLCanvasElement,
  ): void {
    const preset = this.presets.get(outfitId);
    if (!preset) return;

    for (const layer of preset.layers) {
      baseCtx.save();

      switch (layer.blendMode) {
        case "multiply":
          baseCtx.globalCompositeOperation = "multiply";
          break;
        case "screen":
          baseCtx.globalCompositeOperation = "screen";
          break;
        default:
          baseCtx.globalCompositeOperation = "source-over";
      }

      baseCtx.drawImage(
        srcCanvas,
        layer.u, layer.v, layer.w, layer.h,
        0, 0, layer.w, layer.h,
      );

      baseCtx.restore();
    }
  }

  /**
   * 등록된 프리셋 목록
   */
  getPresetIds(): string[] {
    return Array.from(this.presets.keys());
  }

  clear(): void {
    this.presets.clear();
  }
}
