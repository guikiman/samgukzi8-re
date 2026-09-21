import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSlotManager } from '../src/core/save_slot_manager.js';

/** node 환경용 localStorage 목업 (브라우저와 동일한 Map 기반 의미론) */
function installLocalStorageMock(): void {
    const g = globalThis as Record<string, unknown>;
    const store = new Map<string, string>();
    g.localStorage = {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => void store.set(k, String(v)),
        removeItem: (k: string) => void store.delete(k),
        clear: () => void store.clear(),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() { return store.size; },
    };
}

installLocalStorageMock();

describe('세이브 슬롯 관리자 [17][212]', () => {
    let mgr: SaveSlotManager;

    beforeEach(() => {
        localStorage.clear();
        mgr = new SaveSlotManager();
    });

    it('3개 수동 슬롯에 각각 저장/복원된다', () => {
        const meta = { year: 200, month: 1, turnCount: 1, factionName: '조조' };
        expect(mgr.save(1, 'DATA_A', meta)).toBe(true);
        expect(mgr.save(2, 'DATA_B', meta)).toBe(true);
        expect(mgr.save(3, 'DATA_C', meta)).toBe(true);

        expect(mgr.load(1)).toBe('DATA_A');
        expect(mgr.load(2)).toBe('DATA_B');
        expect(mgr.load(3)).toBe('DATA_C');
    });

    it('같은 슬롯에 덮어쓰면 최신 데이터만 남는다', () => {
        const meta = { year: 200, month: 1, turnCount: 1, factionName: '유비' };
        mgr.save(1, 'OLD', meta);
        mgr.save(1, 'NEW', meta);
        expect(mgr.load(1)).toBe('NEW');
    });

    it('빈 슬롯 로드는 null', () => {
        expect(mgr.load(2)).toBeNull();
        expect(mgr.getMeta(2)).toBeNull();
    });

    it('메타데이터(연도/월/턴/세력명/시각)가 보존된다', () => {
        const before = Date.now();
        mgr.save(3, 'DATA', { year: 208, month: 7, turnCount: 42, factionName: '손권' });
        const meta = mgr.getMeta(3)!;
        expect(meta).not.toBeNull();
        expect(meta.year).toBe(208);
        expect(meta.month).toBe(7);
        expect(meta.turnCount).toBe(42);
        expect(meta.factionName).toBe('손권');
        expect(meta.slot).toBe(3);
        expect(meta.savedAt).toBeGreaterThanOrEqual(before);
    });

    it('auto 슬롯도 동일하게 동작한다', () => {
        mgr.save('auto', 'AUTODATA', { year: 201, month: 3, turnCount: 5, factionName: '원소' });
        expect(mgr.load('auto')).toBe('AUTODATA');
        expect(mgr.getMeta('auto')!.factionName).toBe('원소');
    });

    it('auto 슬롯이 비어 있으면 구버전 단일 키로 폴백한다', () => {
        localStorage.setItem('sik_re_save', 'LEGACY_DATA');
        expect(mgr.load('auto')).toBe('LEGACY_DATA');
    });

    it('손상된 슬롯 데이터는 null로 안전 처리된다', () => {
        localStorage.setItem('sik_re_slot_1', '{broken json');
        expect(mgr.load(1)).toBeNull();
        expect(mgr.getMeta(1)).toBeNull();
    });

    it('delete로 슬롯이 삭제된다', () => {
        mgr.save(2, 'DATA', { year: 200, month: 1, turnCount: 1, factionName: '조조' });
        mgr.delete(2);
        expect(mgr.load(2)).toBeNull();
    });

    it('hasAnySave는 저장 유무를 판정한다', () => {
        expect(mgr.hasAnySave()).toBe(false);
        mgr.save(1, 'DATA', { year: 200, month: 1, turnCount: 1, factionName: '조조' });
        expect(mgr.hasAnySave()).toBe(true);
    });

    it('getAllMetas는 1,2,3,auto 순으로 존재하는 슬롯만 반환한다', () => {
        mgr.save(2, 'D2', { year: 200, month: 1, turnCount: 1, factionName: 'A' });
        mgr.save('auto', 'DA', { year: 201, month: 2, turnCount: 2, factionName: 'B' });
        const metas = mgr.getAllMetas();
        expect(metas.map(m => m.slot)).toEqual([2, 'auto']);
    });
});
