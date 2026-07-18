/**
 * [Task 99] 헥스 범위 인디케이터 — HexRangeIndicator
 *
 * 목적: 이동 가능 범위, 공격 범위, 스킬 범위 등
 *       헥스 맵 위의 다양한 범위를 시각적 표시.
 *
 * 핵심 로직:
 *   1. BFS 기반 이동 가능 타일 계산
 *   2. 범위 타입별 색상/패턴
 */

export type RangeType = "move" | "attack" | "skill" | "sight" | "influence";

export interface RangeTile {
  readonly q: number;
  readonly r: number;
  readonly cost: number;
}

const RANGE_COLORS: Record<RangeType, [number, number, number, number]> = {
  move: [0, 0.6, 1, 0.4],
  attack: [1, 0.2, 0.2, 0.5],
  skill: [0.8, 0.4, 1, 0.4],
  sight: [0.6, 0.8, 1, 0.2],
  influence: [1, 0.8, 0.2, 0.3],
};

export class HexRangeIndicator {
  private tiles = new Map<string, RangeTile>();

  /**
   * BFS로 이동 가능 범위 계산
   */
  computeMoveRange(
    originQ: number,
    originR: number,
    maxMove: number,
    getCost: (q: number, r: number) => number,
  ): RangeTile[] {
    const result: RangeTile[] = [];
    const visited = new Set<string>();
    const queue: { q: number; r: number; cost: number }[] = [
      { q: originQ, r: originR, cost: 0 },
    ];

    visited.add(`${originQ},${originR}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.cost > 0) {
        result.push({ q: current.q, r: current.r, cost: current.cost });
      }

      if (current.cost >= maxMove) continue;

      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = current.q + dq;
        const nr = current.r + dr;
        const key = `${nq},${nr}`;
        if (visited.has(key)) continue;

        const tileCost = getCost(nq, nr);
        const newCost = current.cost + tileCost;
        if (newCost <= maxMove) {
          visited.add(key);
          queue.push({ q: nq, r: nr, cost: newCost });
        }
      }
    }

    return result;
  }

  /**
   * 범위 타일 설정
   */
  setRange(tiles: RangeTile[]): void {
    this.tiles.clear();
    for (const t of tiles) {
      this.tiles.set(`${t.q},${t.r}`, t);
    }
  }

  /**
   * 범위 초기화
   */
  clearRange(): void {
    this.tiles.clear();
  }

  /**
   * 타일의 범위 색상 조회
   */
  getColor(q: number, r: number, type: RangeType): [number, number, number, number] | null {
    const tile = this.tiles.get(`${q},${r}`);
    if (!tile) return null;
    return RANGE_COLORS[type];
  }
}

const HEX_DIRECTIONS: [number, number][] = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1],
];
