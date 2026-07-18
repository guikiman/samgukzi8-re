/**
 * [Task 86] 헥스 지형 페인터 — HexTerrainPainter
 *
 * 목적: 헥스 타일에 지형별 텍스처와 색상을
 *       적용하여 지형 시각화.
 *
 * 핵심 로직:
 *   1. 지형 타입별 색상/텍스처 매핑
 *   2. 고도 기반 색상 혼합
 */
export type TerrainType = "plain" | "forest" | "mountain" | "water" | "swamp" | "desert" | "snow" | "road" | "wall";
export interface TerrainStyle {
    readonly baseColor: [number, number, number];
    readonly textureId: string;
    readonly roughness: number;
}
export declare class HexTerrainPainter {
    /**
     * 지형 타입별 스타일 반환
     */
    getStyle(terrain: TerrainType): TerrainStyle;
    /**
     * 고도 기반 색상 혼합
     */
    blendWithElevation(baseColor: [number, number, number], elevation: number): [number, number, number];
}
//# sourceMappingURL=hex_terrain_painter.d.ts.map