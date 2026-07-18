/**
 * [1] CommandQueue 및 구체 커맨드 단위 테스트
 *
 * CommandQueue:
 * - enqueue/dequeue/executeNext 기본 동작
 * - Undo/Redo 스택 정합성
 * - 최대 히스토리 제한
 * - serializeAll()
 */

import { describe, it, expect } from 'vitest';
import { CommandQueue } from '../src/core/command_system.js';

function makeSuccessCmd(id: string) {
    return {
        id,
        type: 'REST' as const,
        execute: () => ({ success: true, effects: [] }),
        undo: () => true,
        serialize: () => ({ type: 'REST', data: { officerId: id } }),
    };
}

function makeFailCmd(id: string) {
    return {
        id,
        type: 'REST' as const,
        execute: () => ({ success: false, effects: [{ type: 'LOG', message: 'fail', severity: 'ERROR' as const }] }),
        undo: () => false,
        serialize: () => ({ type: 'REST', data: { officerId: id } }),
    };
}

const mockContext = { store: null as any, logger: () => {} };

describe('CommandQueue [1]', () => {
    it('enqueue/dequeue 기본 동작', () => {
        const queue = new CommandQueue(10);
        const cmd = makeSuccessCmd('test_cmd');
        queue.enqueue(cmd);
        expect(queue.getPendingCount()).toBe(1);
        const dequeued = queue.dequeue();
        expect(dequeued?.id).toBe('test_cmd');
        expect(queue.getPendingCount()).toBe(0);
    });

    it('executeNext가 성공 커맨드 실행 후 히스토리 증가', () => {
        const queue = new CommandQueue(10);
        queue.enqueue(makeSuccessCmd('cmd_1'));
        const result = queue.executeNext(mockContext);
        expect(result).not.toBeNull();
        expect(result!.success).toBe(true);
        expect(queue.getExecutedCount()).toBe(1);
    });

    it('Undo/Redo 정합성', () => {
        const queue = new CommandQueue(10);
        queue.enqueue(makeSuccessCmd('cmd_1'));
        queue.executeNext(mockContext);

        expect(queue.canUndo()).toBe(true);
        expect(queue.undoLast(mockContext)).toBe(true);
        expect(queue.canRedo()).toBe(true);
        expect(queue.redoLast(mockContext)).toBe(true);
        expect(queue.canUndo()).toBe(true);
    });

    it('최대 히스토리 제한', () => {
        const queue = new CommandQueue(3);
        for (let i = 0; i < 5; i++) {
            queue.enqueue(makeSuccessCmd(`cmd_${i}`));
            queue.executeNext(mockContext);
        }
        expect(queue.getExecutedCount()).toBe(3);
    });

    it('실패 커맨드는 히스토리에 추가되지 않음', () => {
        const queue = new CommandQueue(10);
        queue.enqueue(makeFailCmd('fail_1'));
        queue.executeNext(mockContext);
        expect(queue.getExecutedCount()).toBe(0);
        expect(queue.canUndo()).toBe(false);
    });

    it('빈 큐에서 dequeue/undo/redo는 안전하게 null/false 반환', () => {
        const queue = new CommandQueue(10);
        expect(queue.dequeue()).toBeUndefined();
        expect(queue.undoLast(mockContext)).toBe(false);
        expect(queue.redoLast(mockContext)).toBe(false);
        expect(queue.canUndo()).toBe(false);
        expect(queue.canRedo()).toBe(false);
    });

    it('serializeAll 직렬화', () => {
        const queue = new CommandQueue(10);
        queue.enqueue(makeSuccessCmd('cmd_1'));
        queue.executeNext(mockContext);

        const serialized = queue.serializeAll();
        expect(serialized.length).toBeGreaterThan(0);
        expect(serialized[0]).toHaveProperty('type');
    });
});
