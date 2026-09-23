/**
 * [269] 관계망 뷰어 마우스 인터랙션 테스트
 * 파일: tests/relationship_graph_viewer_interaction.test.ts
 *
 * 휠 줌의 마우스 고정 원리, 드래그 팬, 클릭 판정(드래그 무시), 노드 히트테스트,
 * detach 후 이벤트 정리를 검증한다. 이벤트는 핸들러를 직접 호출해 시뮬레이션한다.
 */

import { describe, it, expect } from 'vitest';
import { RelationshipGraphViewer, type GraphLayout } from '../src/core/relationship_graph_viewer.js';

function makeGraph(): GraphLayout {
    return {
        nodes: [
            { id: 'a', label: 'A', group: 'g', radius: 8, color: '#fff', x: 100, y: 100, vx: 0, vy: 0 },
            { id: 'b', label: 'B', group: 'g', radius: 8, color: '#fff', x: 300, y: 100, vx: 0, vy: 0 },
        ],
        links: [{ source: 'a', target: 'b', type: 'FRIEND', affinity: 50, color: '#27ae60', width: 1.5 }],
    };
}

/** 이벤트 리스너를 기록하는 모킹 캔버스 */
function makeMockCanvas() {
    const listeners = new Map<string, Array<(e: unknown) => void>>();
    const canvas = {
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        addEventListener: (type: string, fn: (e: unknown) => void) => {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type)!.push(fn);
        },
        removeEventListener: (type: string, fn: (e: unknown) => void) => {
            const arr = listeners.get(type)?.filter((f) => f !== fn) ?? [];
            listeners.set(type, arr);
        },
    } as unknown as HTMLCanvasElement;
    const fire = (type: string, e: unknown) => {
        for (const fn of listeners.get(type) ?? []) fn(e);
    };
    const listenerCount = (type: string) => (listeners.get(type)?.length ?? 0);
    return { canvas, fire, listenerCount };
}

const mouseEvent = (clientX: number, clientY: number, button = 0, deltaY = 0) =>
    ({ clientX, clientY, button, deltaY, preventDefault: () => {} });

describe('[269] RelationshipGraphViewer 마우스 인터랙션', () => {
    it('휠 줌 시 마우스 지점 아래의 월드 좌표가 고정된다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        const graph = makeGraph();
        viewer.attachInteraction(canvas, () => graph);

        // 초기: 마우스 (200,100) 지점의 월드 좌표 = (200,100) (viewport 0,0, zoom 1)
        viewer.setViewport({ x: 0, y: 0, zoom: 1 });
        fire('wheel', mouseEvent(200, 100, 0, -120)); // 줌 인 1.15배

        const vp = viewer['viewport'];
        expect(vp.zoom).toBeCloseTo(1.15);
        // 고정 검증: (m - vp) / zoom 이 줌 전 월드 좌표 (200,100)을 유지
        expect((200 - vp.x) / vp.zoom).toBeCloseTo(200);
        expect((100 - vp.y) / vp.zoom).toBeCloseTo(100);
    });

    it('휠 줌은 0.2~8배 범위로 클램프된다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        const graph = makeGraph();
        viewer.attachInteraction(canvas, () => graph);

        for (let i = 0; i < 40; i++) fire('wheel', mouseEvent(400, 300, 0, -120)); // 계속 줌 인
        expect(viewer['viewport'].zoom).toBeLessThanOrEqual(8);

        for (let i = 0; i < 80; i++) fire('wheel', mouseEvent(400, 300, 0, 120)); // 계속 줌 아웃
        expect(viewer['viewport'].zoom).toBeGreaterThanOrEqual(0.2);
    });

    it('드래그하면 뷰포트가 이동(팬)한다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        const graph = makeGraph();
        viewer.attachInteraction(canvas, () => graph);
        viewer.setViewport({ x: 0, y: 0, zoom: 1 });

        fire('mousedown', mouseEvent(100, 100));
        fire('mousemove', mouseEvent(160, 140));
        expect(viewer['viewport'].x).toBe(60);
        expect(viewer['viewport'].y).toBe(40);
    });

    it('클릭(이동 없음)은 노드 히트 판정을 콜백으로 전달한다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        const graph = makeGraph();
        const clicked: Array<string | null> = [];
        viewer.attachInteraction(canvas, () => graph, (id) => clicked.push(id));
        viewer.setViewport({ x: 0, y: 0, zoom: 1 });

        // 노드 a (100,100, r=8) 근처 클릭
        fire('mousedown', mouseEvent(103, 102));
        fire('mouseup', mouseEvent(103, 102));
        expect(clicked).toEqual(['a']);

        // 어느 노드도 아닌 지점 클릭 → null
        fire('mousedown', mouseEvent(500, 500));
        fire('mouseup', mouseEvent(500, 500));
        expect(clicked[1]).toBeNull();
    });

    it('드래그 후 mouseup은 클릭으로 오인하지 않는다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        const graph = makeGraph();
        const clicked: Array<string | null> = [];
        viewer.attachInteraction(canvas, () => graph, (id) => clicked.push(id));
        viewer.setViewport({ x: 0, y: 0, zoom: 1 });

        fire('mousedown', mouseEvent(103, 102));
        fire('mousemove', mouseEvent(163, 142)); // 50px 이상 드래그
        fire('mouseup', mouseEvent(163, 142));
        expect(clicked).toEqual([]); // 팬 제스처 — 클릭 아님
    });

    it('detach하면 모든 리스너가 제거되어 이벤트가 무시된다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire, listenerCount } = makeMockCanvas();
        const graph = makeGraph();
        const detach = viewer.attachInteraction(canvas, () => graph);

        expect(listenerCount('wheel')).toBe(1);
        expect(listenerCount('mousedown')).toBe(1);
        detach();
        expect(listenerCount('wheel')).toBe(0);
        expect(listenerCount('mousedown')).toBe(0);

        // detach 후 이벤트는 뷰포트를 바꾸지 못함
        const before = viewer['viewport'].zoom;
        fire('wheel', mouseEvent(400, 300, 0, -120));
        expect(viewer['viewport'].zoom).toBe(before);
    });

    it('히트 판정은 월드 노드 반경과 화면 10px 중 큰 값을 쓴다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        const graph = makeGraph();
        const clicked: Array<string | null> = [];
        viewer.attachInteraction(canvas, () => graph, (id) => clicked.push(id));
        viewer.setViewport({ x: 0, y: 0, zoom: 4 });

        // zoom 4: 노드 a 월드(100,100) = 화면(400,400). 노드 반경 8(월드) = 화면 32px.
        // 화면 20px(월드 5px) 떨어진 클릭 → 노드 반경 8 > 5 → 히트
        fire('mousedown', mouseEvent(420, 400));
        fire('mouseup', mouseEvent(420, 400));
        expect(clicked).toEqual(['a']);

        // 화면 60px(월드 15px) 떨어진 클릭 → 15 > 8 → 미스
        fire('mousedown', mouseEvent(460, 400));
        fire('mouseup', mouseEvent(460, 400));
        expect(clicked[1]).toBeNull();
    });

    it('저줌에서도 화면 10px 최소 히트 반경이 보장된다', () => {
        const viewer = new RelationshipGraphViewer();
        const { canvas, fire } = makeMockCanvas();
        // 반경 2px의 작은 노드 — 저줌에서는 화면 10px 반경이 지배
        const tiny: GraphLayout = {
            nodes: [
                { id: 't', label: 'T', group: 'g', radius: 2, color: '#fff', x: 100, y: 100, vx: 0, vy: 0 },
            ],
            links: [],
        };
        const clicked: Array<string | null> = [];
        viewer.attachInteraction(canvas, () => tiny, (id) => clicked.push(id));
        viewer.setViewport({ x: 0, y: 0, zoom: 1 });

        // 노드 중심에서 화면 8px(월드 8px) — 노드 반경 2 < 화면 최소 10 → 히트
        fire('mousedown', mouseEvent(108, 100));
        fire('mouseup', mouseEvent(108, 100));
        expect(clicked).toEqual(['t']);
    });
});
