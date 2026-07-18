/**
 * [7] 전술 전투 중 아군 부대 '실시간 AI 위임 토글 스위치'
 *
 * BattleAIToggle:
 *   - toggleAI(): 단축키 T로 메인 무장 포함 아군 전체 AI 시뮬레이션 모드 전환
 *   - isAIActive(): 현재 AI 위임 상태 확인
 *   - runAISimulation(): AI 시뮬레이션 실행 (락스텝 스레드 제어)
 *   - revertToManual(): 언제든 수동 컨트롤로 복귀
 */
export type BattleControlMode = 'MANUAL' | 'AI_DELEGATED';
export interface BattleAIToggleState {
    readonly mode: BattleControlMode;
    readonly delegatedUnitIds: readonly string[];
    readonly lastAIAction: string;
    readonly tickCount: number;
}
export declare class BattleAIToggle {
    private state;
    /**
     * [7] AI 위임 토글 (단축키 T)
     *
     * MANUAL ↔ AI_DELEGATED 전환
     * AI 모드에서는 메인 무장 포함 아군 전체가 AI 시뮬레이션으로 자동 전환
     */
    toggleAI(unitIds: string[]): BattleAIToggleState;
    /**
     * [7] AI 시뮬레이션 실행 (락스텝)
     *
     * 위임된 부대의 AI 전술 결정을 시뮬레이션
     */
    runAISimulation(): string;
    getState(): BattleAIToggleState;
}
//# sourceMappingURL=battle_ai_toggle.d.ts.map