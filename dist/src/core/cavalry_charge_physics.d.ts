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
export interface HexCoord {
    readonly q: number;
    readonly r: number;
}
export type ObstacleType = 'WALL' | 'MOUNTAIN' | 'UNIT' | 'NONE';
export interface ChargeResult {
    readonly chargeSuccess: boolean;
    readonly knockbackTarget: HexCoord;
    readonly hasCollision: boolean;
    readonly collisionObstacle: ObstacleType;
    readonly collisionBonusDamage: number;
    readonly totalDamage: number;
    readonly defenderStunned: boolean;
}
export declare class CavalryChargePhysics {
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
    calculateCharge(attackerQ: number, attackerR: number, defenderQ: number, defenderR: number, chargePower: number, terrainMap: Map<string, string>, unitPositions: Map<string, string>, obstacleTypes: Map<string, ObstacleType>): ChargeResult;
}
//# sourceMappingURL=cavalry_charge_physics.d.ts.map