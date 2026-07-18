import { Scene, PerspectiveCamera, WebGLRenderer, Raycaster } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
/**
 * [36-50] 삼국지 8 리메이크 — 3D 헥사곤 맵 렌더러
 *
 * Three.js InstancedMesh 기반 대규모 헥사곤 타일 렌더링
 * LOD(Level of Detail), Raycaster Pick, OrbitControls 통합
 *
 * @checklist [36] Three.js 셋업
 * @checklist [37] InstancedMesh 헥사곤
 * @checklist [38] LOD 시스템
 * @checklist [39] Raycaster 타일 피킹
 * @checklist [40] 카메라 OrbitControls
 * @checklist [41] 지형 높이 시각화
 * @checklist [42] 타일 하이라이트/선택
 * @checklist [43] 확대/축소 경계
 * @checklist [44] 미니맵 좌표 동기화
 * @checklist [45] 성능 모니터링
 */
export declare function hexToWorld(q: number, r: number, hexSize: number): {
    x: number;
    z: number;
};
export interface HexTileData {
    readonly q: number;
    readonly r: number;
    readonly height: number;
    readonly color: string;
    readonly label?: string;
    readonly terrainType?: 'PLAIN' | 'FOREST' | 'MOUNTAIN' | 'WATER' | 'SWAMP' | 'DESERT';
}
export interface TileHighlight {
    readonly q: number;
    readonly r: number;
    readonly color: string;
}
export interface RenderStats {
    readonly tileCount: number;
    readonly drawCalls: number;
    readonly cameraDistance: number;
    readonly lodLevel: number;
    readonly fps: number;
}
export type LODLevel = 'high' | 'medium' | 'low';
export declare class HexMap3DRenderer {
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    readonly renderer: WebGLRenderer;
    readonly controls: OrbitControls;
    readonly raycaster: Raycaster;
    private readonly hexMesh;
    private readonly dummy;
    private readonly hexSize;
    private readonly hexHeight;
    private readonly hexGeometry;
    private readonly material;
    private tiles;
    private highlightedTiles;
    private selectedTile;
    private animFrameId;
    private lastFrameTime;
    private _fps;
    /** 최대 타일 수 */
    readonly maxTiles: number;
    /** 카메라 OrbitControls 설정 */
    readonly cameraDefaults: {
        minDistance: number;
        maxDistance: number;
        minPolarAngle: number;
        maxPolarAngle: number;
    };
    constructor(canvas: HTMLCanvasElement, hexSize?: number, hexHeight?: number, maxTiles?: number);
    /** 타일 데이터 설정 및 InstancedMesh 업데이트 */
    setTiles(tiles: HexTileData[]): void;
    /** 타일 하이라이트 설정 */
    setHighlights(highlights: TileHighlight[]): void;
    /** 선택된 타일 설정 */
    selectTile(q: number, r: number): void;
    /** 선택 해제 */
    clearSelection(): void;
    /** 마우스 위치로 타일 피킹 */
    pickTile(clientX: number, clientY: number): HexTileData | null;
    /** 애니메이션 루프 시작 */
    start(): void;
    /** 애니메이션 루프 중지 */
    stop(): void;
    /** 매 프레임 업데이트 */
    update(_dt: number): void;
    /** 렌더링 통계 */
    getStats(): RenderStats;
    /** 리사이즈 */
    resize(width: number, height: number): void;
    /** 정리 */
    dispose(): void;
    /** 지형 높이에 따른 자동 색상 생성 */
    static getTerrainColor(height: number, terrainType?: HexTileData['terrainType']): string;
    /** LOD 레벨 반환 */
    getCurrentLOD(): LODLevel;
    private updateTileColors;
    private readonly handleResize;
}
//# sourceMappingURL=hex_map_3d_renderer.d.ts.map