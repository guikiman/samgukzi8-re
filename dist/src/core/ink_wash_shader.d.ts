/**
 * [D31] 수묵화 스타일 셰이더 — Ink Wash Painting Shader
 *
 * InkWashShader:
 *   1. Sobel 에지 검출 → 먹선 강조
 *   2. 색상 채도 감소 (saturation × 0.4)
 *   3. 명암비 증가 (contrast × 1.5)
 *   4. 에지 영역 검정 먹선 오버레이
 *   5. 종이 질감 노이즈 오버레이
 */
import type { Season, Weather } from './types';
export interface InkWashStyle {
    readonly inkIntensity: number;
    readonly brushStrokeWidth: number;
    readonly paperTextureStrength: number;
    readonly colorSaturation: number;
    readonly edgeDarkening: number;
    readonly contrast: number;
}
export declare class InkWashShader {
    /** 계절/날씨 기반 스타일 프리셋 */
    getInkWashStyle(season: Season, weather: Weather): InkWashStyle;
    /** Sobel 에지 검출 (간략) */
    private detectEdges;
    /** 캔버스 2D에 수묵화 효과 적용 */
    applyInkWash(ctx: CanvasRenderingContext2D, width: number, height: number, style: InkWashStyle): void;
    /** CSS 필터 기반 수묵화 효과 (WebGL 대체) */
    getCSSFilter(style: InkWashStyle): string;
}
//# sourceMappingURL=ink_wash_shader.d.ts.map