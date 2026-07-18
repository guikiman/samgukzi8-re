/**
 * [13] 공성 땅굴 엔진 — Sapping Tunnel Engine
 *
 * 공성전 중 땅굴 굴착 시 성벽 파괴 타일 범위 및 지연 턴을
 * 매 턴 갱신하는 공성 물리 시뮬레이션 모듈
 */
import type { CityID, HexCoord } from './types.js';
export interface TunnelProgress {
    cityId: CityID;
    startTurn: number;
    currentTurn: number;
    progress: number;
    wallDamage: number;
    targetTile: HexCoord;
    isComplete: boolean;
}
export declare class SappingTunnelEngine {
    private activeTunnels;
    private static readonly TUNNEL_DURATION_TURNS;
    private static readonly DAMAGE_PER_TILE;
    /**
     * 땅굴 굴착 시작
     */
    startTunneling(cityId: CityID, startTurn: number, targetTile: HexCoord): TunnelProgress;
    /**
     * 매 턴 땅굴 진행도 갱신
     */
    updateTunneling(cityId: CityID, currentTurn: number): TunnelProgress | null;
    /**
     * 성벽 파괴 범위 계산
     *
     * 완공 시 targetTile 기준 인접 3헥사까지 성벽 파괴
     */
    getDestructionTiles(cityId: CityID): HexCoord[];
    getTunnel(cityId: CityID): TunnelProgress | null;
    cancelTunneling(cityId: CityID): boolean;
    getAllActiveTunnels(): TunnelProgress[];
    reset(): void;
}
//# sourceMappingURL=sapping_tunnel_engine.d.ts.map