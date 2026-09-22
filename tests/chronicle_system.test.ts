import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import {
    ChronicleManager,
    CHRONICLE_MAX,
    type ChronicleEntry,
} from '../src/core/chronicle_system.js';

describe('연대기 시스템 [Y-메타][441-460]', () => {
    it('항목 추가 시 스토어 시각이 자동 수집된다', () => {
        const store = new GameStore();
        store.initWorld([], [], [], []);
        store.setGlobalState({ ...store.getGlobalState() });
        const chronicle = new ChronicleManager();
        chronicle.attachStore(store);
        chronicle.add('DESTROYED', '원소 세력이 멸망했다');
        const list = chronicle.list();
        expect(list).toHaveLength(1);
        expect(list[0].text).toBe('원소 세력이 멸망했다');
        expect(list[0].icon).toBe('💀');
        expect(list[0].year).toBeGreaterThan(0);
    });

    it('시각 직접 지정도 가능하다', () => {
        const chronicle = new ChronicleManager();
        chronicle.add('PACT', '관우·장비 의형제 결의', { year: 184, month: 2, turn: 1 });
        expect(chronicle.list()[0]).toMatchObject({ year: 184, month: 2, turn: 1 });
    });

    it('최신순(list) 조회 — 마지막 기록이 맨 앞', () => {
        const chronicle = new ChronicleManager();
        chronicle.add('VISIT', '첫 기록', { year: 190, month: 1, turn: 1 });
        chronicle.add('VENGEANCE', '둘째 기록', { year: 190, month: 2, turn: 2 });
        chronicle.add('PACT', '셋째 기록', { year: 190, month: 3, turn: 3 });
        const list = chronicle.list();
        expect(list[0].text).toBe('셋째 기록');
        expect(list[2].text).toBe('첫 기록');
    });

    it('listByKind로 종류별 필터링', () => {
        const chronicle = new ChronicleManager();
        chronicle.add('VENGEANCE', '복수 1', { year: 190, month: 1, turn: 1 });
        chronicle.add('PACT', '결의 1', { year: 190, month: 2, turn: 2 });
        chronicle.add('VENGEANCE', '복수 2', { year: 190, month: 3, turn: 3 });
        const veng = chronicle.listByKind('VENGEANCE');
        expect(veng).toHaveLength(2);
        expect(veng.every(e => e.kind === 'VENGEANCE')).toBe(true);
    });

    it('링 버퍼 — 최대 항목 수를 초과하면 오래된 기록이 잘린다', () => {
        const chronicle = new ChronicleManager();
        for (let i = 0; i < CHRONICLE_MAX + 50; i++) {
            chronicle.add('VISIT', `기록 ${i}`, { year: 190, month: 1, turn: i });
        }
        expect(chronicle.size).toBe(CHRONICLE_MAX);
        // 가장 오래된 기록 0~49는 잘리고, 50부터 유지
        const list = chronicle.list();
        expect(list[list.length - 1].text).toBe('기록 50');
        expect(list[0].text).toBe(`기록 ${CHRONICLE_MAX + 49}`);
    });

    it('serialize/load로 세이브-로드 왕복', () => {
        const chronicle = new ChronicleManager();
        chronicle.add('RESCUE', '조운이 장비를 구출했다', { year: 200, month: 5, turn: 10 });
        const snap: ChronicleEntry[] = chronicle.serialize();
        const restored = new ChronicleManager();
        restored.load(JSON.parse(JSON.stringify(snap)));
        expect(restored.list()).toEqual(chronicle.list());
    });
});
