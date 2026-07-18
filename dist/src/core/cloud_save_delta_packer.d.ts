/**
 * [E31] 세이브 데이터 델타 압축 모듈 — CloudSaveDeltaPacker
 *
 * 목적: 전체 게임 세이브 파일 크기를 줄이기 위해 변경된 부분(Delta)만
 *       걸러내어 고속 압축.
 *
 * 핵심 로직:
 *   1. 마지막 저장 시점 JSON 상태 노드 캐싱
 *   2. 현재 상태와 Diff 비교 트리 추출
 *   3. LZ-String 알고리즘으로 바이트 단위 압축
 */
export interface DeltaNode<T> {
    readonly key: string;
    readonly oldValue: T | null;
    readonly newValue: T | null;
}
export interface DeltaPackResult {
    readonly compressedData: string;
    readonly checksum: string;
    readonly deltaNodeCount: number;
    readonly originalSize: number;
    readonly compressedSize: number;
    readonly ratio: number;
}
export declare class CloudSaveDeltaPacker {
    private lastSnapshot;
    /** 현재 스냅샷 저장 (최초 전체 저장용) */
    setBaseSnapshot<T extends Record<string, unknown>>(state: T): void;
    /**
     * 델타 압축 수행
     *
     * @param currentState - 현재 전체 상태 객체
     * @returns 압축된 델타 데이터
     */
    packDelta<T extends Record<string, unknown>>(currentState: T): DeltaPackResult;
    /** 델타 해제 */
    unpackDelta<T>(compressed: string, baseState?: T): T | null;
}
//# sourceMappingURL=cloud_save_delta_packer.d.ts.map