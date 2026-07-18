/**
 * [Task 28] 부상병 및 탈영병 연산 블록
 *
 * 피해 병력의 일정 비율을 '부상병'으로 세부 분류해
 * 도시 거점으로 재분배.
 */
export class WoundedDesertionSystem {
    compute(totalLoss, morale, loyalty) {
        const deadRatio = 0.3 + (1 - morale / 100) * 0.2;
        const desertRatio = Math.max(0, 0.1 - loyalty * 0.001);
        const woundedRatio = 1 - deadRatio - desertRatio;
        return {
            dead: Math.floor(totalLoss * deadRatio),
            wounded: Math.floor(totalLoss * woundedRatio),
            deserted: Math.floor(totalLoss * desertRatio),
        };
    }
}
//# sourceMappingURL=wounded_desertion_system.js.map