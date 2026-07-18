/**
 * [13] 공성 땅굴 엔진 — Sapping Tunnel Engine
 *
 * 공성전 중 땅굴 굴착 시 성벽 파괴 타일 범위 및 지연 턴을
 * 매 턴 갱신하는 공성 물리 시뮬레이션 모듈
 */
export class SappingTunnelEngine {
    constructor() {
        this.activeTunnels = new Map();
    }
    /**
     * 땅굴 굴착 시작
     */
    startTunneling(cityId, startTurn, targetTile) {
        const tunnel = {
            cityId,
            startTurn,
            currentTurn: startTurn,
            progress: 0,
            wallDamage: 0,
            targetTile,
            isComplete: false,
        };
        this.activeTunnels.set(cityId, tunnel);
        return tunnel;
    }
    /**
     * 매 턴 땅굴 진행도 갱신
     */
    updateTunneling(cityId, currentTurn) {
        const tunnel = this.activeTunnels.get(cityId);
        if (!tunnel || tunnel.isComplete)
            return null;
        tunnel.currentTurn = currentTurn;
        const elapsedTurns = currentTurn - tunnel.startTurn;
        tunnel.progress = Math.min(1.0, elapsedTurns / SappingTunnelEngine.TUNNEL_DURATION_TURNS);
        if (tunnel.progress >= 1.0) {
            tunnel.isComplete = true;
            tunnel.wallDamage += SappingTunnelEngine.DAMAGE_PER_TILE;
        }
        return tunnel;
    }
    /**
     * 성벽 파괴 범위 계산
     *
     * 완공 시 targetTile 기준 인접 3헥사까지 성벽 파괴
     */
    getDestructionTiles(cityId) {
        const tunnel = this.activeTunnels.get(cityId);
        if (!tunnel || !tunnel.isComplete)
            return [];
        const dirs = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
            [2, 0], [1, 1], [-1, 2], [-2, 1], [-2, 0], [-1, -1], [1, -2], [2, -1],
        ];
        const tiles = [tunnel.targetTile];
        for (const [dq, dr] of dirs) {
            tiles.push({ q: tunnel.targetTile.q + dq, r: tunnel.targetTile.r + dr });
        }
        return tiles;
    }
    getTunnel(cityId) {
        return this.activeTunnels.get(cityId) ?? null;
    }
    cancelTunneling(cityId) {
        return this.activeTunnels.delete(cityId);
    }
    getAllActiveTunnels() {
        return Array.from(this.activeTunnels.values()).filter(t => !t.isComplete);
    }
    reset() {
        this.activeTunnels.clear();
    }
}
SappingTunnelEngine.TUNNEL_DURATION_TURNS = 4; // 기본 완공 턴 수
SappingTunnelEngine.DAMAGE_PER_TILE = 50; // 타일당 성벽 데미지
//# sourceMappingURL=sapping_tunnel_engine.js.map