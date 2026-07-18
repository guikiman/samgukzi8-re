/**
 * [B23] 기병 돌격 및 넉백 충돌 역학기 — CavalryChargePhysics
 *
 * 목적: 기병의 전법인 '돌격' 성공 시 대상을 뒤로 밀어내고
 *       밀려난 좌표의 지형/장애물 유무에 따라 2차 타격 적용.
 *
 * 핵심 로직:
 *   1. 돌격 성공 시 적 부대 이동 벡터 반대 방향 1칸 넉백
 *   2. 후방 장애물(성벽/산악/유닛) 시 충돌 기본 피해 50% 추가
 */
const HEX_DIRECTIONS = [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];
export class CavalryChargePhysics {
    /**
     * 돌격 물리 연산
     *
     * @param attackerQ     - 공격자 q
     * @param attackerR     - 공격자 r
     * @param defenderQ     - 방어자 q
     * @param defenderR     - 방어자 r
     * @param chargePower   - 돌격 위력 (무력 × 병과계수)
     * @param terrainMap    - "q,r" → 지형 유형 맵
     * @param unitPositions - "q,r" → unitId 맵
     * @param obstacleTypes - "q,r" → ObstacleType 맵 (성벽 등)
     */
    calculateCharge(attackerQ, attackerR, defenderQ, defenderR, chargePower, terrainMap, unitPositions, obstacleTypes) {
        // 1. 이동 방향 벡터 계산
        const dq = defenderQ - attackerQ;
        const dr = defenderR - attackerR;
        // 넉백 방향 = (공격자 → 방어자) 방향으로 1칸 더
        const knockQ = defenderQ + dq;
        const knockR = defenderR + dr;
        const knockKey = `${knockQ},${knockR}`;
        // 2. 넉백 목표 지형/장애물 확인
        const obstacle = obstacleTypes.get(knockKey) ?? 'NONE';
        const hasUnit = unitPositions.has(knockKey);
        const hasWall = obstacle === 'WALL';
        const hasMountain = terrainMap.get(knockKey) === 'MOUNTAIN';
        let collisionObstacle = 'NONE';
        let collisionBonusDamage = 0;
        let defenderStunned = false;
        if (hasUnit) {
            collisionObstacle = 'UNIT';
            collisionBonusDamage = Math.floor(chargePower * 0.5);
            defenderStunned = true;
        }
        else if (hasWall) {
            collisionObstacle = 'WALL';
            collisionBonusDamage = Math.floor(chargePower * 0.7);
            defenderStunned = true;
        }
        else if (hasMountain) {
            collisionObstacle = 'MOUNTAIN';
            collisionBonusDamage = Math.floor(chargePower * 0.5);
            defenderStunned = true;
        }
        // 3. 최종 데미지
        const baseDamage = chargePower;
        const totalDamage = baseDamage + collisionBonusDamage;
        return {
            chargeSuccess: true,
            knockbackTarget: { q: knockQ, r: knockR },
            hasCollision: collisionObstacle !== 'NONE',
            collisionObstacle,
            collisionBonusDamage,
            totalDamage,
            defenderStunned,
        };
    }
}
//# sourceMappingURL=cavalry_charge_physics.js.map