/**
 * [Task 77] 아틀라스 디버그 오버레이 — AtlasDebugOverlay
 *
 * 목적: 텍스처 아틀라스의 사용 현황을 시각적으로
 *       디버깅하는 오버레이.
 *
 * 핵심 로직:
 *   1. 아틀라스 텍스처 위에 리전 경계선 그리기
 *   2. 사용률, 리전 수, 단편화율 표시
 */
import { AtlasRegion } from "./atlas_coord_dict";
export interface AtlasStats {
    readonly atlasWidth: number;
    readonly atlasHeight: number;
    readonly usedRegions: number;
    readonly freeRatio: number;
    readonly totalMemoryKB: number;
}
export declare class AtlasDebugOverlay {
    private canvas;
    private ctx;
    /**
     * 디버그 캔버스 초기화
     */
    initialize(canvas: HTMLCanvasElement): void;
    /**
     * 아틀라스 오버레이 렌더링
     */
    render(regions: AtlasRegion[], stats: AtlasStats, atlasTexture?: WebGLTexture): void;
    /**
     * 오버레이 초기화
     */
    clear(): void;
}
//# sourceMappingURL=atlas_debug_overlay.d.ts.map