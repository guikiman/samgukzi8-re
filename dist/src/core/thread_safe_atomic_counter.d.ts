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
export declare class ThreadSafeAtomicCounter {
    private buffer;
    private view;
    constructor(initialValue?: number);
    /** 원자적 증가 */
    increment(): number;
    /** 원자적 감소 */
    decrement(): number;
    /** 원자적 덧셈 */
    add(value: number): number;
    /** 원자적 뺄셈 */
    sub(value: number): number;
    /** 현재 값 읽기 */
    load(): number;
    /** 값 설정 */
    store(value: number): void;
    /** CAS (Compare And Swap) */
    compareExchange(expected: number, value: number): number;
    /** SharedArrayBuffer 반환 (Worker 전달용) */
    getBuffer(): SharedArrayBuffer;
    /** Worker에서 사용할 뷰 생성 */
    static createView(buffer: SharedArrayBuffer): Int32Array;
}
//# sourceMappingURL=thread_safe_atomic_counter.d.ts.map