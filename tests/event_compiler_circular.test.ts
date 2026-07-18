import { describe, it, expect } from 'vitest';
import { EventId, ChainId } from '../src/core/story_event_compiler.js';

/**
 * [29] StoryEventCompiler 순환 참조 탐지 정적 분석 테스트
 *
 * 연의전 스토리 이벤트 DAG 그래프에 순환 조건이 걸려
 * 이벤트가 무한 루프에 빠지는 시나리오 데이터 왜곡을 자동 스캔 및 차단
 */

interface EventNode {
    id: EventId;
    nextEventId?: EventId;
}

function detectCycle(events: EventNode[]): EventId | null {
    const graph = new Map<EventId, EventId | null>();
    for (const e of events) {
        graph.set(e.id, e.nextEventId ?? null);
    }

    const visited = new Set<EventId>();
    const recursionStack = new Set<EventId>();

    function dfs(nodeId: EventId): boolean {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const next = graph.get(nodeId);
        if (next && graph.has(next)) {
            if (recursionStack.has(next)) return true;
            if (!visited.has(next) && dfs(next)) return true;
        }

        recursionStack.delete(nodeId);
        return false;
    }

    for (const [id] of graph) {
        if (!visited.has(id)) {
            if (dfs(id)) return id;
        }
    }
    return null;
}

describe('StoryEventCompiler - 순환 참조 탐지', () => {
    it('사이클 없는 DAG → null 반환', () => {
        const events: EventNode[] = [
            { id: EventId('evt_1'), nextEventId: EventId('evt_2') },
            { id: EventId('evt_2'), nextEventId: EventId('evt_3') },
            { id: EventId('evt_3') },
        ];
        expect(detectCycle(events)).toBeNull();
    });

    it('단순 3노드 사이클 → 사이클 시작점 반환', () => {
        const events: EventNode[] = [
            { id: EventId('evt_a'), nextEventId: EventId('evt_b') },
            { id: EventId('evt_b'), nextEventId: EventId('evt_c') },
            { id: EventId('evt_c'), nextEventId: EventId('evt_a') },
        ];
        expect(detectCycle(events)).not.toBeNull();
    });

    it('자기 자신 참조 사이클 → 해당 노드 반환', () => {
        const events: EventNode[] = [
            { id: EventId('evt_self'), nextEventId: EventId('evt_self') },
        ];
        expect(detectCycle(events)).toBe(EventId('evt_self'));
    });

    it('긴 체인 중간에 사이클 포함 → 사이클 감지', () => {
        const events: EventNode[] = [
            { id: EventId('e1'), nextEventId: EventId('e2') },
            { id: EventId('e2'), nextEventId: EventId('e3') },
            { id: EventId('e3'), nextEventId: EventId('e4') },
            { id: EventId('e4'), nextEventId: EventId('e2') },
            { id: EventId('e5') },
        ];
        expect(detectCycle(events)).not.toBeNull();
    });

    it('고립된 노드 (링크 없음) → null', () => {
        const events: EventNode[] = [
            { id: EventId('isolated') },
            { id: EventId('also_isolated') },
        ];
        expect(detectCycle(events)).toBeNull();
    });

    it('1,000개 이벤트 그래프에서 사이클 감지 성능', () => {
        const events: EventNode[] = [];
        for (let i = 0; i < 999; i++) {
            events.push({ id: EventId(`evt_${i}`), nextEventId: EventId(`evt_${i + 1}`) });
        }
        events.push({ id: EventId('evt_999'), nextEventId: EventId('evt_500') });

        const start = performance.now();
        const result = detectCycle(events);
        const elapsed = performance.now() - start;

        expect(result).not.toBeNull();
        expect(elapsed).toBeLessThan(50);
    });
});
