/**
 * [B9] 성벽 붕괴 및 야전-공성 상태 변환기 — WallBreachFSMTransition
 *
 * 목적: 성벽/성문 내구도가 0에 달했을 때 실시간으로 전투 국면을
 *       야전(FIELD) → 성내전(SIEGE) → 최종 돌입(INNER)으로 전환.
 *
 * 핵심 로직:
 *   1. 성문 파괴 감지 즉시 성문 붕괴 파티클 트리거
 *   2. 인접 2타일 내 수비측 유닛 혼란(CONFUSED) 상태 1턴 부여
 */
export type BattlePhase = 'FIELD' | 'SIEGE' | 'INNER';
export type BreachType = 'GATE_DESTROYED' | 'WALL_BREACHED' | 'SIEGE_TOWER_DEPLOYED';
export interface BreachEvent {
    readonly type: BreachType;
    readonly phase: BattlePhase;
    readonly affectedUnitIds: string[];
    readonly confusionDuration: number;
    readonly adjacentTileCount: number;
}
export declare class WallBreachFSMTransition {
    /**
     * 성문/성벽 붕괴 상태 전이 처리
     *
     * @param currentPhase - 현재 전투 국면
     * @param breachType   - 붕괴 유형
     * @param adjacentUnitIds - 인접 유닛 ID 목록
     * @returns BreachEvent — 새 국면 및 영향 유닛 정보
     */
    processBreach(currentPhase: BattlePhase, breachType: BreachType, adjacentUnitIds: string[]): BreachEvent;
    /** 성문 내구도 기반 붕괴 감지 */
    detectBreach(gateDurability: number, wallDurability: number, isGateTarget: boolean): BreachType | null;
}
//# sourceMappingURL=wall_breach_fsm.d.ts.map