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
    progress: number;    // 0.0 ~ 1.0
    wallDamage: number;  // 누적 성벽 데미지
    targetTile: HexCoord;
    isComplete: boolean;
}

export class SappingTunnelEngine {
    private activeTunnels: Map<CityID, TunnelProgress> = new Map();
    private static readonly TUNNEL_DURATION_TURNS = 4; // 기본 완공 턴 수
    private static readonly DAMAGE_PER_TILE = 50;      // 타일당 성벽 데미지

    /**
     * 땅굴 굴착 시작
     */
    startTunneling(cityId: CityID, startTurn: number, targetTile: HexCoord): TunnelProgress {
        const tunnel: TunnelProgress = {
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
    updateTunneling(cityId: CityID, currentTurn: number): TunnelProgress | null {
        const tunnel = this.activeTunnels.get(cityId);
        if (!tunnel || tunnel.isComplete) return null;

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
    getDestructionTiles(cityId: CityID): HexCoord[] {
        const tunnel = this.activeTunnels.get(cityId);
        if (!tunnel || !tunnel.isComplete) return [];

        const dirs: [number, number][] = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
            [2, 0], [1, 1], [-1, 2], [-2, 1], [-2, 0], [-1, -1], [1, -2], [2, -1],
        ];

        const tiles: HexCoord[] = [tunnel.targetTile];
        for (const [dq, dr] of dirs) {
            tiles.push({ q: tunnel.targetTile.q + dq, r: tunnel.targetTile.r + dr });
        }
        return tiles;
    }

    getTunnel(cityId: CityID): TunnelProgress | null {
        return this.activeTunnels.get(cityId) ?? null;
    }

    cancelTunneling(cityId: CityID): boolean {
        return this.activeTunnels.delete(cityId);
    }

    getAllActiveTunnels(): TunnelProgress[] {
        return Array.from(this.activeTunnels.values()).filter(t => !t.isComplete);
    }

    reset(): void {
        this.activeTunnels.clear();
    }
}
