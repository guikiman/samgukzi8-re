/**
 * [B8] 공성 장비 물리 타격 연산기 — SiegePhysicsCalculations
 *
 * 목적: 공성 탑, 충차, 투석기가 성벽 및 성문 타일을 타격할 때의 물리적 내구도 감쇄 연산.
 *
 * 핵심 로직:
 *   1. 충차(BATTERING_RAM) → 성문 인접 타일에서 방어력 무시 고정 데미지
 *   2. 투석기(CATAPULT/TREBUCHET) → 산악 지형 보정 사거리 증가
 */
const WEAPON_STATS = {
    CATAPULT: { baseDamage: 40, range: 3, ignoreDefense: false, cost: 800 },
    RAMP: { baseDamage: 5, range: 0, ignoreDefense: false, cost: 300 },
    BATTERING_RAM: { baseDamage: 60, range: 1, ignoreDefense: true, cost: 1000 },
    SIEGE_TOWER: { baseDamage: 15, range: 1, ignoreDefense: false, cost: 600 },
    TREBUCHET: { baseDamage: 80, range: 5, ignoreDefense: false, cost: 1500 },
};
export class SiegePhysicsCalculations {
    /**
     * 공성 병기 타격 데미지 계산
     *
     * @param weaponType   - 공성 병기 종류
     * @param targetType   - 목표 타입 (성문/성벽)
     * @param wallDefense  - 성벽 방어력 (0~100)
     * @param isMountain   - 공격자 위치가 산악 지형인지
     * @param currentDur   - 현재 성벽/성문 내구도
     */
    calculateHit(weaponType, targetType, wallDefense, isMountain, currentDur) {
        const stats = WEAPON_STATS[weaponType];
        // 기본 데미지
        let baseDamage = stats.baseDamage;
        // 방어력 적용 (BATTERING_RAM은 방어력 무시)
        if (!stats.ignoreDefense) {
            const defenseReduction = Math.min(0.8, wallDefense / 100);
            baseDamage = Math.floor(baseDamage * (1 - defenseReduction * 0.5));
        }
        // 산악 지형 보정: 투석기/트레뷰셋 사거리 증가
        const terrainRangeBonus = (isMountain && (weaponType === 'CATAPULT' || weaponType === 'TREBUCHET'))
            ? 2
            : 0;
        // 성문(GATE) 타격 시 데미지 1.5배
        const isGate = targetType === 'GATE';
        const finalDamage = isGate
            ? Math.floor(baseDamage * 1.5)
            : baseDamage;
        return {
            weaponType,
            targetType,
            baseDamage: stats.baseDamage,
            terrainRangeBonus,
            finalDamage: Math.min(finalDamage, currentDur),
            isGate,
            durabilityRemaining: Math.max(0, currentDur - finalDamage),
        };
    }
    /** 공성 병기 능력치 조회 */
    getWeaponStats(weaponType) {
        return { ...WEAPON_STATS[weaponType] };
    }
}
//# sourceMappingURL=siege_physics_calculations.js.map