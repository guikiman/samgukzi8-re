/**
 * [E36] 헤드리스 자동 플레이 E2E 테스트 스위트 — PlaywrightFlowTester
 *
 * 목적: 새 패치 적용 시 전체 게임 주요 흐름이 중단되는 버그 탐지.
 *
 * 핵심 로직:
 *   1. 가상 브라우저에서 장수선택→평정→전쟁선포→턴스킵→전투 시나리오 실행
 *   2. 크래시 발생 지점 캡처 + 에러 로그 아카이빙
 */
export type TestScenario = 'SELECT_OFFICER' | 'COUNCIL_PHASE' | 'DECLARE_WAR' | 'SKIP_TURN' | 'FORCE_BATTLE' | 'DIPLOMACY' | 'RECRUITMENT';
export interface TestStep {
    readonly scenario: TestScenario;
    readonly description: string;
}
export interface TestResult {
    readonly passed: boolean;
    readonly failedStep: TestScenario | null;
    readonly errorLog: string[];
    readonly durationMs: number;
}
export declare const FULL_GAME_SCENARIO: TestStep[];
export declare class PlaywrightFlowTester {
    private logs;
    /**
     * E2E 시나리오 실행 (Playwright 바인딩 자리표시)
     * 실제 Playwright 테스트에서는 각 step을 page.click/page.waitForSelector로 검증
     */
    runScenario(steps?: TestStep[]): Promise<TestResult>;
    /** 개별 스텝 실행 (실제 Playwright 바인딩) */
    private executeStep;
    private simulateAction;
    /** 에러 로그 반환 */
    getLogs(): string[];
    /** 로그 문자열로 내보내기 */
    exportLog(): string;
}
//# sourceMappingURL=playwright_flow_tester.d.ts.map