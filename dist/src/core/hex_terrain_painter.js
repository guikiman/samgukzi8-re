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
const TERRAIN_STYLES = {
    plain: { baseColor: [0.4, 0.7, 0.3], textureId: "plain", roughness: 0.3 },
    forest: { baseColor: [0.1, 0.5, 0.1], textureId: "forest", roughness: 0.8 },
    mountain: { baseColor: [0.5, 0.4, 0.3], textureId: "mountain", roughness: 1.0 },
    water: { baseColor: [0.2, 0.4, 0.8], textureId: "water", roughness: 0.1 },
    swamp: { baseColor: [0.3, 0.5, 0.3], textureId: "swamp", roughness: 0.6 },
    desert: { baseColor: [0.8, 0.7, 0.3], textureId: "desert", roughness: 0.4 },
    snow: { baseColor: [0.9, 0.9, 1.0], textureId: "snow", roughness: 0.2 },
    road: { baseColor: [0.6, 0.5, 0.3], textureId: "road", roughness: 0.2 },
    wall: { baseColor: [0.5, 0.4, 0.3], textureId: "wall", roughness: 0.9 },
};
export class HexTerrainPainter {
    /**
     * 지형 타입별 스타일 반환
     */
    getStyle(terrain) {
        return TERRAIN_STYLES[terrain];
    }
    /**
     * 고도 기반 색상 혼합
     */
    blendWithElevation(baseColor, elevation) {
        const factor = elevation / 10;
        return [
            baseColor[0] + factor * 0.1,
            baseColor[1] + factor * 0.1,
            baseColor[2] + factor * 0.05,
        ];
    }
}
//# sourceMappingURL=hex_terrain_painter.js.map