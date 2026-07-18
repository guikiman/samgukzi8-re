/**
 * [16] 코끼리 광폭화 로직 — Elephant Rampage Logic
 *
 * 남만 코끼리병이 화공 피해를 입을 시 광폭화 상태로 변해
 * 피아 식별 없이 주변 6개 인접 헥스를 타격
 */
import type { HexCoord } from './types.js';
export interface RampageState {
    elephantUnitId: string;
    targetPosition: HexCoord;
    rampageDamage: number;
    triggeredByFire: boolean;
    remainingTurns: number;
    isActive: boolean;
}
export declare class ElephantRampageLogic {
    private rampages;
    private static readonly RAMPAGE_DAMAGE_MULTIPLIER;
    private static readonly RAMPAGE_DURATION_TURNS;
    /**
     * 화공 피해 입음 → 광폭화 발동 조건 검사
     */
    onFireDamage(elephantUnitId: string, position: HexCoord, baseDamage: number): RampageState | null;
    /**
     * 광폭화 실행 — 주변 6개 인접 헥스 피아식별 없이 타격
     *
     * @returns 피해를 입은 타일 좌표 목록
     */
    executeRampage(elephantUnitId: string): {
        damagedTiles: HexCoord[];
        damagePerTile: number;
    };
    /**
     * 광폭화 상태 확인
     */
    isRampaging(elephantUnitId: string): boolean;
    /**
     * 광폭화 상태 조회
     */
    getRampageState(elephantUnitId: string): RampageState | null;
    /**
     * 광폭화 강제 종료
     */
    calmElephant(elephantUnitId: string): boolean;
    getAllRampaging(): RampageState[];
    reset(): void;
}
//# sourceMappingURL=elephant_rampage_logic.d.ts.map