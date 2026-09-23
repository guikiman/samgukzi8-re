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
/** 시나리오 세력 고유색 → 색약 친화 대체 (Okabe-Ito 계열 명도차 보정) */
const DEUTERANOPIA = new Map([
    ['#b04a2a', { color: '#e69f00', symbol: '橙' }], // 적계 → 주황
    ['#2a5a8a', { color: '#0072b2', symbol: '青' }], // 청계 → 진청
    ['#4a9a5a', { color: '#009e73', symbol: '緑' }], // 녹계 → 청록
    ['#5a6a9a', { color: '#56b4e9', symbol: '空' }], // 청보라 → 하늘
    ['#d8b93a', { color: '#f0e442', symbol: '黃' }], // 금계 → 밝은 노랑
    ['#a8783c', { color: '#d55e00', symbol: '朱' }], // 황갈 → 진주황
    ['#9a3a5a', { color: '#cc79a7', symbol: '紫' }], // 자홍 → 분홍
    ['#8a4a3a', { color: '#e69f00', symbol: '橙' }],
    ['#7a5a9a', { color: '#cc79a7', symbol: '紫' }],
]);
const TRITANOPIA = new Map([
    ['#b04a2a', { color: '#d55e00', symbol: '朱' }],
    ['#2a5a8a', { color: '#0072b2', symbol: '青' }],
    ['#4a9a5a', { color: '#009292', symbol: '青綠' }],
    ['#5a6a9a', { color: '#56b4e9', symbol: '空' }],
    ['#d8b93a', { color: '#f0e442', symbol: '黃' }],
    ['#a8783c', { color: '#e69f00', symbol: '橙' }],
    ['#9a3a5a', { color: '#cc79a7', symbol: '紫' }],
    ['#8a4a3a', { color: '#d55e00', symbol: '朱' }],
    ['#7a5a9a', { color: '#cc79a7', symbol: '紫' }],
]);
/** 패턴 텍스처 옵션 — 색 외 차별 요소 (CSS 값) */
export const PATTERN_OPTIONS = ['none', 'hatch', 'dots', 'border'];
export const COLORBLIND_MODE_LABELS = {
    none: '표준 색상',
    deuteranopia: '적록 색약 친화',
    tritanopia: '청황 색약 친화',
};
export const PATTERN_LABELS = {
    none: '없음',
    hatch: '사선 무늬',
    dots: '점 무늬',
    border: '굵은 테두리',
};
/** 매핑에 없는 색은 안전하게 원본 유지 */
export function convertFactionColor(hex, mode) {
    if (mode === 'none')
        return hex;
    const key = hex.toLowerCase();
    const table = mode === 'deuteranopia' ? DEUTERANOPIA : TRITANOPIA;
    return table.get(key)?.color ?? hex;
}
export function factionSymbol(hex, mode) {
    if (mode === 'none')
        return null;
    const key = hex.toLowerCase();
    const table = mode === 'deuteranopia' ? DEUTERANOPIA : TRITANOPIA;
    return table.get(key)?.symbol ?? null;
}
/** main.ts 세력 색 사용 지점에서 일괄 변환하는 헬퍼 */
export function makeFactionColorResolver(mode) {
    return (hex) => convertFactionColor(hex, mode);
}
/** 세력 배지 CSS — 패턴 선택 시 배경 무늬를 추가 (이중 부호화) */
export function factionBadgeStyle(hex, mode, pattern) {
    const color = convertFactionColor(hex, mode);
    const symbol = factionSymbol(hex, mode);
    let patternCss = null;
    if (pattern === 'hatch') {
        patternCss = `repeating-linear-gradient(45deg, transparent 0 3px, ${color}44 3px 6px)`;
    }
    else if (pattern === 'dots') {
        patternCss = `radial-gradient(${color}55 1.5px, transparent 1.5px) 0 0/6px 6px`;
    }
    return { color, symbol, patternCss };
}
//# sourceMappingURL=colorblind_palette.js.map