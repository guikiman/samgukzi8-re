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
export class FrustumCuller {
    constructor() {
        this.planes = [];
        this._visibleCount = 0;
        this._culledCount = 0;
    }
    /**
     * 뷰-프로젝션 행렬에서 6개 평면 추출
     * 평면 순서: left, right, bottom, top, near, far
     */
    update(projectionMatrix, viewMatrix) {
        const vp = new Float32Array(16);
        this.multiplyMat4(vp, projectionMatrix, viewMatrix);
        const m = vp;
        this.planes = [
            // Left: row0 + row3
            { nx: m[3] + m[0], ny: m[7] + m[4], nz: m[11] + m[8], d: m[15] + m[12] },
            // Right: row3 - row0
            { nx: m[3] - m[0], ny: m[7] - m[4], nz: m[11] - m[8], d: m[15] - m[12] },
            // Bottom: row1 + row3
            { nx: m[3] + m[1], ny: m[7] + m[5], nz: m[11] + m[9], d: m[15] + m[13] },
            // Top: row3 - row1
            { nx: m[3] - m[1], ny: m[7] - m[5], nz: m[11] - m[9], d: m[15] - m[13] },
            // Near: row2 + row3
            { nx: m[3] + m[2], ny: m[7] + m[6], nz: m[11] + m[10], d: m[15] + m[14] },
            // Far: row3 - row2
            { nx: m[3] - m[2], ny: m[7] - m[6], nz: m[11] - m[10], d: m[15] - m[14] },
        ];
        // Normalize planes
        for (const p of this.planes) {
            const len = Math.sqrt(p.nx * p.nx + p.ny * p.ny + p.nz * p.nz);
            if (len > 0) {
                p.nx = p.nx / len;
                p.ny = p.ny / len;
                p.nz = p.nz / len;
                p.d = p.d / len;
            }
        }
    }
    /**
     * 구체-프러스텀 가시성 검사
     */
    isVisible(worldX, worldY, worldZ, radius) {
        for (const p of this.planes) {
            const dist = p.nx * worldX + p.ny * worldY + p.nz * worldZ + p.d;
            if (dist < -radius)
                return false;
        }
        return true;
    }
    /**
     * AABB-프러스텀 가시성 검사
     */
    isAABBVisible(min, max) {
        for (const p of this.planes) {
            const px = p.nx >= 0 ? max[0] : min[0];
            const py = p.ny >= 0 ? max[1] : min[1];
            const pz = p.nz >= 0 ? max[2] : min[2];
            if (p.nx * px + p.ny * py + p.nz * pz + p.d < 0)
                return false;
        }
        return true;
    }
    /**
     * 헥사곤 타일 컬링
     */
    cullHexTiles(tiles) {
        this._visibleCount = 0;
        this._culledCount = 0;
        const visible = [];
        for (const tile of tiles) {
            if (this.isVisible(tile.worldPos[0], tile.worldPos[1], tile.worldPos[2], tile.radius)) {
                visible.push(tile);
                this._visibleCount++;
            }
            else {
                this._culledCount++;
            }
        }
        return visible;
    }
    get visibleCount() {
        return this._visibleCount;
    }
    get culledCount() {
        return this._culledCount;
    }
    multiplyMat4(out, a, b) {
        for (let i = 0; i < 4; i++) {
            const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
            out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
            out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
            out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
            out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
        }
    }
}
//# sourceMappingURL=frustum_culler.js.map