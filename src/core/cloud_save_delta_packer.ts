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

function simpleChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString(16);
}

/** LZ-String 유사 단순 압축 (실제론 npm 라이브러리 사용 권장) */
function simpleLZCompress(data: string): string {
    // 자리표시: 실제론 lz-string 또는 gzip 사용
    return btoa(encodeURIComponent(data));
}

function simpleLZDecompress(data: string): string {
    return decodeURIComponent(atob(data));
}

export class CloudSaveDeltaPacker {
    private lastSnapshot: string | null = null;

    /** 현재 스냅샷 저장 (최초 전체 저장용) */
    setBaseSnapshot<T extends Record<string, unknown>>(state: T): void {
        this.lastSnapshot = JSON.stringify(state);
    }

    /**
     * 델타 압축 수행
     *
     * @param currentState - 현재 전체 상태 객체
     * @returns 압축된 델타 데이터
     */
    packDelta<T extends Record<string, unknown>>(currentState: T): DeltaPackResult {
        const currentJson = JSON.stringify(currentState);
        const originalSize = currentJson.length;

        let compressedData: string;
        let deltaNodeCount = 0;

        if (this.lastSnapshot) {
            // Diff 비교
            const last = JSON.parse(this.lastSnapshot) as Record<string, unknown>;
            const current = currentState as Record<string, unknown>;
            const deltas: DeltaNode<unknown>[] = [];

            const allKeys = new Set([...Object.keys(last), ...Object.keys(current)]);
            for (const key of allKeys) {
                const oldVal = key in last ? last[key] : null;
                const newVal = key in current ? current[key] : null;
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    deltas.push({ key, oldValue: oldVal ?? null, newValue: newVal ?? null });
                }
            }

            deltaNodeCount = deltas.length;
            const deltaJson = JSON.stringify(deltas);
            compressedData = simpleLZCompress(deltaJson);
        } else {
            // 최초 저장: 전체 압축
            compressedData = simpleLZCompress(currentJson);
            deltaNodeCount = Object.keys(currentState).length;
        }

        this.lastSnapshot = currentJson;

        return {
            compressedData,
            checksum: simpleChecksum(currentJson),
            deltaNodeCount,
            originalSize,
            compressedSize: compressedData.length,
            ratio: originalSize > 0 ? compressedData.length / originalSize : 0,
        };
    }

    /** 델타 해제 */
    unpackDelta<T>(compressed: string, baseState?: T): T | null {
        try {
            const json = simpleLZDecompress(compressed);
            return JSON.parse(json) as T;
        } catch {
            return null;
        }
    }
}
