/**
 * [E55] 스레드 안전 원자 카운터 — ThreadSafeAtomicCounter
 *
 * 목적: Web Worker 간 공유 카운터를 Atomic 연산으로
 *       동시성 충돌 없이 안전하게 증감.
 *
 * 핵심 로직:
 *   1. SharedArrayBuffer 기반 원자 카운터
 *   2. Atomics.load/store/add/sub 사용
 */

export class ThreadSafeAtomicCounter {
    private buffer: SharedArrayBuffer;
    private view: Int32Array;

    constructor(initialValue = 0) {
        this.buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
        this.view = new Int32Array(this.buffer);
        Atomics.store(this.view, 0, initialValue);
    }

    /** 원자적 증가 */
    increment(): number {
        return Atomics.add(this.view, 0, 1) + 1;
    }

    /** 원자적 감소 */
    decrement(): number {
        return Atomics.sub(this.view, 0, 1) - 1;
    }

    /** 원자적 덧셈 */
    add(value: number): number {
        return Atomics.add(this.view, 0, value) + value;
    }

    /** 원자적 뺄셈 */
    sub(value: number): number {
        return Atomics.sub(this.view, 0, value) - value;
    }

    /** 현재 값 읽기 */
    load(): number {
        return Atomics.load(this.view, 0);
    }

    /** 값 설정 */
    store(value: number): void {
        Atomics.store(this.view, 0, value);
    }

    /** CAS (Compare And Swap) */
    compareExchange(expected: number, value: number): number {
        return Atomics.compareExchange(this.view, 0, expected, value);
    }

    /** SharedArrayBuffer 반환 (Worker 전달용) */
    getBuffer(): SharedArrayBuffer {
        return this.buffer;
    }

    /** Worker에서 사용할 뷰 생성 */
    static createView(buffer: SharedArrayBuffer): Int32Array {
        return new Int32Array(buffer);
    }
}
