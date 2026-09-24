/**
 * [312] 전투 리플레이 — ReplayViewer 재생 로직 유닛 테스트
 * ReplayShareManager 압축 라운드트립 회귀 테스트 (기존 replay_share_manager.test.ts 보완)
 */

import { describe, it, expect } from 'vitest';
import { ReplayViewer } from '../src/core/replay_viewer.js';
import { ReplayShareManager, encodeReplayLogs, decodeReplayLogs } from '../src/core/replay_share_manager.js';
import type { ReplayActionLog } from '../src/core/replay_share_manager.js';

// ============================================================
// 테스트 픽스처
// ============================================================

function makeLogs(): ReplayActionLog[] {
    return [
        { turn: 1, officerId: 'friendly_1', actionType: 'DEPLOY', targetId: null, value: 0, x: 0, y: 0 },
        { turn: 1, officerId: 'enemy_1', actionType: 'DEPLOY', targetId: null, value: 0, x: 3, y: 0 },
        { turn: 2, officerId: 'friendly_1', actionType: 'MOVE', targetId: null, value: 0, x: 1, y: 0 },
        { turn: 2, officerId: 'friendly_1', actionType: 'ATTACK', targetId: 'enemy_1', value: 300, x: 3, y: 0 },
        { turn: 3, officerId: 'enemy_1', actionType: 'MOVE', targetId: null, value: 0, x: 2, y: 0 },
        { turn: 3, officerId: 'enemy_1', actionType: 'ATTACK', targetId: 'friendly_1', value: 200, x: 1, y: 0 },
    ];
}

/** 시간 경과 시뮬레이터 — update(dt)를 stepInterval 이상 반복 호출 */
function runFrames(viewer: ReplayViewer, totalMs: number, frameMs = 100): void {
    let elapsed = 0;
    while (elapsed < totalMs && !viewer.isFinished) {
        viewer.update(frameMs);
        elapsed += frameMs;
    }
}

// ============================================================
// ReplayViewer
// ============================================================

describe('ReplayViewer [312]', () => {
    it('로그를 로드하면 유닛 디렉터리가 구축된다', () => {
        const logs: string[] = [];
        const viewer = new ReplayViewer({ addLog: l => logs.push(l) });
        const unitCount = viewer.load(makeLogs());
        expect(unitCount).toBe(2);
        expect(viewer.actionCount).toBe(6);
        expect(viewer.isFinished).toBe(false);
    });

    it('재생이 진행되면 모든 액션이 소진되고 완료 상태가 된다', () => {
        const viewer = new ReplayViewer({ addLog: () => { /* 무음 */ } });
        viewer.load(makeLogs());
        viewer.play();
        expect(viewer.isPlaying).toBe(true);

        runFrames(viewer, 10_000); // 450ms × 6액션 = 2.7초면 충분
        expect(viewer.isFinished).toBe(true);
        expect(viewer.isPlaying).toBe(false);
    });

    it('완료 콜백이 정확히 1회 발화한다', () => {
        let completions = 0;
        const viewer = new ReplayViewer({ addLog: () => { /* */ }, onComplete: () => completions++ });
        viewer.load(makeLogs());
        viewer.play();
        runFrames(viewer, 10_000);
        expect(completions).toBe(1);
    });

    it('액션 로그가 addLog 콜백으로 순차 출력된다 (TURN 제외)', () => {
        const logs: string[] = [];
        const viewer = new ReplayViewer({ addLog: l => logs.push(l) });
        viewer.load(makeLogs());
        viewer.play();
        runFrames(viewer, 10_000);
        // 재생 시작 1줄 + 완료 1줄 + 액션 6줄 (TURN 없음)
        expect(logs[0]).toContain('재생 시작');
        expect(logs[logs.length - 1]).toContain('재생 완료');
        const actionLogs = logs.filter(l => l.startsWith('▶ T'));
        expect(actionLogs.length).toBe(6);
        // 공격 로그에 피해 수치와 대상이 포함되는지
        expect(actionLogs.some(l => l.includes('ATTACK') && l.includes('enemy_1') && l.includes('-300'))).toBe(true);
    });

    it('빈 로그로 재생하면 완료 상태로 유지된다', () => {
        const viewer = new ReplayViewer({ addLog: () => { /* */ } });
        expect(viewer.load([])).toBe(0);
        expect(viewer.isFinished).toBe(true);
        viewer.play();
        expect(viewer.isPlaying).toBe(false);
    });

    it('togglePause로 재생/일시정지가 전환된다', () => {
        const viewer = new ReplayViewer({ addLog: () => { /* */ } });
        viewer.load(makeLogs());
        viewer.play();
        expect(viewer.isPlaying).toBe(true);
        viewer.togglePause();
        expect(viewer.isPlaying).toBe(false);
        // 일시정지 중에는 진행되지 않음
        runFrames(viewer, 2_000);
        expect(viewer.isFinished).toBe(false);
        viewer.togglePause();
        expect(viewer.isPlaying).toBe(true);
    });

    it('대용량 로그(1,000액션)도 성능 저하 없이 완료된다', () => {
        const bigLogs: ReplayActionLog[] = [];
        for (let i = 0; i < 1000; i++) {
            bigLogs.push({
                turn: Math.floor(i / 10) + 1,
                officerId: i % 2 === 0 ? 'friendly_1' : 'enemy_1',
                actionType: i % 3 === 0 ? 'ATTACK' : 'MOVE',
                targetId: i % 3 === 0 ? (i % 2 === 0 ? 'enemy_1' : 'friendly_1') : null,
                value: i % 3 === 0 ? 100 + i % 50 : 0,
                x: i % 5, y: Math.floor(i / 5) % 5,
            });
        }
        const viewer = new ReplayViewer({ addLog: () => { /* */ } });
        viewer.load(bigLogs);
        viewer.play();
        const start = Date.now();
        runFrames(viewer, 600_000); // 450ms × 1000 = 450초 분량을 프레임 시뮬로 즉시 소화
        expect(viewer.isFinished).toBe(true);
        expect(Date.now() - start).toBeLessThan(3_000); // 3초 이내
    });
});

// ============================================================
// ReplayShareManager — 압축 라운드트립 (리플레이 ↔ 뷰어 호환성)
// ============================================================

describe('ReplayShareManager 라운드트립 [312][302]', () => {
    it('encode → decode로 원본 로그가 손상 없이 복원된다', async () => {
        const original = makeLogs();
        const encoded = await encodeReplayLogs(original);
        expect(encoded.length).toBeGreaterThan(0);
        expect(encoded).not.toContain('+'); // base64url 안전 문자
        expect(encoded).not.toContain('/');

        const decoded = await decodeReplayLogs(encoded);
        expect(decoded).toEqual(original);
    });

    it('공유 URL 크기가 100kB 이하로 유지된다 [312]', async () => {
        // 실전 규모: 500액션 전투
        const logs: ReplayActionLog[] = [];
        for (let i = 0; i < 500; i++) {
            logs.push({
                turn: Math.floor(i / 8) + 1,
                officerId: `off_${i % 7}`,
                actionType: i % 4 === 0 ? 'ATTACK' : 'MOVE',
                targetId: i % 4 === 0 ? `off_${(i + 1) % 7}` : null,
                value: i % 4 === 0 ? 150 : 0,
                x: i % 9, y: Math.floor(i / 9) % 9,
            });
        }
        const encoded = await encodeReplayLogs(logs);
        expect(encoded.length).toBeLessThan(100 * 1024);
    });

    it('손상된 압축 문자열 복원 시 빈 배열로 안전 실패한다', async () => {
        const decoded = await decodeReplayLogs('this-is-garbage-data!!!');
        expect(decoded).toEqual([]);
    });

    it('세이브 데이터 압축 [302] 라운드트립이 유지된다', async () => {
        const mgr = new ReplayShareManager();
        const saveData = { officers: [{ id: 'a', loyalty: 50 }], time: { year: 208, month: 7 } };
        const compressed = await mgr.compressSaveData(saveData);
        const restored = await mgr.decompressSaveData<typeof saveData>(compressed);
        expect(restored).toEqual(saveData);
    });
});
