/**
 * [16] 코끼리 광폭화 로직 — Elephant Rampage Logic
 *
 * 남만 코끼리병이 화공 피해를 입을 시 광폭화 상태로 변해
 * 피아 식별 없이 주변 6개 인접 헥스를 타격
 */

import type { HexCoord } from './types.js';

export interface RampageState {
    elephantUnitId: string;
    targetPosition: HexCoord;
    rampageDamage: number;
    triggeredByFire: boolean;
    remainingTurns: number;
    isActive: boolean;
}

export class ElephantRampageLogic {
    private rampages: Map<string, RampageState> = new Map();
    private static readonly RAMPAGE_DAMAGE_MULTIPLIER = 2.0;
    private static readonly RAMPAGE_DURATION_TURNS = 2;

    /**
     * 화공 피해 입음 → 광폭화 발동 조건 검사
     */
    onFireDamage(elephantUnitId: string, position: HexCoord, baseDamage: number): RampageState | null {
        const state: RampageState = {
            elephantUnitId,
            targetPosition: position,
            rampageDamage: Math.floor(baseDamage * ElephantRampageLogic.RAMPAGE_DAMAGE_MULTIPLIER),
            triggeredByFire: true,
            remainingTurns: ElephantRampageLogic.RAMPAGE_DURATION_TURNS,
            isActive: true,
        };
        this.rampages.set(elephantUnitId, state);
        return state;
    }

    /**
     * 광폭화 실행 — 주변 6개 인접 헥스 피아식별 없이 타격
     *
     * @returns 피해를 입은 타일 좌표 목록
     */
    executeRampage(elephantUnitId: string): { damagedTiles: HexCoord[]; damagePerTile: number } {
        const state = this.rampages.get(elephantUnitId);
        if (!state || !state.isActive) {
            return { damagedTiles: [], damagePerTile: 0 };
        }

        const dirs: [number, number][] = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
        ];

        const damagedTiles = dirs.map(([dq, dr]) => ({
            q: state.targetPosition.q + dq,
            r: state.targetPosition.r + dr,
        }));

        state.remainingTurns--;
        if (state.remainingTurns <= 0) {
            state.isActive = false;
        }

        return { damagedTiles, damagePerTile: state.rampageDamage };
    }

    /**
     * 광폭화 상태 확인
     */
    isRampaging(elephantUnitId: string): boolean {
        return this.rampages.has(elephantUnitId) && this.rampages.get(elephantUnitId)!.isActive;
    }

    /**
     * 광폭화 상태 조회
     */
    getRampageState(elephantUnitId: string): RampageState | null {
        return this.rampages.get(elephantUnitId) ?? null;
    }

    /**
     * 광폭화 강제 종료
     */
    calmElephant(elephantUnitId: string): boolean {
        const state = this.rampages.get(elephantUnitId);
        if (!state) return false;
        state.isActive = false;
        this.rampages.delete(elephantUnitId);
        return true;
    }

    getAllRampaging(): RampageState[] {
        return Array.from(this.rampages.values()).filter(r => r.isActive);
    }

    reset(): void {
        this.rampages.clear();
    }
}
