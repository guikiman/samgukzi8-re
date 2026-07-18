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

export class SharedArrayBufferPipeline {
  private buffer: SharedArrayBuffer | null = null;
  private layout: PipelineLayout | null = null;
  private view32: Int32Array | null = null;
  private viewFloat: Float32Array | null = null;

  /**
   * SharedArrayBuffer 사용 가능 여부 확인
   */
  static isAvailable(): boolean {
    try {
      const buf = new SharedArrayBuffer(4);
      return buf.byteLength === 4;
    } catch {
      return false;
    }
  }

  /**
   * 파이프라인 초기화
   */
  initialize(
    maxVertices: number,
    maxInstances: number,
    uniformSizeBytes: number,
  ): void {
    const ALIGN_16 = 16;

    // alignment to 16 bytes
    const vertexSize = maxVertices * 8; // vec2 position + vec2 texcoord = 16 bytes per vertex
    const vertexAligned = Math.ceil(vertexSize / ALIGN_16) * ALIGN_16;

    const instanceSize = maxInstances * 16; // vec4 per instance
    const instanceAligned = Math.ceil(instanceSize / ALIGN_16) * ALIGN_16;

    const uniformAligned = Math.ceil(uniformSizeBytes / ALIGN_16) * ALIGN_16;
    const counterAligned = 16; // 4 x int32

    const total = vertexAligned + instanceAligned + uniformAligned + counterAligned;

    this.layout = {
      vertexOffset: 0,
      instanceOffset: vertexAligned,
      uniformOffset: vertexAligned + instanceAligned,
      counterOffset: vertexAligned + instanceAligned + uniformAligned,
      totalSize: total,
    };

    this.buf = new SharedArrayBuffer(total);
    this.view32 = new Int32Array(this.buf);
    this.viewFloat = new Float32Array(this.buf);
  }

  /**
   * 공유 버퍼 획득
   */
  getSharedBuffer(): SharedArrayBuffer {
    if (!this.buf) throw new Error("[SharedArrayBufferPipeline] Not initialized");
    return this.buf;
  }
  private buf: SharedArrayBuffer | null = null;

  /**
   * 내부 버퍼 설정 (초기화 시)
   */
  private setBuffer(buf: SharedArrayBuffer): void {
    this.buf = buf;
  }

  /**
   * 파이프라인 레이아웃
   */
  getLayout(): PipelineLayout {
    if (!this.layout) throw new Error("[SharedArrayBufferPipeline] Not initialized");
    return this.layout;
  }

  /**
   * Float32 데이터 쓰기
   */
  write(data: Float32Array, offset: number): void {
    if (!this.viewFloat) throw new Error("[SharedArrayBufferPipeline] Not initialized");
    this.viewFloat.set(data, offset / 4);
  }

  /**
   * Float32 데이터 읽기
   */
  read(offset: number, length: number): Float32Array {
    if (!this.viewFloat) throw new Error("[SharedArrayBufferPipeline] Not initialized");
    const start = offset / 4;
    return this.viewFloat.slice(start, start + length);
  }

  /**
   * Atomics 카운터 값 조회
   */
  getAtomicsCounter(): number {
    if (!this.view32 || !this.layout) return 0;
    const idx = this.layout.counterOffset / 4;
    return Atomics.load(this.view32, idx);
  }

  /**
   * Atomics 카운터 값 설정
   */
  setAtomicsCounter(value: number): void {
    if (!this.view32 || !this.layout) return;
    const idx = this.layout.counterOffset / 4;
    Atomics.store(this.view32, idx, value);
  }

  /**
   * Worker에 notify (wake up)
   */
  notifyWorker(worker: Worker, value: number = 1): void {
    worker.postMessage({ type: "__shared_buffer_signal__", value });
  }

  /**
   * 메인 스레드에서 대기
   */
  waitOnMain(timeout: number = 1000): "ok" | "not-equal" | "timed-out" {
    if (!this.view32 || !this.layout) return "timed-out";
    const idx = this.layout.counterOffset / 4;
    return Atomics.wait(this.view32, idx, 0, timeout);
  }

  /**
   * 정리
   */
  dispose(): void {
    this.buf = null;
    this.view32 = null;
    this.viewFloat = null;
    this.layout = null;
  }
}
