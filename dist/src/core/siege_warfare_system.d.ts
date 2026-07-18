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
export declare class SiegeWarfareManager {
    private deployedWeapons;
    getWeaponStats(weaponType: SiegeWeaponType): SiegeWeapon;
    getAllWeaponTypes(): SiegeWeapon[];
    /** 공성기 배치 */
    deploySiegeWeapon(weaponType: SiegeWeaponType, position: string): SiegeWeapon | null;
    /** 성벽 데미지 계산 */
    calculateWallDamage(weaponType: SiegeWeaponType, wallDefense: number, garrisonMorale: number, weather: Weather): number;
    /** 성벽 돌파 */
    breachWall(wallHp: number, damage: number): {
        breached: boolean;
        remainingHp: number;
    };
    /** 공성 효율 (날씨/지형) */
    getSiegeEfficiency(weaponType: SiegeWeaponType, weather: Weather, _terrain?: string): number;
    /** 배치된 공성기 내구도 차감 */
    damageWeapon(weaponId: string, damage: number): boolean;
    getDeployedWeapons(): {
        weaponId: string;
        weapon: SiegeWeapon;
        position: string;
        durability: number;
    }[];
    clear(): void;
}
//# sourceMappingURL=siege_warfare_system.d.ts.map