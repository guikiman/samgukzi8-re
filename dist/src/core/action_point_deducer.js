/**
 * [Task 22] 정교한 무장 내정/전투 행동력(Action Point) 차감기
 *
 * 명령 수행에 필요한 행동력 소모 공식을 바인딩하고
 * 부족할 시 명령 제출을 조기 반려.
 */
const DEFAULT_COST = {
    move: 20,
    attack: 40,
    tactic: 60,
    domestic: 30,
    recruit: 50,
    rest: 0,
};
export class ActionPointDeducer {
    constructor(costTable = DEFAULT_COST) {
        this.costTable = costTable;
    }
    getCost(actionType) {
        return this.costTable[actionType];
    }
    canExecute(currentAp, actionType) {
        return currentAp >= this.costTable[actionType];
    }
    deduct(currentAp, actionType) {
        const cost = this.costTable[actionType];
        if (currentAp < cost)
            return currentAp;
        return currentAp - cost;
    }
}
//# sourceMappingURL=action_point_deducer.js.map