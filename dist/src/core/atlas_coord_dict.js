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
export class AtlasCoordDict {
    constructor() {
        this.regions = new Map();
    }
    /**
     * 리전 등록
     */
    register(name, u, v, w, h) {
        this.regions.set(name, { u, v, w, h, name });
    }
    /**
     * 리전 조회
     */
    get(name) {
        return this.regions.get(name);
    }
    /**
     * 리전 제거
     */
    unregister(name) {
        this.regions.delete(name);
    }
    /**
     * 이름으로 존재 여부 확인
     */
    has(name) {
        return this.regions.has(name);
    }
    /**
     * 등록된 모든 리전 목록
     */
    getAll() {
        return Array.from(this.regions.values());
    }
    /**
     * 등록된 리전 수
     */
    get size() {
        return this.regions.size;
    }
    /**
     * 전체 초기화
     */
    clear() {
        this.regions.clear();
    }
    /**
     * UV 좌표를 픽셀 좌표로 변환
     */
    uvToPixel(region, atlasWidth, atlasHeight) {
        return {
            x: Math.round(region.u * atlasWidth),
            y: Math.round(region.v * atlasHeight),
            w: Math.round(region.w * atlasWidth),
            h: Math.round(region.h * atlasHeight),
        };
    }
}
//# sourceMappingURL=atlas_coord_dict.js.map