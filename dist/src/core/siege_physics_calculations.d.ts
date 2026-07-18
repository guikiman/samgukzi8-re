/**
 * [B8] 공성 장비 물리 타격 연산기 — SiegePhysicsCalculations
 *
 * 목적: 공성 탑, 충차, 투석기가 성벽 및 성문 타일을 타격할 때의 물리적 내구도 감쇄 연산.
 *
 * 핵심 로직:
 *   1. 충차(BATTERING_RAM) → 성문 인접 타일에서 방어력 무시 고정 데미지
 *   2. 투석기(CATAPULT/TREBUCHET) → 산악 지형 보정 사거리 증가
 */
export type SiegeWeaponType = 'CATAPULT' | 'RAMP' | 'BATTERING_RAM' | 'SIEGE_TOWER' | 'TREBUCHET';
export type WallTargetType = 'GATE' | 'WALL';
export interface SiegeHitResult {
    readonly weaponType: SiegeWeaponType;
    readonly targetType: WallTargetType;
    readonly baseDamage: number;
    readonly terrainRangeBonus: number;
    readonly finalDamage: number;
    readonly isGate: boolean;
    readonly durabilityRemaining: number;
}
export declare class SiegePhysicsCalculations {
    /**
     * 공성 병기 타격 데미지 계산
     *
     * @param weaponType   - 공성 병기 종류
     * @param targetType   - 목표 타입 (성문/성벽)
     * @param wallDefense  - 성벽 방어력 (0~100)
     * @param isMountain   - 공격자 위치가 산악 지형인지
     * @param currentDur   - 현재 성벽/성문 내구도
     */
    calculateHit(weaponType: SiegeWeaponType, targetType: WallTargetType, wallDefense: number, isMountain: boolean, currentDur: number): SiegeHitResult;
    /** 공성 병기 능력치 조회 */
    getWeaponStats(weaponType: SiegeWeaponType): {
        baseDamage: number;
        range: number;
        ignoreDefense: boolean;
        cost: number;
    };
}
//# sourceMappingURL=siege_physics_calculations.d.ts.map