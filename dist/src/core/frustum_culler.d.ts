/**
 * [Task 57] 프러스텀 컬링 — FrustumCuller
 *
 * 목적: 뷰-프로젝션 행렬에서 6개의 절두체 평면을 추출하여
 *       헥사곤 타일 가시성 판정.
 *
 * 핵심 로직:
 *   1. viewProjection 행렬 → 6 frustum 평면 추출
 *   2. 구체-평면 교차 검사 (sphere-frustum)
 *   3. AABB-평면 교차 검사
 */
export interface HexTile {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly worldPos: [number, number, number];
    readonly radius: number;
}
export declare class FrustumCuller {
    private planes;
    private _visibleCount;
    private _culledCount;
    /**
     * 뷰-프로젝션 행렬에서 6개 평면 추출
     * 평면 순서: left, right, bottom, top, near, far
     */
    update(projectionMatrix: Float32Array, viewMatrix: Float32Array): void;
    /**
     * 구체-프러스텀 가시성 검사
     */
    isVisible(worldX: number, worldY: number, worldZ: number, radius: number): boolean;
    /**
     * AABB-프러스텀 가시성 검사
     */
    isAABBVisible(min: Float32Array, max: Float32Array): boolean;
    /**
     * 헥사곤 타일 컬링
     */
    cullHexTiles(tiles: readonly HexTile[]): HexTile[];
    get visibleCount(): number;
    get culledCount(): number;
    private multiplyMat4;
}
//# sourceMappingURL=frustum_culler.d.ts.map