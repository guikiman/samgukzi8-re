/**
 * [Task 61] SharedArrayBuffer 파이프라인 — SharedArrayBufferPipeline
 *
 * 목적: Web Worker 간 제로카피 데이터 공유를 위한
 *       SharedArrayBuffer 기반 파이프라인.
 *
 * 핵심 로직:
 *   1. SharedArrayBuffer 할당 및 레이아웃 관리
 *   2. Atomics 기반 동기화 (wait/notify)
 *   3. 크로스-오리진 격리(isolation) 검증
 */
export interface PipelineLayout {
    readonly vertexOffset: number;
    readonly instanceOffset: number;
    readonly uniformOffset: number;
    readonly counterOffset: number;
    readonly totalSize: number;
}
export declare class SharedArrayBufferPipeline {
    private buffer;
    private layout;
    private view32;
    private viewFloat;
    /**
     * SharedArrayBuffer 사용 가능 여부 확인
     */
    static isAvailable(): boolean;
    /**
     * 파이프라인 초기화
     */
    initialize(maxVertices: number, maxInstances: number, uniformSizeBytes: number): void;
    /**
     * 공유 버퍼 획득
     */
    getSharedBuffer(): SharedArrayBuffer;
    private buf;
    /**
     * 내부 버퍼 설정 (초기화 시)
     */
    private setBuffer;
    /**
     * 파이프라인 레이아웃
     */
    getLayout(): PipelineLayout;
    /**
     * Float32 데이터 쓰기
     */
    write(data: Float32Array, offset: number): void;
    /**
     * Float32 데이터 읽기
     */
    read(offset: number, length: number): Float32Array;
    /**
     * Atomics 카운터 값 조회
     */
    getAtomicsCounter(): number;
    /**
     * Atomics 카운터 값 설정
     */
    setAtomicsCounter(value: number): void;
    /**
     * Worker에 notify (wake up)
     */
    notifyWorker(worker: Worker, value?: number): void;
    /**
     * 메인 스레드에서 대기
     */
    waitOnMain(timeout?: number): "ok" | "not-equal" | "timed-out";
    /**
     * 정리
     */
    dispose(): void;
}
//# sourceMappingURL=shared_array_buffer_pipeline.d.ts.map