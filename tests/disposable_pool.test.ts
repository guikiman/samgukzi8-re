import { describe, it, expect } from 'vitest';
import { DisposableObjectPool, IDisposable } from '../src/core/disposable_pool.js';

/**
 * [32] DisposableObjectPool 메모리 누수 및 dispose 자동 해제 단위 테스트
 *
 * 3D 메시 타일 기하 버퍼가 오브젝트 풀에서 해제될 때
 * VRAM 누수 없이 완전히 소거되는지 가상 메모리 객체를 프로파일링 추적
 */

class TestDisposable implements IDisposable {
    disposed = false;
    data: number[] | null;

    constructor(size = 100) {
        this.data = new Array(size).fill(0);
    }

    dispose(): void {
        this.data = null;
        this.disposed = true;
    }
}

function createPool(size = 64): DisposableObjectPool<TestDisposable> {
    return new DisposableObjectPool<TestDisposable>(
        () => new TestDisposable(),
        (obj) => { obj.disposed = false; obj.data = new Array(100).fill(0); },
        (obj) => obj.dispose(),
        size,
        512,
    );
}

describe('DisposableObjectPool - 메모리 누수 방지', () => {
    it('acquire 시 dispose된 객체 재사용', () => {
        const pool = createPool(4);
        const obj1 = pool.acquire();
        const id1 = obj1.data?.[0];
        pool.release(obj1);

        const obj2 = pool.acquire();
        expect(obj2.disposed).toBe(false);
        expect(obj2.data).not.toBeNull();
    });

    it('release 후 activeCount 감소 확인', () => {
        const pool = createPool(16);
        const obj = pool.acquire();
        expect(pool.activeCount).toBe(1);
        pool.release(obj);
        expect(pool.activeCount).toBe(0);
    });

    it('disposeAll 호출 시 모든 객체 dispose 처리', () => {
        const pool = createPool(8);
        const objects: TestDisposable[] = [];
        for (let i = 0; i < 8; i++) {
            objects.push(pool.acquire());
        }
        expect(objects.every(o => !o.disposed)).toBe(true);

        pool.disposeAll();
        expect(pool.activeCount).toBe(0);
    });

    it('acquire 후 release 누락(leak) 시 activeCount 유지', () => {
        const pool = createPool(16);
        const obj = pool.acquire();
        expect(pool.activeCount).toBe(1);
        // release 누락
        expect(pool.activeCount).toBe(1);
        pool.release(obj); // 수동 해제
        expect(pool.activeCount).toBe(0);
    });

    it('maxSize 초과 acquire 시 에러 없이 정상 동작', () => {
        const pool = new DisposableObjectPool<TestDisposable>(
            () => new TestDisposable(),
            (obj) => { obj.disposed = false; obj.data = new Array(100).fill(0); },
            (obj) => obj.dispose(),
            2,   // initialSize
            4,   // maxSize
        );
        const objects: TestDisposable[] = [];
        for (let i = 0; i < 6; i++) {
            objects.push(pool.acquire());
        }
        objects.forEach(o => pool.release(o));
        expect(pool.activeCount).toBe(0);
    });

    it('evict로 특정 객체 강제 제거', () => {
        const pool = createPool(4);
        const obj = pool.acquire();
        pool.evict(obj);
        expect(obj.disposed).toBe(true);
    });

    it('utilization 비율 정확성', () => {
        const pool = createPool(8);
        expect(pool.utilization).toBe(0);
        const o1 = pool.acquire();
        expect(pool.utilization).toBeGreaterThan(0);
        pool.release(o1);
        expect(pool.utilization).toBe(0);
    });
});
