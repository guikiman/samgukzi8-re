/**
 * [E46] GPU 텍스처 아틀라스 팩커 — GPUTextureAtlasPacker
 *
 * 목적: 수백 개의 개별 텍스처를 하나의 큰 아틀라스로 묶어
 *       GPU 드로우콜 횟수를 극적으로 감소.
 *
 * 핵심 로직:
 *   1. MaxRects 알고리즘으로 빈 공간 최적화
 *   2. 각 텍스처의 UV 좌표 반환
 */
export interface AtlasRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export interface PackedTexture {
    readonly id: string;
    readonly rect: AtlasRect;
    readonly uv: {
        u: number;
        v: number;
        u2: number;
        v2: number;
    };
}
export declare class GPUTextureAtlasPacker {
    private readonly atlasWidth;
    private readonly atlasHeight;
    private freeRects;
    private packed;
    constructor(atlasWidth?: number, atlasHeight?: number);
    /** 텍스처를 아틀라스에 패킹 */
    pack(id: string, width: number, height: number): PackedTexture | null;
    /** MaxRects: 최적 빈 공간 탐색 */
    private findBestFit;
    /** 빈 공간 분할 */
    private splitFreeRect;
    /** 인접 빈 공간 병합 */
    private mergeFreeRects;
    /** 텍스처 제거 */
    remove(id: string): void;
    /** 아틀라스 사용률 */
    getUtilization(): number;
    /** 모든 텍스처 초기화 */
    clear(): void;
}
//# sourceMappingURL=gpu_texture_atlas_packer.d.ts.map