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
    constructor(initialValue = 0) {
        this.buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
        this.view = new Int32Array(this.buffer);
        Atomics.store(this.view, 0, initialValue);
    }
    /** 원자적 증가 */
    increment() {
        return Atomics.add(this.view, 0, 1) + 1;
    }
    /** 원자적 감소 */
    decrement() {
        return Atomics.sub(this.view, 0, 1) - 1;
    }
    /** 원자적 덧셈 */
    add(value) {
        return Atomics.add(this.view, 0, value) + value;
    }
    /** 원자적 뺄셈 */
    sub(value) {
        return Atomics.sub(this.view, 0, value) - value;
    }
    /** 현재 값 읽기 */
    load() {
        return Atomics.load(this.view, 0);
    }
    /** 값 설정 */
    store(value) {
        Atomics.store(this.view, 0, value);
    }
    /** CAS (Compare And Swap) */
    compareExchange(expected, value) {
        return Atomics.compareExchange(this.view, 0, expected, value);
    }
    /** SharedArrayBuffer 반환 (Worker 전달용) */
    getBuffer() {
        return this.buffer;
    }
    /** Worker에서 사용할 뷰 생성 */
    static createView(buffer) {
        return new Int32Array(buffer);
    }
}
//# sourceMappingURL=thread_safe_atomic_counter.js.map