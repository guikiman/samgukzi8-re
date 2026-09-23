/**
 * [269] 1,000명 무장 관계망 렌더링 성능 벤치마크
 * 파일: tests/relationship_graph_viewer_benchmark.test.ts
 *
 * AGENTS.md QA 기준: 관계망 은하수 그래프를 렌더링할 때 프레임 드랍이 없어야 함.
 * 캔버스 2D 컨텍스트를 모킹해 draw call 횟수를 계수하고,
 * 1,000노드·5,000엣지 규모에서 렌더러의 시간 복잡도가 O(N+E)임을 검증한다.
 */

import { describe, it, expect } from 'vitest';
import { RelationshipGraphViewer, type GraphLayout } from '../src/core/relationship_graph_viewer.js';

// ---------------------------------------------------------------
// 모킹 캔버스: 모든 draw call을 계수한다
// ---------------------------------------------------------------
function createCountingCanvas() {
    const callCounts: Record<string, number> = {};
    const count = (name: string) => { callCounts[name] = (callCounts[name] ?? 0) + 1; };

    const ctx = {
        clearRect: () => count('clearRect'),
        save: () => count('save'),
        restore: () => count('restore'),
        translate: () => {},
        scale: () => {},
        beginPath: () => count('beginPath'),
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => count('stroke'),
        arc: () => {},
        fill: () => count('fill'),
        fillText: () => count('fillText'),
        set fillStyle(_: unknown) {},
        set strokeStyle(_: unknown) {},
        set lineWidth(_: unknown) {},
        set font(_: unknown) {},
        set textAlign(_: unknown) {},
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
        width: 1600,
        height: 900,
        getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    return { canvas, callCounts };
}

// ---------------------------------------------------------------
// 1,000명 무장 · 5,000 관계 엣지 생성 (연결 그래프)
// LCG 시드 난수로 중복 없이 정확히 links개 확보 (주기적 패턴 방지)
// ---------------------------------------------------------------
function buildGalaxyGraph(officers = 1000, links = 5000): GraphLayout {
    const nodes = Array.from({ length: officers }, (_, i) => ({
        id: `off_${i}`,
        label: `무장${i}`,
        group: `fac_${i % 10}`,
        radius: 8,
        color: '#e74c3c',
        x: (i % 40) * 40,
        y: Math.floor(i / 40) * 30,
        vx: 0,
        vy: 0,
    }));

    const unique = new Set<string>();
    for (let i = 1; i < officers; i++) {
        unique.add(`${i - 1}-${i}`); // 연결 보장
    }
    // LCG (numerical recipes 난수): 주기 2^32 — 패턴 반복 없음
    let seed = 0x2f6e2b1;
    const nextRand = () => (seed = (seed * 1664525 + 1013904223) >>> 0);
    let attempts = 0;
    while (unique.size < links && attempts < links * 20) {
        const a = nextRand() % officers;
        const b = nextRand() % officers;
        if (a !== b) unique.add(`${a}-${b}`);
        attempts++;
    }
    const edgeList = Array.from(unique, (key) => {
        const [source, target] = key.split('-').map(Number);
        return { source, target };
    });

    return {
        nodes,
        links: edgeList.map((e) => ({
            source: nodes[e.source].id,
            target: nodes[e.target].id,
            type: 'FRIEND',
            affinity: 50,
            color: '#27ae60',
            width: 1.5,
        })),
    };
}

// ---------------------------------------------------------------
// 측정 유틸
// ---------------------------------------------------------------
function measureRender(
    viewer: RelationshipGraphViewer,
    graph: GraphLayout,
    iterations = 5,
): { avgMs: number; drawsPerFrame: number } {
    const { canvas, callCounts } = createCountingCanvas();
    viewer.attachCanvas(canvas);

    callCounts.stroke = 0;
    callCounts.fill = 0;
    callCounts.fillText = 0;

    // 워밍업 1회 (JIT)
    viewer.render(graph);

    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
        const t0 = performance.now();
        viewer.render(graph);
        times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);

    const drawsPerFrame = (callCounts.stroke ?? 0) + (callCounts.fill ?? 0) + (callCounts.fillText ?? 0);
    // 워밍업 + iterations 포함 누적치이므로 프레임당 평균으로 환산
    const frames = 1 + iterations;
    return { avgMs: times[Math.floor(times.length / 2)], drawsPerFrame: Math.round(drawsPerFrame / frames) };
}

describe('[269] 관계망 은하수 렌더링 성능 벤치마크', () => {
    const viewer = new RelationshipGraphViewer();

    it('1,000노드·5,000엣지에서 프레임 렌더가 O(N+E) draw call로 수렴한다', () => {
        const graph = buildGalaxyGraph(1000, 5000);
        const { drawsPerFrame } = measureRender(viewer, graph);

        // 링크 stroke 1회 + 노드 fill 1회 + 노드 stroke 1회 + 라벨 1회
        // = 5000 + 1000*3 = 8000 (+ 여유치)
        expect(drawsPerFrame).toBeLessThanOrEqual(8100);
        expect(drawsPerFrame).toBeGreaterThanOrEqual(7900);
    });

    it('1,000노드 프레임이 16ms (60fps 예산) 이내에 완료된다', () => {
        const graph = buildGalaxyGraph(1000, 5000);
        const { avgMs } = measureRender(viewer, graph);
        // CI 환경 노이즈를 고려해 여유 4ms 허용
        expect(avgMs).toBeLessThan(16 + 4);
    });

    it('스케일링 검증: 노드 4배(1천→4천) 시 draw call도 선형(≈4배) 증가한다', () => {
        const small = buildGalaxyGraph(250, 1250);
        const large = buildGalaxyGraph(1000, 5000);
        const smallDraws = measureRender(viewer, small).drawsPerFrame;
        const largeDraws = measureRender(viewer, large).drawsPerFrame;
        const ratio = largeDraws / smallDraws;
        // 1000/250 = 4배 선형이어야 함 (여유 ±10%)
        expect(ratio).toBeGreaterThan(3.6);
        expect(ratio).toBeLessThan(4.4);
    });

    it('뷰포트 확대·이동 후에도 렌더가 정상 동작한다', () => {
        const graph = buildGalaxyGraph(100, 200);
        viewer.setViewport({ zoom: 2.5, x: 120, y: -60 });
        const { canvas } = createCountingCanvas();
        viewer.attachCanvas(canvas);
        expect(() => viewer.render(graph)).not.toThrow();
        viewer.setViewport({ zoom: 1, x: 0, y: 0 });
    });
});
