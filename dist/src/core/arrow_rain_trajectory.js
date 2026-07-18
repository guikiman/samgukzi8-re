/**
 * [B24] 화살 난사 궤적 — Arrow Rain Trajectory
 *
 * ArrowRainTrajectory:
 *   1. 궁병 부대 난사 시 타겟 범위를 구형 그리드로 스캔
 *   2. 지형 고도차(Elevation) 비교
 *   3. 저지대→고지대 데미지 패널티 보정
 *   4. 고지대→저지대 데미지 보너스
 */
export class ArrowRainTrajectory {
    calculateArrowRain(attackerId, centerQ, centerR, attackerElevation, range, bowSkill, elevationMap, unitPositions) {
        const targets = [];
        let totalDamage = 0;
        const baseDamage = 12 + Math.floor(bowSkill / 3);
        for (const pos of unitPositions) {
            const dist = Math.max(Math.abs(pos.q - centerQ), Math.abs(pos.r - centerR), Math.abs((pos.q - centerQ) + (pos.r - centerR)));
            if (dist > range)
                continue;
            const targetElev = elevationMap.get(`${pos.q},${pos.r}`) ?? attackerElevation;
            const elevationDiff = attackerElevation - targetElev;
            let elevationMod = 1.0;
            if (elevationDiff > 0) {
                elevationMod = 1.0 + elevationDiff * 0.05;
            }
            else if (elevationDiff < 0) {
                elevationMod = 1.0 + elevationDiff * 0.03;
            }
            elevationMod = Math.max(0.5, Math.min(2.0, elevationMod));
            const distancePenalty = Math.max(0.5, 1.0 - (dist * 0.1));
            const defenseMod = 1.0 - (pos.defense / 200);
            const finalDamage = Math.max(1, Math.floor(baseDamage * elevationMod * distancePenalty * defenseMod) + Math.floor(Math.random() * 5));
            targets.push({
                tileQ: pos.q, tileR: pos.r, elevation: targetElev,
                baseDamage, finalDamage,
            });
            totalDamage += finalDamage;
        }
        return { attackerId, attackerElevation, centerQ, centerR, range, targets, totalDamage };
    }
}
//# sourceMappingURL=arrow_rain_trajectory.js.map