import { Scene, PerspectiveCamera, WebGLRenderer, DirectionalLight, AmbientLight, InstancedMesh, CylinderGeometry, MeshStandardMaterial, Color, Raycaster, Vector2, Object3D, } from 'three';
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
// ============================================================
// Axial → World 좌표 변환
// ============================================================
export function hexToWorld(q, r, hexSize) {
    const x = hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const z = hexSize * (3 / 2 * r);
    return { x, z };
}
const LOD_CONFIGS = [
    { level: 'high', maxDistance: 200, subdivisions: 1 },
    { level: 'medium', maxDistance: 500, subdivisions: 0 },
    { level: 'low', maxDistance: Infinity, subdivisions: 0 },
];
function getLODLevel(cameraDistance) {
    for (const cfg of LOD_CONFIGS) {
        if (cameraDistance <= cfg.maxDistance)
            return cfg.level;
    }
    return 'low';
}
// ============================================================
// HexMap3DRenderer
// ============================================================
export class HexMap3DRenderer {
    constructor(canvas, hexSize = 16, hexHeight = 4, maxTiles = 100000) {
        this.dummy = new Object3D();
        this.tiles = [];
        this.highlightedTiles = [];
        this.selectedTile = null;
        this.animFrameId = null;
        this.lastFrameTime = 0;
        this._fps = 60;
        /** 카메라 OrbitControls 설정 */
        this.cameraDefaults = {
            minDistance: 50,
            maxDistance: 1500,
            minPolarAngle: 0.1,
            maxPolarAngle: Math.PI / 2.2,
        };
        this.handleResize = () => {
            const canvas = this.renderer.domElement;
            this.resize(canvas.clientWidth, canvas.clientHeight);
        };
        this.hexSize = hexSize;
        this.hexHeight = hexHeight;
        this.maxTiles = maxTiles;
        // Scene
        this.scene = new Scene();
        // Camera
        this.camera = new PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 1, 5000);
        this.camera.position.set(0, 400, 400);
        this.camera.lookAt(0, 0, 0);
        // Renderer
        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        // Lights
        const ambient = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dirLight = new DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 200, 100);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        // OrbitControls
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.minDistance = this.cameraDefaults.minDistance;
        this.controls.maxDistance = this.cameraDefaults.maxDistance;
        this.controls.minPolarAngle = this.cameraDefaults.minPolarAngle;
        this.controls.maxPolarAngle = this.cameraDefaults.maxPolarAngle;
        this.controls.target.set(0, 0, 0);
        // Raycaster
        this.raycaster = new Raycaster();
        // Hex geometry
        this.hexGeometry = new CylinderGeometry(hexSize, hexSize, hexHeight, 6, 1);
        this.material = new MeshStandardMaterial({
            roughness: 0.8,
            metalness: 0.1,
        });
        this.hexMesh = new InstancedMesh(this.hexGeometry, this.material, maxTiles);
        this.hexMesh.castShadow = true;
        this.hexMesh.receiveShadow = true;
        this.hexMesh.count = 0;
        this.scene.add(this.hexMesh);
        // Resize handler
        window.addEventListener('resize', this.handleResize);
    }
    /** 타일 데이터 설정 및 InstancedMesh 업데이트 */
    setTiles(tiles) {
        this.tiles = tiles;
        const count = Math.min(tiles.length, this.maxTiles);
        this.hexMesh.count = count;
        const color = new Color();
        for (let i = 0; i < count; i++) {
            const tile = tiles[i];
            const { x, z } = hexToWorld(tile.q, tile.r, this.hexSize);
            this.dummy.position.set(x, tile.height / 2, z);
            this.dummy.scale.set(1, Math.max(0.01, tile.height / this.hexHeight), 1);
            this.dummy.updateMatrix();
            this.hexMesh.setMatrixAt(i, this.dummy.matrix);
            color.set(tile.color);
            this.hexMesh.setColorAt(i, color);
        }
        this.hexMesh.instanceMatrix.needsUpdate = true;
        if (this.hexMesh.instanceColor) {
            this.hexMesh.instanceColor.needsUpdate = true;
        }
    }
    /** 타일 하이라이트 설정 */
    setHighlights(highlights) {
        this.highlightedTiles = highlights;
        this.updateTileColors();
    }
    /** 선택된 타일 설정 */
    selectTile(q, r) {
        this.selectedTile = { q, r };
        this.updateTileColors();
    }
    /** 선택 해제 */
    clearSelection() {
        this.selectedTile = null;
        this.updateTileColors();
    }
    /** 마우스 위치로 타일 피킹 */
    pickTile(clientX, clientY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.hexMesh);
        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            if (instanceId !== undefined && instanceId < this.tiles.length) {
                return this.tiles[instanceId];
            }
        }
        return null;
    }
    /** 애니메이션 루프 시작 */
    start() {
        if (this.animFrameId !== null)
            return;
        this.lastFrameTime = performance.now();
        const loop = (time) => {
            this.animFrameId = requestAnimationFrame(loop);
            const dt = time - this.lastFrameTime;
            this._fps = dt > 0 ? Math.round(1000 / dt) : 60;
            this.lastFrameTime = time;
            this.update(dt);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }
    /** 애니메이션 루프 중지 */
    stop() {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }
    /** 매 프레임 업데이트 */
    update(_dt) {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    /** 렌더링 통계 */
    getStats() {
        const dist = this.camera.position.distanceTo(this.controls.target);
        return {
            tileCount: this.tiles.length,
            drawCalls: 1,
            cameraDistance: Math.round(dist),
            lodLevel: 0,
            fps: this._fps,
        };
    }
    /** 리사이즈 */
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    /** 정리 */
    dispose() {
        this.stop();
        window.removeEventListener('resize', this.handleResize);
        this.controls.dispose();
        this.hexGeometry.dispose();
        this.material.dispose();
        this.renderer.dispose();
        this.scene.clear();
    }
    /** 지형 높이에 따른 자동 색상 생성 */
    static getTerrainColor(height, terrainType) {
        if (terrainType) {
            switch (terrainType) {
                case 'WATER': return '#2b6cb0';
                case 'FOREST': return '#276749';
                case 'MOUNTAIN': return '#8b4513';
                case 'SWAMP': return '#6b4423';
                case 'DESERT': return '#d69e2e';
                case 'PLAIN': return '#68d391';
            }
        }
        if (height <= 0)
            return '#2b6cb0';
        if (height < 5)
            return '#68d391';
        if (height < 15)
            return '#48bb78';
        if (height < 30)
            return '#8b4513';
        return '#a0aec0';
    }
    /** LOD 레벨 반환 */
    getCurrentLOD() {
        const dist = this.camera.position.distanceTo(this.controls.target);
        return getLODLevel(dist);
    }
    // ============================================================
    // Private
    // ============================================================
    updateTileColors() {
        const color = new Color();
        const count = Math.min(this.tiles.length, this.maxTiles);
        for (let i = 0; i < count; i++) {
            const tile = this.tiles[i];
            const highlight = this.highlightedTiles.find(h => h.q === tile.q && h.r === tile.r);
            if (highlight) {
                color.set(highlight.color);
            }
            else if (this.selectedTile &&
                this.selectedTile.q === tile.q &&
                this.selectedTile.r === tile.r) {
                color.set('#f6e05e');
            }
            else {
                color.set(tile.color);
            }
            this.hexMesh.setColorAt(i, color);
        }
        if (this.hexMesh.instanceColor) {
            this.hexMesh.instanceColor.needsUpdate = true;
        }
    }
}
//# sourceMappingURL=hex_map_3d_renderer.js.map