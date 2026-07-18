/**
 * [Task 82] 헥스 경로 미리보기 — HexPathPreview
 *
 * 목적: 유닛 이동 경로를 시각적으로 미리보기하여
 *       각 타일의 이동 비용과 최종 경로 표시.
 *
 * 핵심 로직:
 *   1. 경로 좌표 리스트 → 타일 하이라이트
 *   2. 이동 비용별 색상 그라데이션
 */

export interface PathStep {
  readonly q: number;
  readonly r: number;
  readonly cost: number;
  readonly cumulativeCost: number;
}

export class HexPathPreview {
  private steps: PathStep[] = [];
  private readonly maxCost: number;

  constructor(maxCost = 100) {
    this.maxCost = maxCost;
  }

  /**
   * 경로 설정
   */
  setPath(path: PathStep[]): void {
    this.steps = path;
  }

  /**
   * 경로 초기화
   */
  clearPath(): void {
    this.steps = [];
  }

  /**
   * 특정 좌표의 경로 비용 조회
   */
  getCostAt(q: number, r: number): number | null {
    const step = this.steps.find((s) => s.q === q && s.r === r);
    return step ? step.cumulativeCost : null;
  }

  /**
   * 경로의 총 비용
   */
  get totalCost(): number {
    if (this.steps.length === 0) return 0;
    return this.steps[this.steps.length - 1].cumulativeCost;
  }

  /**
   * 경로 길이
   */
  get length(): number {
    return this.steps.length;
  }

  /**
   * 경로의 각 단계별 색상 (비용 기반 그라데이션)
   */
  getPathColors(maxVisibleCost: number): Map<string, [number, number, number, number]> {
    const colors = new Map<string, [number, number, number, number]>();
    for (const step of this.steps) {
      const t = Math.min(step.cumulativeCost / maxVisibleCost, 1);
      colors.set(`${step.q},${step.r}`, [
        0.2 + t * 0.8,
        0.8 - t * 0.6,
        0.4,
        0.6,
      ]);
    }
    return colors;
  }
}
