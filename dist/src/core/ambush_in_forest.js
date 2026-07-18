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
const HEX_DIRECTIONS = [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];
export class AmbushInForest {
    constructor() {
        this.ambushers = new Map();
    }
    /** 숲 타일에 매복 설정 */
    setupAmbush(unitId, q, r) {
        const key = `${q},${r}`;
        if (this.ambushers.has(key))
            return false;
        this.ambushers.set(key, {
            unitId,
            q, r,
            turnsAmbushed: 0,
            revealRange: 1,
        });
        return true;
    }
    /**
     * 적 유닛 이동 시 매복 발동 감지
     *
     * @param enemyQ - 적 이동 후 q
     * @param enemyR - 적 이동 후 r
     * @returns 매복 발동 결과
     */
    detectTrigger(enemyQ, enemyR) {
        // 적 인접 6타일 중 매복이 있는지 확인
        for (const [dq, dr] of HEX_DIRECTIONS) {
            const ambushKey = `${enemyQ + dq},${enemyR + dr}`;
            const ambush = this.ambushers.get(ambushKey);
            if (ambush) {
                // 매복 발동
                this.ambushers.delete(ambushKey);
                return {
                    triggered: true,
                    attackerGetsFirstStrike: true,
                    criticalMultiplier: 1.5,
                    defenderStunned: true,
                    description: '기습! 선제 공격 + 1턴 행동 불능!',
                };
            }
        }
        return null;
    }
    /** 매복 상태 해제 (이동/공격 시) */
    breakAmbush(unitId) {
        for (const [key, amb] of this.ambushers) {
            if (amb.unitId === unitId) {
                this.ambushers.delete(key);
                return true;
            }
        }
        return false;
    }
    /** 매복 상태인 유닛 확인 */
    isAmbushing(unitId) {
        return Array.from(this.ambushers.values()).some(a => a.unitId === unitId);
    }
    /** 전체 매복 정보 */
    getAllAmbushes() {
        return Array.from(this.ambushers.values());
    }
    /** 전장 초기화 */
    clearAll() {
        this.ambushers.clear();
    }
}
//# sourceMappingURL=ambush_in_forest.js.map