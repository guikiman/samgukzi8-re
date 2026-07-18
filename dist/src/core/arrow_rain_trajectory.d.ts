/**
 * [B24] 화살 난사 궤적 — Arrow Rain Trajectory
 *
 * ArrowRainTrajectory:
 *   1. 궁병 부대 난사 시 타겟 범위를 구형 그리드로 스캔
 *   2. 지형 고도차(Elevation) 비교
 *   3. 저지대→고지대 데미지 패널티 보정
 *   4. 고지대→저지대 데미지 보너스
 */
export interface ArrowRainTarget {
    readonly tileQ: number;
    readonly tileR: number;
    readonly elevation: number;
    readonly baseDamage: number;
    readonly finalDamage: number;
}
export interface ArrowRainResult {
    readonly attackerId: string;
    readonly attackerElevation: number;
    readonly centerQ: number;
    readonly centerR: number;
    readonly range: number;
    readonly targets: ArrowRainTarget[];
    readonly totalDamage: number;
}
export declare class ArrowRainTrajectory {
    calculateArrowRain(attackerId: string, centerQ: number, centerR: number, attackerElevation: number, range: number, bowSkill: number, elevationMap: Map<string, number>, unitPositions: {
        q: number;
        r: number;
        unitId: string;
        defense: number;
    }[]): ArrowRainResult;
}
//# sourceMappingURL=arrow_rain_trajectory.d.ts.map