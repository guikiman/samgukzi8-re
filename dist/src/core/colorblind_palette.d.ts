/**
 * [461-480] 마이크로 UX · 색약 친화 팔레트 시스템
 * 파일: src/core/colorblind_palette.ts
 *
 * 설계:
 * - 세력 고유색(시나리오 정의)을 색각 다양성 친화 팔레트로 교체
 * - 3가지 모드: 표준 / 청록-주황(적록 무관) / 노랑-파랑(청황 무관) — Okabe-Ito 계열
 * - 세력명 라벨 대신 쓸 짧은 한자 기호 + 패턴 텍스처 선택지 제공 (이중 부호화)
 * - 교체 로직은 순수 함수 — hex 파싱 없이 문자열 키 매핑으로 O(1)
 */
export type ColorblindMode = 'none' | 'deuteranopia' | 'tritanopia';
export interface PaletteEntry {
    /** 교체 후 색상 hex */
    readonly color: string;
    /** 세력 라벨용 한자 기호 (이중 부호화) */
    readonly symbol: string;
}
/** 패턴 텍스처 옵션 — 색 외 차별 요소 (CSS 값) */
export declare const PATTERN_OPTIONS: readonly ["none", "hatch", "dots", "border"];
export type PatternOption = (typeof PATTERN_OPTIONS)[number];
export declare const COLORBLIND_MODE_LABELS: Record<ColorblindMode, string>;
export declare const PATTERN_LABELS: Record<PatternOption, string>;
/** 매핑에 없는 색은 안전하게 원본 유지 */
export declare function convertFactionColor(hex: string, mode: ColorblindMode): string;
export declare function factionSymbol(hex: string, mode: ColorblindMode): string | null;
/** main.ts 세력 색 사용 지점에서 일괄 변환하는 헬퍼 */
export declare function makeFactionColorResolver(mode: ColorblindMode): (hex: string) => string;
/** 세력 배지 CSS — 패턴 선택 시 배경 무늬를 추가 (이중 부호화) */
export declare function factionBadgeStyle(hex: string, mode: ColorblindMode, pattern: PatternOption): {
    color: string;
    symbol: string | null;
    patternCss: string | null;
};
//# sourceMappingURL=colorblind_palette.d.ts.map