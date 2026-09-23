import { describe, it, expect } from 'vitest';
import { TriStateGraphDatabase } from '../src/core/relationship_graph_db';

describe('TriStateGraphDatabase', () => {
    let db: TriStateGraphDatabase;

    beforeEach(() => {
        db = new TriStateGraphDatabase();
    });

    it('노드를 O(1)로 추가하고 중복 추가 시 기존 노드를 반환한다', () => {
        const n1 = db.addWarlord('cao_cao', '조조');
        const n2 = db.addWarlord('cao_cao', '조조');
        expect(n1).toBe(n2);
        expect(db.getWarlordCount()).toBe(1);
        expect(db.getWarlord('cao_cao')?.name).toBe('조조');
    });

    it('관계 에지를 설정하고 우호도를 O(1) 조회한다', () => {
        db.setRelationship('liu_bei', 'guan_yu', 90, 'sworn_brother');
        expect(db.getRelationshipWeight('liu_bei', 'guan_yu')).toBe(90);
        expect(db.getEdge('liu_bei', 'guan_yu')?.type).toBe('sworn_brother');
    });

    it('우호도는 0~100 범위로 clamp 된다', () => {
        db.setRelationship('a', 'b', 150);
        expect(db.getRelationshipWeight('a', 'b')).toBe(100);
        db.setRelationship('c', 'd', -50);
        expect(db.getRelationshipWeight('c', 'd')).toBe(0);
    });

    it('enemy 에지는 노드의 적대 집합에 바인딩 된다', () => {
        db.setRelationship('cao_cao', 'liu_bei', 10, 'enemy');
        expect(db.getEnemies('cao_cao')).toContain('liu_bei');
        expect(db.getWarlord('cao_cao')!.relationships.enemies.has('liu_bei')).toBe(true);
    });

    it('자기 자신과의 관계는 설정하지 않는다', () => {
        db.setRelationship('a', 'a', 50);
        expect(db.getEdgeCount()).toBe(0);
    });

    it('노드 제거 시 양방향 에지와 인접 목록이 정리된다', () => {
        db.setRelationship('a', 'b', 80);
        db.setRelationship('b', 'a', 80);
        db.setRelationship('c', 'a', 60);
        expect(db.removeWarlord('a')).toBe(true);
        expect(db.getWarlord('a')).toBeNull();
        expect(db.getRelationshipWeight('b', 'a')).toBe(0);
        expect(db.getRelationshipWeight('c', 'a')).toBe(0);
        expect(db.getNeighbors('b')).not.toContain('a');
    });

    // ============================================================
    // 75% 인맥 필터링 (희소 행렬 압축)
    // ============================================================

    describe('75% 인맥 필터링', () => {
        it('이웃이 임계치(80)를 넘고 우호도 < 75인 friend 에지는 압축 탈락한다', () => {
            // 80명까지는 자유롭게 추가
            for (let i = 0; i < 80; i++) {
                db.setRelationship('hub', `n${i}`, 90);
            }
            expect(db.getNeighbors('hub').length).toBe(80);

            // 81번째: 우호도 74 (< 75) → 거부
            db.setRelationship('hub', 'weak_tie', 74);
            expect(db.getNeighbors('hub')).not.toContain('weak_tie');

            // 81번째라도 우호도 75 이상이면 수용
            db.setRelationship('hub', 'strong_tie', 75);
            expect(db.getNeighbors('hub')).toContain('strong_tie');
        });
    });

    // ============================================================
    // [Ripple Effect] 인맥 파급 효과
    // ============================================================

    describe('applyRippleEffect', () => {
        beforeEach(() => {
            // 인맥망 구축: source(s) ← target(t) ← 친구1, 친구2 / 친구1 ← 친친구
            db.setRelationship('t', 'friend1', 80);
            db.setRelationship('t', 'friend2', 80);
            db.setRelationship('friend1', 'friend_of_friend', 80);
        });

        it('1도 인맥에 절반 감쇠된 우호도 변동을 전파한다', () => {
            // source의 선물 행동 → target의 인맥이 source에게 우호도 +10
            const result = db.applyRippleEffect('t', 's', 10, 2);

            // 1도: friend1, friend2가 +5 (10/2)
            const f1 = result.log.find(l => l.neighborId === 'friend1');
            expect(f1).toBeDefined();
            expect(f1!.degree).toBe(1);
            expect(f1!.oldWeight).toBe(0);
            expect(f1!.newWeight).toBe(5);
        });

        it('2도 인맥까지 연쇄 전파되며 감쇠가 누적된다', () => {
            const result = db.applyRippleEffect('t', 's', 8, 2);

            // 2도: friend_of_friend가 +2 (8/2/2)
            const fof = result.log.find(l => l.neighborId === 'friend_of_friend');
            expect(fof).toBeDefined();
            expect(fof!.degree).toBe(2);
            expect(fof!.newWeight).toBe(2);
        });

        it('source 본인은 파동의 영향을 받지 않는다', () => {
            db.setRelationship('t', 's', 50);
            const before = db.getRelationshipWeight('t', 's');
            db.applyRippleEffect('t', 's', 10, 2);
            expect(db.getRelationshipWeight('t', 's')).toBe(before);
        });

        it('감쇠가 0으로 수렴하면 전파를 중단한다', () => {
            // change 1 → 1도에서 0.5 → trunc 0 → 전파 없음
            const result = db.applyRippleEffect('t', 's', 1, 2);
            expect(result.touchedCount).toBe(0);
        });

        it('존재하지 않는 타겟은 안전하게 무시한다', () => {
            const result = db.applyRippleEffect('ghost', 's', 10, 2);
            expect(result.touchedCount).toBe(0);
        });

        it('음수 변동(참언)도 전파된다', () => {
            // 사전에 source에 대한 우호도 형성
            db.setRelationship('friend1', 's', 60);
            const result = db.applyRippleEffect('t', 's', -20, 1);

            const f1 = result.log.find(l => l.neighborId === 'friend1');
            expect(f1).toBeDefined();
            // 60 + (-20/2) = 50
            expect(f1!.newWeight).toBe(50);
        });

        it('우호도 하락 시 20 미만이 되면 enemy로 전환된다', () => {
            db.setRelationship('friend2', 's', 15);
            db.applyRippleEffect('t', 's', -20, 1);

            const edge = db.getEdge('friend2', 's');
            // 15 + (-10) = 5 → enemy 전환
            expect(edge!.weight).toBe(5);
            expect(edge!.type).toBe('enemy');
        });
    });

    // ============================================================
    // 직렬화 / 역직렬화
    // ============================================================

    it('serialize → deserialize 라운드트립이 일치한다', () => {
        db.setRelationship('a', 'b', 85, 'sworn_brother');
        db.setRelationship('a', 'c', 10, 'enemy');

        const restored = TriStateGraphDatabase.deserialize(db.serialize());
        expect(restored.getWarlordCount()).toBe(3);
        expect(restored.getRelationshipWeight('a', 'b')).toBe(85);
        expect(restored.getEdge('a', 'b')?.type).toBe('sworn_brother');
        expect(restored.getEnemies('a')).toContain('c');
    });

    // ============================================================
    // 성능 벤치마크 — 1,000 노드 그래프 < 5ms
    // ============================================================

    it('1,000 노드 그래프 탐색이 5ms 이내다 (성능 벤치마크)', () => {
        const bigDb = new TriStateGraphDatabase();
        for (let i = 0; i < 1000; i++) {
            bigDb.addWarlord(`w${i}`);
        }
        // 허브 구조: w0이 80명과 연결 (인맥 한계)
        for (let i = 1; i <= 80; i++) {
            bigDb.setRelationship('w0', `w${i}`, 90);
        }

        const start = performance.now();
        // O(1) 조회 1,000회
        for (let i = 0; i < 1000; i++) {
            bigDb.getRelationshipWeight('w0', 'w1');
            bigDb.getWarlord(`w${i % 1000}`);
        }
        // 2도 Ripple 1회
        bigDb.applyRippleEffect('w0', 'w999', 10, 2);
        const elapsed = performance.now() - start;

        expect(elapsed).toBeLessThan(5);
    });
});
