/**
 * [Task 26] 병과 상성 연산 가중치 테이블
 *
 * 보병, 기병, 궁병 등 병과 간 상성 시너지 연산.
 */
export type UnitType = "infantry" | "cavalry" | "archer" | "siege";
export declare class UnitAffinityTable {
    private static readonly MATRIX;
    getAffinity(attacker: UnitType, defender: UnitType): number;
}
//# sourceMappingURL=unit_affinity_table.d.ts.map