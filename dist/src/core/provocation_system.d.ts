/**
 * [B28] 도발 시스템 — Provocation System
 *
 * ProvocationSystem:
 *   1. 지력 높고 '도발' 특기 장수가 적장 지정
 *   2. 적장의 의리도 + 충동성 성향 판정
 *   3. 성공 시 적장 제어 무력화 + 자신 위치로 강제 이동
 *   4. 2턴 지속
 */
export interface ProvocationResult {
    readonly casterId: string;
    readonly targetId: string;
    readonly success: boolean;
    readonly duration: number;
    readonly description: string;
}
export interface ProvokedState {
    readonly targetId: string;
    readonly provokedBy: string;
    readonly remainingTurns: number;
    readonly originalPosition: {
        q: number;
        r: number;
    };
    readonly forcedMove: boolean;
}
export declare class ProvocationSystem {
    private provokedUnits;
    attemptProvocation(casterId: string, casterIntelligence: number, hasProvokeSkill: boolean, targetId: string, targetLoyalty: number, targetImpulsiveness: number, targetPosition: {
        q: number;
        r: number;
    }, casterPosition: {
        q: number;
        r: number;
    }): ProvocationResult;
    isProvoked(unitId: string): boolean;
    getProvokedState(unitId: string): ProvokedState | null;
    processTurnEnd(): ProvokedState[];
    clear(): void;
}
//# sourceMappingURL=provocation_system.d.ts.map