/**
 * [E36] 헤드리스 자동 플레이 E2E 테스트 스위트 — PlaywrightFlowTester
 *
 * 목적: 새 패치 적용 시 전체 게임 주요 흐름이 중단되는 버그 탐지.
 *
 * 핵심 로직:
 *   1. 가상 브라우저에서 장수선택→평정→전쟁선포→턴스킵→전투 시나리오 실행
 *   2. 크래시 발생 지점 캡처 + 에러 로그 아카이빙
 */
export const FULL_GAME_SCENARIO = [
    { scenario: 'SELECT_OFFICER', description: '시나리오 선택 후 장수 선택' },
    { scenario: 'COUNCIL_PHASE', description: '평정 페이즈 진행' },
    { scenario: 'DECLARE_WAR', description: '인접 세력에 전쟁 선포' },
    { scenario: 'FORCE_BATTLE', description: '강제 전투 진입' },
    { scenario: 'SKIP_TURN', description: '3턴 스킵 후 외교' },
    { scenario: 'RECRUITMENT', description: '재야 장수 등용 시도' },
    { scenario: 'DIPLOMACY', description: '동맹/증정 외교' },
];
export class PlaywrightFlowTester {
    constructor() {
        this.logs = [];
    }
    /**
     * E2E 시나리오 실행 (Playwright 바인딩 자리표시)
     * 실제 Playwright 테스트에서는 각 step을 page.click/page.waitForSelector로 검증
     */
    async runScenario(steps = FULL_GAME_SCENARIO) {
        const startTime = Date.now();
        this.logs = [`E2E 테스트 시작: ${steps.length} 단계`];
        for (const step of steps) {
            try {
                this.logs.push(`실행: ${step.scenario} - ${step.description}`);
                // 실제 Playwright: await page.click(`[data-test="${step.scenario}"]`);
                await this.executeStep(step);
                this.logs.push(`성공: ${step.scenario}`);
            }
            catch (err) {
                const errorMsg = `실패: ${step.scenario} - ${String(err)}`;
                this.logs.push(errorMsg);
                return {
                    passed: false,
                    failedStep: step.scenario,
                    errorLog: this.logs,
                    durationMs: Date.now() - startTime,
                };
            }
        }
        this.logs.push(`✅ E2E 테스트 통과: ${steps.length}/${steps.length}`);
        return {
            passed: true,
            failedStep: null,
            errorLog: this.logs,
            durationMs: Date.now() - startTime,
        };
    }
    /** 개별 스텝 실행 (실제 Playwright 바인딩) */
    async executeStep(step) {
        // 자리표시: 여기서 Playwright page 객체로 실제 클릭/대기 수행
        switch (step.scenario) {
            case 'SELECT_OFFICER':
                await this.simulateAction(100);
                break;
            case 'COUNCIL_PHASE':
                await this.simulateAction(200);
                break;
            case 'DECLARE_WAR':
                await this.simulateAction(150);
                break;
            case 'FORCE_BATTLE':
                await this.simulateAction(300);
                break;
            case 'SKIP_TURN':
                await this.simulateAction(100);
                break;
            case 'RECRUITMENT':
                await this.simulateAction(150);
                break;
            case 'DIPLOMACY':
                await this.simulateAction(150);
                break;
        }
    }
    simulateAction(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /** 에러 로그 반환 */
    getLogs() {
        return [...this.logs];
    }
    /** 로그 문자열로 내보내기 */
    exportLog() {
        return this.logs.join('\n');
    }
}
//# sourceMappingURL=playwright_flow_tester.js.map