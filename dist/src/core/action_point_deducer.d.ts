/**
 * [Task 22] 정교한 무장 내정/전투 행동력(Action Point) 차감기
 *
 * 명령 수행에 필요한 행동력 소모 공식을 바인딩하고
 * 부족할 시 명령 제출을 조기 반려.
 */
export interface ActionCostTable {
    readonly move: number;
    readonly attack: number;
    readonly tactic: number;
    readonly domestic: number;
    readonly recruit: number;
    readonly rest: number;
}
export declare class ActionPointDeducer {
    private costTable;
    constructor(costTable?: ActionCostTable);
    getCost(actionType: keyof ActionCostTable): number;
    canExecute(currentAp: number, actionType: keyof ActionCostTable): boolean;
    deduct(currentAp: number, actionType: keyof ActionCostTable): number;
}
//# sourceMappingURL=action_point_deducer.d.ts.map