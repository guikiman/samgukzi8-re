/**
 * [Task 26] 병과 상성 연산 가중치 테이블
 *
 * 보병, 기병, 궁병 등 병과 간 상성 시너지 연산.
 */

export type UnitType = "infantry" | "cavalry" | "archer" | "siege";

export class UnitAffinityTable {
  private static readonly MATRIX: Record<UnitType, Record<UnitType, number>> = {
    infantry: { infantry: 0, cavalry: -0.2, archer: 0.15, siege: 0.1 },
    cavalry: { infantry: 0.2, cavalry: 0, archer: -0.15, siege: 0.25 },
    archer: { infantry: -0.1, cavalry: 0.15, archer: 0, siege: -0.2 },
    siege: { infantry: -0.1, cavalry: -0.2, archer: 0.15, siege: 0 },
  };

  getAffinity(attacker: UnitType, defender: UnitType): number {
    return UnitAffinityTable.MATRIX[attacker][defender];
  }
}
