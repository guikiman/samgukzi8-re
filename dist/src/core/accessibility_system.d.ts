/**
 * [461-480] 마이크로 UX · 접근성 옵션 시스템
 * 파일: src/core/accessibility_system.ts
 *
 * 설계:
 * - 글꼴 실시간 전환 (세리프/산세리프/고대비) [가독성 높은 글꼴 옵션]
 * - 화면 흔들림(Screen Shake) 토글 [동적 UI/UX]
 * - 글자 크기 배율 (0.9 / 1.0 / 1.15 / 1.3)
 * - 설정은 localStorage에 저장 — 재방문 시 복원 [17]
 * - applySettings는 순수 CSS 변수/속성 대입만 수행 — DOM 구조 변경 없음
 */
export type FontMode = 'serif' | 'sans' | 'contrast';
export type TextScale = 0.9 | 1.0 | 1.15 | 1.3;
export interface AccessibilitySettings {
    readonly fontMode: FontMode;
    readonly textScale: TextScale;
    /** 화면 흔들림 효과 on/off [동적 UI/UX] */
    readonly screenShake: boolean;
    /** 무장 이름 옆 능력치 숫자 표시 (정보 과잉 민감자용) */
    readonly showStatNumbers: boolean;
}
export declare const DEFAULT_ACCESSIBILITY: AccessibilitySettings;
export declare const FONT_MODE_LABELS: Record<FontMode, string>;
export declare const TEXT_SCALE_LABELS: Record<TextScale, string>;
export declare function loadAccessibilitySettings(): AccessibilitySettings;
export declare function saveAccessibilitySettings(s: AccessibilitySettings): void;
/** data-* 속성 맵 — main.ts가 document.body에 대입 */
export declare function accessibilityAttributes(s: AccessibilitySettings): Record<string, string>;
/** 설정 패널 본문 HTML — 순수 문자열 (단위 테스트 가능) */
export declare function renderAccessibilityPanel(s: AccessibilitySettings): string;
//# sourceMappingURL=accessibility_system.d.ts.map