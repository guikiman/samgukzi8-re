import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { TriStateGraphDatabase } from '../src/core/relationship_graph_db.js';
import { RelationshipEdge } from '../src/core/types.js';

/**
 * GameStore ↔ TriStateGraphDatabase 파생 인덱스 통합 검증
 * - addRelationship 시 그래프 인덱스 동기화
 * - removeOfficer 시 양방향 에지 정리
 * - rebuildGraphIndex로 세이브 복원 등 대량 변경 재구축
 */
describe('GameStore 그래프 인덱스 통합', () => {
    let store: GameStore;

    beforeEach(() => {
        store = new GameStore();
    });

    function makeEdge(
        source: string, target: string,
        type: RelationshipEdge['type'], affinity: number,
    ): RelationshipEdge {
        return {
            source, target, type, affinity,
            history: [{ year: 192, month: 1, event: 'test', delta: 0 }],
        };
    }

    it('addRelationship 시 파생 그래프 인덱스에 동기화된다', () => {
        store.addRelationship(makeEdge('liu_bei', 'guan_yu', 'SWORN_BROTHER', 60));

        const g = store.getGraphIndex();
        // affinity 60 → weight 110 → clamp 100
        expect(g.getRelationshipWeight('liu_bei', 'guan_yu')).toBe(100);
        expect(g.getEdge('liu_bei', 'guan_yu')?.type).toBe('sworn_brother');
    });

    it('NEMESIS 관계는 enemy 에지로 변환된다', () => {
        store.addRelationship(makeEdge('cao_cao', 'liu_bei', 'NEMESIS', -80));
        const g = store.getGraphIndex();
        expect(g.getEnemies('cao_cao')).toContain('liu_bei');
        expect(g.getEdge('cao_cao', 'liu_bei')?.type).toBe('enemy');
    });

    it('affinity 음수는 0 이하로 clamp 된다', () => {
        store.addRelationship(makeEdge('a', 'b', 'RIVAL', -100));
        expect(store.getGraphIndex().getRelationshipWeight('a', 'b')).toBe(0);
    });

    it('removeOfficer 시 그래프 인덱스 노드와 양방향 에지가 정리된다', () => {
        store.addRelationship(makeEdge('a', 'b', 'FRIEND', 50));
        store.addRelationship(makeEdge('c', 'a', 'FRIEND', 30));

        store.removeOfficer('a');

        const g = store.getGraphIndex();
        expect(g.getWarlord('a')).toBeNull();
        expect(g.getRelationshipWeight('b', 'a')).toBe(0);
        expect(g.getRelationshipWeight('c', 'a')).toBe(0);
        expect(g.getNeighbors('b')).not.toContain('a');
    });

    it('rebuildGraphIndex가 전체 관계를 재구축한다', () => {
        store.addRelationship(makeEdge('x', 'y', 'FRIEND', 40));
        store.addRelationship(makeEdge('y', 'z', 'NEMESIS', -90));

        // 외부에서 인덱스를 파괴한 뒤 재구축 (세이브 복원 시나리오)
        store.getGraphIndex().clear();
        expect(store.getGraphIndex().getEdgeCount()).toBe(0);

        store.rebuildGraphIndex();
        const g = store.getGraphIndex();
        expect(g.getEdgeCount()).toBe(2);
        expect(g.getRelationshipWeight('x', 'y')).toBe(90); // 40+50
        expect(g.getEnemies('y')).toContain('z');
    });

    it('인덱스가 O(1) 조회를 제공한다 (기존 배열 스캔 대비)', () => {
        // 관계 100개 추가 후 직접 조회
        for (let i = 0; i < 100; i++) {
            store.addRelationship(makeEdge(`o${i}`, `o${(i + 1) % 100}`, 'FRIEND', 50));
        }
        const g = store.getGraphIndex();
        expect(g.getRelationshipWeight('o0', 'o1')).toBe(100);
        expect(g.getWarlordCount()).toBe(100);
    });

    it('TriStateGraphDatabase를 독립적으로 사용할 수 있다 (re-export 확인)', () => {
        const db = new TriStateGraphDatabase();
        db.addWarlord('w1', '무장1');
        expect(db.getWarlord('w1')?.name).toBe('무장1');
    });
});
