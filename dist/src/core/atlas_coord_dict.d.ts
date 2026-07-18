/**
 * [Task 67] 아틀라스 좌표 사전 — AtlasCoordDict
 *
 * 목적: 텍스처 아틀라스 내 각 리전(sprites, UI 요소)의
 *       UV 좌표를 이름 기반으로 조회하는 사전.
 *
 * 핵심 로직:
 *   1. 이름 → { u, v, w, h } 매핑
 *   2. 동적 리전 등록 및 제거
 */
export interface AtlasRegion {
    readonly u: number;
    readonly v: number;
    readonly w: number;
    readonly h: number;
    readonly name: string;
}
export declare class AtlasCoordDict {
    private regions;
    /**
     * 리전 등록
     */
    register(name: string, u: number, v: number, w: number, h: number): void;
    /**
     * 리전 조회
     */
    get(name: string): AtlasRegion | undefined;
    /**
     * 리전 제거
     */
    unregister(name: string): void;
    /**
     * 이름으로 존재 여부 확인
     */
    has(name: string): boolean;
    /**
     * 등록된 모든 리전 목록
     */
    getAll(): AtlasRegion[];
    /**
     * 등록된 리전 수
     */
    get size(): number;
    /**
     * 전체 초기화
     */
    clear(): void;
    /**
     * UV 좌표를 픽셀 좌표로 변환
     */
    uvToPixel(region: AtlasRegion, atlasWidth: number, atlasHeight: number): {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}
//# sourceMappingURL=atlas_coord_dict.d.ts.map