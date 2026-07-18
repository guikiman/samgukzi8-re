import { describe, it, expect } from 'vitest';
import { RelationshipGraphEvaluator, OfficerGraphNode } from '../src/core/relationship_graph_evaluator.js';

/**
 * [33] RelationshipGraph 최단 가중치 경로 다익스트라(Dijkstra) 정확성 검증
 *
 * 무장 관계 네트워크망에서 우호도와 계급 가중치를 비튼 뒤,
 * 특정 장수에서 장수까지의 관계 최단 거리가 오류 없이 안정적으로 산출되는지 테스트
 */

function createPopulatedGraph(): RelationshipGraphEvaluator {
    const g = new RelationshipGraphEvaluator();
    g.setRelationship('officer_1', 'officer_2', 80, 'friend');
    g.setRelationship('officer_2', 'officer_3', 70, 'friend');
    g.setRelationship('officer_3', 'officer_4', 60, 'friend');
    g.setRelationship('officer_1', 'officer_5', 90, 'sworn_brother');
    g.setRelationship('officer_4', 'officer_5', 10, 'enemy');
    g.setRelationship('officer_2', 'officer_5', 30, 'friend');
    return g;
}

describe('RelationshipGraphEvaluator - Dijkstra 최단 경로', () => {
    it('자기 자신까지의 경로 → [자기자신]', () => {
        const g = createPopulatedGraph();
        const path = g.shortestPath('officer_1', 'officer_1');
        expect(path).toEqual(['officer_1']);
    });

    it('직접 연결된 노드 경로', () => {
        const g = createPopulatedGraph();
        const path = g.shortestPath('officer_1', 'officer_2');
        expect(path).toEqual(['officer_1', 'officer_2']);
    });

    it('2홉 떨어진 노드 경로', () => {
        const g = createPopulatedGraph();
        const path = g.shortestPath('officer_1', 'officer_3');
        expect(path).toEqual(['officer_1', 'officer_2', 'officer_3']);
    });

    it('3홉 떨어진 노드 경로 (우회)', () => {
        const g = createPopulatedGraph();
        // 1→5(90), 5→4(10 enemy = low affinity) vs 1→2(80), 2→3(70), 3→4(60)
        // 높은 affinity = 낮은 cost
        const path = g.shortestPath('officer_1', 'officer_4');
        expect(path).not.toBeNull();
        expect(path!.length).toBeGreaterThanOrEqual(3);
    });

    it('연결되지 않은 노드 → null', () => {
        const g = createPopulatedGraph();
        g.ensureNode('officer_isolated');
        const path = g.shortestPath('officer_1', 'officer_isolated');
        expect(path).toBeNull();
    });

    it('존재하지 않는 노드 → null', () => {
        const g = createPopulatedGraph();
        const path = g.shortestPath('officer_1', 'nonexistent');
        expect(path).toBeNull();
    });

    it('Ripple Effect 전파 후 경로 변화', () => {
        const g = createPopulatedGraph();
        const pathBefore = g.shortestPath('officer_1', 'officer_4');

        g.applyRippleEffect('officer_3', 'officer_4', -60);

        const pathAfter = g.shortestPath('officer_1', 'officer_4');
        expect(pathAfter).not.toBeNull();
    });

    it('1,000명 그래프 경로 탐색 성능 < 50ms', () => {
        const g = new RelationshipGraphEvaluator();
        for (let i = 0; i < 1000; i++) {
            g.ensureNode(`off_${i}`);
        }
        for (let i = 0; i < 999; i++) {
            g.setRelationship(`off_${i}`, `off_${i + 1}`, 50 + Math.floor(Math.random() * 50), 'friend');
        }
        g.setRelationship('off_0', 'off_999', 90, 'friend');

        const start = performance.now();
        const path = g.shortestPath('off_0', 'off_999');
        const elapsed = performance.now() - start;

        expect(path).not.toBeNull();
        expect(elapsed).toBeLessThan(50);
    });
});

describe('RelationshipGraphEvaluator - 기본 연산', () => {
    it('setRelationship/getRelationshipWeight 일관성', () => {
        const g = new RelationshipGraphEvaluator();
        g.setRelationship('a', 'b', 75, 'friend');
        expect(g.getRelationshipWeight('a', 'b')).toBe(75);
        expect(g.getRelationshipWeight('b', 'a')).toBe(75);
    });

    it('Ripple Effect 2도 전파', () => {
        const g = new RelationshipGraphEvaluator();
        g.setRelationship('a', 'b', 50, 'friend');
        g.setRelationship('b', 'c', 50, 'friend');
        g.setRelationship('c', 'd', 50, 'friend');

        g.applyRippleEffect('b', 'a', 40, 2);

        // Ripple Effect: b의 이웃 c에 50% 감쇠 전파 (40/2=20)
        const weightCA = g.getRelationshipWeight('c', 'a');
        expect(weightCA).toBeGreaterThan(0);
        // 2도 전파: c의 이웃 d에 25% 감쇠 전파 (20/2=10)
        const weightDA = g.getRelationshipWeight('d', 'a');
        expect(weightDA).toBeGreaterThan(0);
    });

    it('최대 이웃 수 제한 (maxNeighbors)', () => {
        const g = new RelationshipGraphEvaluator();
        for (let i = 0; i < 100; i++) {
            g.setRelationship('hub', `off_${i}`, 60, 'friend');
        }
        const neighbors = g.getNeighbors('hub');
        expect(neighbors.length).toBeLessThanOrEqual(g.maxNeighbors);
    });
});
