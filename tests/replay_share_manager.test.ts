/**
 * replay_share_manager.ts 단위 테스트
 *
 * [312] 전투 리플레이 URL 공유 / [302] 세이브 데이터 압축
 * gzip + base64url 파이프라인의 왕복(round-trip) 무결성 검증
 */

import { describe, it, expect } from 'vitest';
import {
    ReplayShareManager,
    base64UrlEncode,
    base64UrlDecode,
    encodeReplayLogs,
    decodeReplayLogs,
} from '../src/core/replay_share_manager.js';
import type { ReplayActionLog } from '../src/core/replay_share_manager.js';

function makeLog(overrides: Partial<ReplayActionLog> = {}): ReplayActionLog {
    return {
        turn: 1,
        officerId: 'guanyu',
        actionType: 'ATTACK',
        targetId: 'zhangfei',
        value: 250,
        x: 3,
        y: 4,
        ...overrides,
    };
}

describe('base64url 코덱', () => {
    it('UTF-8 멀티바이트 문자열 왕복 보존', () => {
        const original = '三國志 VIII 리메이크 — 관운장';
        const encoded = base64UrlEncode(new TextEncoder().encode(original));
        expect(encoded).not.toMatch(/[+/=]/); // URL-safe
        const decoded = new TextDecoder().decode(base64UrlDecode(encoded));
        expect(decoded).toBe(original);
    });

    it('URL 파라미터에 안전한 문자만 포함', () => {
        const encoded = base64UrlEncode(new TextEncoder().encode('any base64 output +/= chars'));
        expect(/^[A-Za-z0-9_-]*$/.test(encoded)).toBe(true);
    });
});

describe('ReplayShareManager [312]', () => {
    it('recordAction → getLogs 왕복 보존', () => {
        const mgr = new ReplayShareManager();
        mgr.recordAction(1, 'guanyu', 'MOVE', null, 0, 2, 3);
        mgr.recordAction(1, 'guanyu', 'ATTACK', 'zhangfei', 320, 4, 3);
        expect(mgr.logCount).toBe(2);

        const logs = mgr.getLogs();
        expect(logs[0]).toEqual({ turn: 1, officerId: 'guanyu', actionType: 'MOVE', targetId: null, value: 0, x: 2, y: 3 });
        expect(logs[1]).toEqual({ turn: 1, officerId: 'guanyu', actionType: 'ATTACK', targetId: 'zhangfei', value: 320, x: 4, y: 3 });
    });

    it('clearLogs 초기화', () => {
        const mgr = new ReplayShareManager();
        mgr.recordAction(1, 'a', 'MOVE', null, 0, 0, 0);
        mgr.clearLogs();
        expect(mgr.logCount).toBe(0);
        expect(mgr.getLogs()).toHaveLength(0);
    });

    it('exportToCompressedString — 빈 로그는 빈 문자열', async () => {
        const mgr = new ReplayShareManager();
        expect(await mgr.exportToCompressedString()).toBe('');
    });

    it('압축 → 복원 왕복 무결성 (round-trip)', async () => {
        const mgr = new ReplayShareManager();
        for (let t = 1; t <= 20; t++) {
            mgr.recordAction(t, 'guanyu', 'ATTACK', 'caocao', 100 + t, (t * 3) % 30, (t * 7) % 30);
            mgr.recordAction(t, 'caocao', 'STRATAGEM', 'guanyu', 50, (t * 5) % 30, (t * 2) % 30);
        }

        const compressed = await mgr.exportToCompressedString();
        expect(compressed.length).toBeGreaterThan(0);
        expect(/^[A-Za-z0-9_-]*$/.test(compressed)).toBe(true);

        const restored = await mgr.importFromCompressedString(compressed);
        expect(restored).toEqual(mgr.getLogs());
    });

    it('gzip 압축이 반복 로그에서 실질적 절감 효과를 낸다', async () => {
        const mgr = new ReplayShareManager();
        for (let t = 1; t <= 500; t++) {
            mgr.recordAction(t, 'officer_0001', 'MOVE', null, 0, t % 40, (t * 2) % 40);
        }
        const compressed = await mgr.exportToCompressedString();
        // 미니피케이션된 500개 로그의 JSON 원본은 ~45KB, gzip 후 훨씬 작아야 함
        const rawJson = JSON.stringify(mgr.getLogs());
        expect(compressed.length).toBeLessThan(rawJson.length);
    });

    it('손상된 압축 문자열은 빈 배열로 안전 실패 (fail-safe)', async () => {
        const mgr = new ReplayShareManager();
        expect(await mgr.importFromCompressedString('!!!not-base64!!!')).toEqual([]);
        expect(await mgr.importFromCompressedString('')).toEqual([]);
    });

    it('100kB URL 공유 상한 검사 통과', async () => {
        const mgr = new ReplayShareManager();
        for (let t = 1; t <= 1000; t++) {
            mgr.recordAction(t, 'officer_0001', 'ATTACK', 'target', 150, t % 40, t % 40);
        }
        const shared = await mgr.exportForUrlSharing();
        expect(shared.length).toBeLessThanOrEqual(100 * 1024);
    });

    it('편의 함수 encode/decode 왕복', async () => {
        const logs = [makeLog(), makeLog({ turn: 2, officerId: 'luxun', actionType: 'STRATAGEM', targetId: null, value: -10, x: 9, y: 1 })];
        const compressed = await encodeReplayLogs(logs);
        const restored = await decodeReplayLogs(compressed);
        expect(restored).toEqual(logs);
    });
});

describe('세이브 데이터 압축 [302]', () => {
    it('compressSaveData → decompressSaveData 왕복', async () => {
        const mgr = new ReplayShareManager();
        const saveData = {
            version: 1,
            year: 207,
            month: 8,
            factions: [{ id: 'shu', name: '촉', gold: 5432, cities: ['Chengdu', 'Jiangzhou'] }],
            officers: Array.from({ length: 50 }, (_, i) => ({ id: `officer_${i}`, loyalty: 70 + (i % 30) })),
        };
        const compressed = await mgr.compressSaveData(saveData);
        const restored = await mgr.decompressSaveData<typeof saveData>(compressed);
        expect(restored).toEqual(saveData);
    });

    it('손상된 세이브 압축은 null로 안전 실패', async () => {
        const mgr = new ReplayShareManager();
        expect(await mgr.decompressSaveData('broken-data')).toBeNull();
    });
});
