/**
 * [Task 28] 부상병 및 탈영병 연산 블록
 *
 * 피해 병력의 일정 비율을 '부상병'으로 세부 분류해
 * 도시 거점으로 재분배.
 */
export interface CasualtyBreakdown {
    readonly dead: number;
    readonly wounded: number;
    readonly deserted: number;
}
export declare class WoundedDesertionSystem {
    compute(totalLoss: number, morale: number, loyalty: number): CasualtyBreakdown;
}
//# sourceMappingURL=wounded_desertion_system.d.ts.map