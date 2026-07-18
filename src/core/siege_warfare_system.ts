/**
 * [B15] 성벽 공성전 고도화 — Siege Warfare System
 *
 * 공성 병기: CATAPULT, RAMP, BATTERING_RAM, SIEGE_TOWER, TREBUCHET
 * 성벽 HP = 도시방어도 × 100
 * 투석기 데미지=50, 충차=30, 공성탑=20
 */

import type { Weather } from './types';

export type SiegeWeaponType = 'CATAPULT' | 'RAMP' | 'BATTERING_RAM' | 'SIEGE_TOWER' | 'TREBUCHET';

export interface SiegeWeapon {
    readonly type: SiegeWeaponType;
    readonly name: string;
    readonly durability: number;
    readonly attackPower: number;
    readonly range: number;
    readonly mobility: number;
    readonly cost: number;
}

const SIEGE_WEAPONS: Record<SiegeWeaponType, SiegeWeapon> = {
    CATAPULT: { type: 'CATAPULT', name: '투석기', durability: 50, attackPower: 50, range: 4, mobility: 1, cost: 500 },
    RAMP: { type: 'RAMP', name: '토루', durability: 80, attackPower: 0, range: 0, mobility: 0, cost: 300 },
    BATTERING_RAM: { type: 'BATTERING_RAM', name: '충차', durability: 40, attackPower: 30, range: 1, mobility: 2, cost: 400 },
    SIEGE_TOWER: { type: 'SIEGE_TOWER', name: '공성탑', durability: 60, attackPower: 20, range: 2, mobility: 1, cost: 600 },
    TREBUCHET: { type: 'TREBUCHET', name: '채석기', durability: 30, attackPower: 80, range: 6, mobility: 0, cost: 800 },
};

const WEATHER_SIEGE_EFFICIENCY: Record<Weather, number> = {
    SUNNY: 1.0, CLOUDY: 0.9, RAIN: 0.6, SNOW: 0.5, STORM: 0.3, FOG: 0.7,
};

export class SiegeWarfareManager {
    private deployedWeapons: Map<string, { weapon: SiegeWeapon; position: string; durability: number }> = new Map();

    getWeaponStats(weaponType: SiegeWeaponType): SiegeWeapon {
        return { ...SIEGE_WEAPONS[weaponType] };
    }

    getAllWeaponTypes(): SiegeWeapon[] {
        return Object.values(SIEGE_WEAPONS).map(w => ({ ...w }));
    }

    /** 공성기 배치 */
    deploySiegeWeapon(weaponType: SiegeWeaponType, position: string): SiegeWeapon | null {
        const template = SIEGE_WEAPONS[weaponType];
        if (!template) return null;
        const weaponId = `${weaponType}_${position}_${Date.now()}`;
        this.deployedWeapons.set(weaponId, { weapon: template, position, durability: template.durability });
        return template;
    }

    /** 성벽 데미지 계산 */
    calculateWallDamage(weaponType: SiegeWeaponType, wallDefense: number, garrisonMorale: number, weather: Weather): number {
        const weapon = SIEGE_WEAPONS[weaponType];
        const weatherEff = WEATHER_SIEGE_EFFICIENCY[weather];
        const moraleFactor = garrisonMorale / 100;

        // 성벽 방어도가 높을수록 데미지 감소
        const defenseReduction = Math.max(0.2, 1 - wallDefense / 200);
        const baseDamage = weapon.attackPower * weatherEff * defenseReduction;

        return Math.max(1, Math.floor(baseDamage));
    }

    /** 성벽 돌파 */
    breachWall(wallHp: number, damage: number): { breached: boolean; remainingHp: number } {
        const remaining = Math.max(0, wallHp - damage);
        return { breached: remaining <= 0, remainingHp: remaining };
    }

    /** 공성 효율 (날씨/지형) */
    getSiegeEfficiency(weaponType: SiegeWeaponType, weather: Weather, _terrain: string = 'PLAIN'): number {
        const weatherEff = WEATHER_SIEGE_EFFICIENCY[weather];
        const weapon = SIEGE_WEAPONS[weaponType];
        return Math.max(0.1, weapon.attackPower / 100 * weatherEff);
    }

    /** 배치된 공성기 내구도 차감 */
    damageWeapon(weaponId: string, damage: number): boolean {
        const entry = this.deployedWeapons.get(weaponId);
        if (!entry) return false;
        entry.durability -= damage;
        if (entry.durability <= 0) {
            this.deployedWeapons.delete(weaponId);
            return false; // 파괴됨
        }
        this.deployedWeapons.set(weaponId, entry);
        return true; // 잔존
    }

    getDeployedWeapons(): { weaponId: string; weapon: SiegeWeapon; position: string; durability: number }[] {
        return Array.from(this.deployedWeapons.entries()).map(([id, e]) => ({
            weaponId: id, weapon: e.weapon, position: e.position, durability: e.durability,
        }));
    }

    clear(): void {
        this.deployedWeapons.clear();
    }
}
