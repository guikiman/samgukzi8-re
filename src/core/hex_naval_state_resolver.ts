/**
 * [B4] 수상 모드 변환 및 능력치 보정 — Hex Naval State Resolver
 *
 * HexNavalStateResolver:
 *   1. 유닛이 WATER 타일 진입 시 수상 모드(isNavalMode) 전환
 *   2. 함선 등급(ShipType)별 이동력/방어력 보정
 *   3. 육지 복귀 시 스탯 원상복구
 *   4. ShipType.NONE (함선 없음) → 이동력 소모 99, 방어력 -50%, 화염 추가 데미지 2배
 *   5. ShipType.MONGCHUNG → 수역 패널티 면제, 방어력 -10%
 *   6. ShipType.NUSEON → 수역 이동 소모 3, 방어력 보정 0%, 수상 원거리 반격
 *   7. ShipType.TUHAM → 수역 이동 소모 1, 방어력 +15%, 충돌 추가 데미지
 */

import type { HexCoord } from './types';

export type ShipType = 'NONE' | 'MONGCHUNG' | 'NUSEON' | 'TUHAM';
export type TileType = 'LAND' | 'FOREST' | 'MOUNTAIN' | 'WATER';
export type RegionType = 'NORTH' | 'CENTRAL' | 'SOUTH';

export interface BattleUnitState {
    readonly id: string;
    readonly name: string;
    x: number;
    y: number;
    z: number;
    readonly stats: {
        readonly command: number;
        readonly intelligence: number;
        readonly mobility: number;
        readonly defense: number;
    };
    shipType: ShipType;
    isNavalMode: boolean;
    currentMobility: number;
    currentDefense: number;
    conditions: string[];
    morale: number;
}

export interface DriftVector {
    readonly dx: number;
    readonly dy: number;
    readonly dz: number;
}

export interface HexTileState {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly type: TileType;
    readonly driftVector?: DriftVector;
}

export interface BattleEnvironmentState {
    readonly currentWeather: string;
    readonly season: string;
    readonly region: RegionType;
    readonly turn: number;
}

const SHIP_MOBILITY_COST: Record<ShipType, number> = {
    NONE: 99,
    MONGCHUNG: 2,
    NUSEON: 3,
    TUHAM: 1,
};

const SHIP_DEFENSE_MOD: Record<ShipType, number> = {
    NONE: 0.5,
    MONGCHUNG: 0.9,
    NUSEON: 1.0,
    TUHAM: 1.15,
};

export class HexNavalStateResolver {
    /**
     * 유닛이 특정 타일로 진입할 때 상태를 갱신합니다.
     */
    resolveTileEntry(unit: BattleUnitState, targetTile: HexTileState): void {
        if (targetTile.type === 'WATER') {
            unit.isNavalMode = true;
            this.applyNavalModifiers(unit);
        } else {
            if (unit.isNavalMode) {
                unit.isNavalMode = false;
                this.resetToLandModifiers(unit);
            }
        }
    }

    private applyNavalModifiers(unit: BattleUnitState): void {
        unit.currentDefense = Math.round(unit.stats.defense * SHIP_DEFENSE_MOD[unit.shipType]);
    }

    private resetToLandModifiers(unit: BattleUnitState): void {
        unit.currentDefense = unit.stats.defense;
    }

    getMobilityCost(shipType: ShipType): number {
        return SHIP_MOBILITY_COST[shipType];
    }

    getDefenseModifier(shipType: ShipType): number {
        return SHIP_DEFENSE_MOD[shipType];
    }

    hasRangedCounter(shipType: ShipType): boolean {
        return shipType === 'NUSEON';
    }

    hasCollisionBonus(shipType: ShipType): boolean {
        return shipType === 'TUHAM';
    }

    hasFireVulnerability(shipType: ShipType): boolean {
        return shipType === 'NONE';
    }
}
