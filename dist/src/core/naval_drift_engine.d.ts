/**
 * [B5] 수역 강제 표류 및 유격 데미지 — Naval Drift Engine
 *
 * NavalDriftEngine:
 *   1. 매 턴 종료 시 수상 모드 유닛을 driftVector 방향으로 강제 1칸 이동
 *   2. 목표 타일이 WATER가 아니거나 점유된 경우 충돌 데미지 적용
 *   3. 충돌 시 사기 -10, 병력 8~10% 손실
 */
import type { BattleUnitState, HexTileState } from './hex_naval_state_resolver';
export interface CollisionResult {
    readonly unitId: string;
    readonly collision: boolean;
    readonly soldiersLost: number;
    readonly moraleLost: number;
    readonly blockedBy: 'LAND' | 'UNIT' | 'BOUNDS' | null;
}
export declare class NavalDriftEngine {
    private navalResolver;
    /**
     * 매 턴 종료 시 수상에 있는 모든 유닛을 강의 흐름에 따라 강제 이동시킵니다.
     */
    processTurnEndDrift(units: Map<string, BattleUnitState>, grid: Map<string, HexTileState>): CollisionResult[];
    private applyCollisionDamage;
}
//# sourceMappingURL=naval_drift_engine.d.ts.map