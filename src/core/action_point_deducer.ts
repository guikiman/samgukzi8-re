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

const DEFAULT_COST: ActionCostTable = {
  move: 20,
  attack: 40,
  tactic: 60,
  domestic: 30,
  recruit: 50,
  rest: 0,
};

export class ActionPointDeducer {
  private costTable: ActionCostTable;

  constructor(costTable: ActionCostTable = DEFAULT_COST) {
    this.costTable = costTable;
  }

  getCost(actionType: keyof ActionCostTable): number {
    return this.costTable[actionType];
  }

  canExecute(currentAp: number, actionType: keyof ActionCostTable): boolean {
    return currentAp >= this.costTable[actionType];
  }

  deduct(currentAp: number, actionType: keyof ActionCostTable): number {
    const cost = this.costTable[actionType];
    if (currentAp < cost) return currentAp;
    return currentAp - cost;
  }
}
