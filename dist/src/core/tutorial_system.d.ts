/**
 * [461-480] 마이크로 UX · 튜토리얼/도움말 시스템
 * 파일: src/core/tutorial_system.ts
 *
 * 설계:
 * - 단계형 온보딩 튜토리얼 (이전/다음/건너뛰기)
 * - 완료 여부를 localStorage에 저장 — 2회차부터 자동 표시 안 함 [17]
 * - 렌더 로직(renderStep)은 순수 문자열 반환 — DOM 없이 단위 테스트 가능
 * - main.ts 브라우저 레이어가 HTML을 주입하고 버튼을 바인딩
 */
export interface TutorialStep {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    /** 하이라이트할 UI 요소 힌트 (도구바 버튼 id 등) — 표시용 텍스트 */
    readonly targetHint?: string;
}
export interface TutorialRenderResult {
    /** 패널 본문 HTML (제목 + 설명 + 단계 표시) */
    readonly html: string;
    /** 현재 단계 (1-based) */
    readonly step: number;
    readonly totalSteps: number;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}
export declare const TUTORIAL_STEPS: readonly TutorialStep[];
export declare class TutorialSystem {
    private index;
    private storageKey;
    constructor(storageKey?: string);
    /** 첫 플레이 여부 — false면 자동 표시를 건너뜀 [17] */
    shouldShowOnStart(): boolean;
    start(): void;
    next(): void;
    prev(): void;
    /** 현재 단계의 렌더 결과 — DOM 조작 없이 순수 계산 */
    renderStep(): TutorialRenderResult;
    /** 완료/건너뛰기 — localStorage에 기록 [17] */
    complete(): void;
    /** 테스트용 — 완료 기록 삭제 */
    reset(): void;
}
//# sourceMappingURL=tutorial_system.d.ts.map