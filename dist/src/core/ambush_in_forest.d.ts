/**
 * [B26] 매복 기습 데미지 증폭기 — AmbushInForest
 *
 * 목적: 숲 타일에 부대를 대기 시 은폐 모드로 전환하고,
 *       기습 발동 시 선제 공격 특권과 치명타 대미지 선사.
 *
 * 핵심 로직:
 *   1. 숲 타일 정지 후 행동 종료 시 isAmbusher = true
 *   2. 적 인접 이동 시 매복 해제 + 선제 타격 + 1턴 스턴
 */
export interface AmbushState {
    readonly unitId: string;
    readonly q: number;
    readonly r: number;
    readonly turnsAmbushed: number;
    readonly revealRange: number;
}
export interface AmbushTriggerResult {
    readonly triggered: boolean;
    readonly attackerGetsFirstStrike: boolean;
    readonly criticalMultiplier: number;
    readonly defenderStunned: boolean;
    readonly description: string;
}
export declare class AmbushInForest {
    private ambushers;
    /** 숲 타일에 매복 설정 */
    setupAmbush(unitId: string, q: number, r: number): boolean;
    /**
     * 적 유닛 이동 시 매복 발동 감지
     *
     * @param enemyQ - 적 이동 후 q
     * @param enemyR - 적 이동 후 r
     * @returns 매복 발동 결과
     */
    detectTrigger(enemyQ: number, enemyR: number): AmbushTriggerResult | null;
    /** 매복 상태 해제 (이동/공격 시) */
    breakAmbush(unitId: string): boolean;
    /** 매복 상태인 유닛 확인 */
    isAmbushing(unitId: string): boolean;
    /** 전체 매복 정보 */
    getAllAmbushes(): AmbushState[];
    /** 전장 초기화 */
    clearAll(): void;
}
//# sourceMappingURL=ambush_in_forest.d.ts.map