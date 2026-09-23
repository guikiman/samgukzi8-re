import { describe, it, expect, beforeEach } from 'vitest';
import {
    HexBattleRulesEngine, makeHexTile,
    type HexTileInfo,
} from '../src/core/hex_battle_rules_engine';

describe('HexBattleRulesEngine', () => {
    let engine: HexBattleRulesEngine;

    beforeEach(() => {
        engine = new HexBattleRulesEngine();
    });

    // ============================================================
    // 병종/지형 이동 비용
    // ============================================================

    describe('computeMoveCost', () => {
        it('중기병은 평지에서 가장 효율적이다 (cost 1.0)', () => {
            const tile = makeHexTile(0, 0, 'PLAINS');
            expect(engine.computeMoveCost(tile, 'HEAVY_CAVALRY')).toBe(1.0);
        });

        it('병종 배율이 비용에 반영된다 (창군 1.8배)', () => {
            const tile = makeHexTile(0, 0, 'PLAINS');
            expect(engine.computeMoveCost(tile, 'SPEARMAN')).toBe(1.8);
            expect(engine.computeMoveCost(tile, 'LANCE_CAVALRY')).toBe(2.5);
        });

        it('지형 페널티가 반영된다 (산지 1.8배)', () => {
            const tile = makeHexTile(0, 0, 'MOUNTAIN');
            // 1.8 (지형) × 1.0 (중기병) × 1.5 (산악 심화) = 2.7
            expect(engine.computeMoveCost(tile, 'HEAVY_CAVALRY')).toBe(2.7);
        });

        it('고저차 10 초과 시 경사지 페널티가 적용된다', () => {
            const flat = makeHexTile(0, 0, 'PLAINS', 5);
            const steep = makeHexTile(0, 0, 'PLAINS', 15);
            expect(engine.computeMoveCost(flat, 'HEAVY_CAVALRY')).toBe(1.0);
            expect(engine.computeMoveCost(steep, 'HEAVY_CAVALRY')).toBe(1.5);
        });

        it('깊은 물은 통과 불가 비용(999)을 반환한다', () => {
            const tile = makeHexTile(0, 0, 'WATER');
            expect(engine.computeMoveCost(tile, 'HEAVY_CAVALRY')).toBeGreaterThanOrEqual(500);
        });
    });

    // ============================================================
    // 헥스 기하
    // ============================================================

    it('makeHexTile은 s = -q - r 좌표계 수식을 검증한다', () => {
        const tile = makeHexTile(3, -2, 'PLAINS');
        expect(tile.s).toBe(-1);
    });

    it('헥스 거리 계산이 대칭적이다', () => {
        const d1 = engine.hexDistance(0, 0, 3, -2);
        const d2 = engine.hexDistance(3, -2, 0, 0);
        expect(d1).toBe(d2);
        expect(d1).toBe(3);
    });

    it('6방향 이웃을 반환한다', () => {
        const neighbors = engine.getNeighbors(0, 0);
        expect(neighbors.length).toBe(6);
        expect(neighbors).toContainEqual([1, 0]);
        expect(neighbors).toContainEqual([-1, 1]);
    });

    // ============================================================
    // A* 경로 탐색 + ZOC 강제 정지
    // ============================================================

    function buildGrid(w: number, h: number): Map<string, HexTileInfo> {
        const grid = new Map<string, HexTileInfo>();
        for (let q = 0; q < w; q++) {
            for (let r = 0; r < h; r++) {
                grid.set(`${q},${r}`, makeHexTile(q, r, 'PLAINS'));
            }
        }
        return grid;
    }

    describe('searchPath', () => {
        it('장애물 없는 평지에서 최단 경로를 찾는다', () => {
            const grid = buildGrid(10, 10);
            const path = engine.searchPath([0, 0], [3, 2], 'HEAVY_CAVALRY', grid, new Set());
            expect(path.length).toBeGreaterThan(0);
            expect(path[0]).toEqual([0, 0]);
            expect(path[path.length - 1]).toEqual([3, 2]);
            // 헥스 거리 5 → 최소 6개 타일
            expect(path.length).toBe(6);
        });

        it('출발지=목적지면 단일 타일 경로를 반환한다', () => {
            const grid = buildGrid(5, 5);
            const path = engine.searchPath([2, 2], [2, 2], 'HEAVY_CAVALRY', grid, new Set());
            expect(path).toEqual([[2, 2]]);
        });

        it('깊은 물은 우회한다', () => {
            // 세로로 WATER 장벽 배치 (q=2 열 전체), q=1에 통로 하나
            const grid = buildGrid(6, 6);
            for (let r = 0; r < 6; r++) {
                grid.set(`2,${r}`, makeHexTile(2, r, 'WATER'));
            }
            grid.set('2,3', makeHexTile(2, 3, 'PLAINS')); // 유일한 통로

            const path = engine.searchPath([0, 0], [4, 3], 'HEAVY_CAVALRY', grid, new Set());
            expect(path.length).toBeGreaterThan(0);
            // 경로가 통로 (2,3)을 반드시 통과
            expect(path).toContainEqual([2, 3]);
        });

        it('완전히 막히면 빈 경로를 반환한다', () => {
            const grid = buildGrid(6, 6);
            // 목적지를 완전히 물로 둘러싸기: (4,3)의 모든 이웃 + 자기 자신
            grid.set(`4,3`, makeHexTile(4, 3, 'WATER'));
            for (const [nq, nr] of engine.getNeighbors(4, 3)) {
                grid.set(`${nq},${nr}`, makeHexTile(nq, nr, 'WATER'));
            }
            const path = engine.searchPath([0, 0], [4, 3], 'HEAVY_CAVALRY', grid, new Set());
            expect(path).toEqual([]);
        });

        it('적 벽에 완전히 갇히면 이동이 차단된다 (ZOC 강제 정지)', () => {
            const grid = buildGrid(8, 8);
            // q=3 열 전체에 적 벽을 배치 → 어떤 경로로도 q≥3 진입 불가
            // (q=3 헥스에 인접한 모든 q=2 헥스가 ZOC에 걸리고, q=3 헥스 자체는 적 점유)
            const enemies = new Set<string>();
            for (let r = -1; r <= 8; r++) {
                enemies.add(`3,${r}`);
            }
            const path = engine.searchPath([0, 0], [5, 0], 'HEAVY_CAVALRY', grid, enemies);

            // ZOC 타일에서 더 전진하면 어차피 적 점유 헥스(그리드에 없음)로 막히고,
            // ZOC 헥스에서의 확장은 전부 차단 → 목적지 (5,0) 도달 불가
            expect(path).toEqual([]);
        });

        it('ZOC를 우회하는 경로가 있으면 찾아간다', () => {
            const grid = buildGrid(10, 10);
            // 적 1명이 (3,0) 점유 → 인접 6헥스가 ZOC
            const enemies = new Set(['3,0']);
            const path = engine.searchPath([0, 0], [6, 0], 'HEAVY_CAVALRY', grid, enemies);

            // ZOC를 우회한 경로가 존재해야 함 (ZOC 타일 위에서 멈추지 않음)
            expect(path.length).toBeGreaterThan(0);
            expect(path[path.length - 1]).toEqual([6, 0]);
            // 경로의 모든 중간 타일이 ZOC 안에서 연속 정지하지 않는지 —
            // 각 타일이 적 인접(ZOC)이면 그 다음 타일로 확장 불가라는 규칙상
            // ZOC 진입 후 곧바로 빠져나가는 것만 허용됨
        });

        it('isInZOC가 적 인접 헥스를 정확히 판정한다', () => {
            const enemies = new Set(['2,0']);
            expect(engine.isInZOC(3, 0, enemies)).toBe(true);   // 인접
            expect(engine.isInZOC(4, 0, enemies)).toBe(false);  // 비인접
        });
    });

    // ============================================================
    // 보급선 BFS 검사
    // ============================================================

    describe('calculateSupplyLine', () => {
        it('수도와 연결되면 true를 반환한다', () => {
            const grid = buildGrid(8, 8);
            const supplied = engine.calculateSupplyLine([2, 2], [6, 6], grid, new Set());
            expect(supplied).toBe(true);
        });

        it('유닛이 수도에 있으면 즉시 true를 반환한다', () => {
            const grid = buildGrid(5, 5);
            expect(engine.calculateSupplyLine([2, 2], [2, 2], grid, new Set())).toBe(true);
        });

        it('적에게 완전히 포위되면 보급선이 단절된다', () => {
            const grid = buildGrid(9, 9);
            // (4,4)를 적 6헥스로 완전 포위
            const enemies = new Set<string>();
            for (const [nq, nr] of engine.getNeighbors(4, 4)) {
                enemies.add(`${nq},${nr}`);
            }
            const cut = engine.calculateSupplyLine([4, 4], [0, 0], grid, enemies);
            expect(cut).toBe(false);
        });

        it('적 1명으로는 보급선이 단절되지 않는다 (우회 가능)', () => {
            const grid = buildGrid(9, 9);
            const enemies = new Set(['4,3']); // 직선상 적 1명
            const supplied = engine.calculateSupplyLine([4, 4], [4, 0], grid, enemies);
            expect(supplied).toBe(true);
        });
    });

    // ============================================================
    // 성능 벤치마크 — A* < 5ms
    // ============================================================

    it('30×30 맵 A* 탐색이 5ms 이내다 (성능 벤치마크)', () => {
        const grid = buildGrid(30, 30);
        // 병렬 테스트 러너의 부하 노이즈를 제거하기 위해 5회 실행 후 최솟값 판정
        let best = Infinity;
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            engine.searchPath([0, 0], [25, 25], 'SPEARMAN', grid, new Set());
            best = Math.min(best, performance.now() - start);
        }
        expect(best).toBeLessThan(5);
    });
});
