import { describe, it, expect, beforeEach } from 'vitest';
import { SiegeWarfareManager } from '../src/core/siege_warfare_system';

describe('SiegeWarfareManager', () => {
    let siege: SiegeWarfareManager;

    beforeEach(() => {
        siege = new SiegeWarfareManager();
    });

    it('should return weapon stats', () => {
        const weapon = siege.getWeaponStats('CATAPULT');
        expect(weapon.attackPower).toBe(50);
        expect(weapon.range).toBe(4);
    });

    it('should return all weapon types', () => {
        expect(siege.getAllWeaponTypes().length).toBe(5);
    });

    it('should deploy a siege weapon', () => {
        const weapon = siege.deploySiegeWeapon('CATAPULT', 'A1');
        expect(weapon).not.toBeNull();
        expect(weapon!.type).toBe('CATAPULT');
    });

    it('should calculate wall damage', () => {
        const damage = siege.calculateWallDamage('CATAPULT', 50, 80, 'SUNNY');
        expect(damage).toBeGreaterThanOrEqual(1);
    });

    it('should reduce damage in bad weather', () => {
        const sunny = siege.calculateWallDamage('CATAPULT', 50, 80, 'SUNNY');
        const storm = siege.calculateWallDamage('CATAPULT', 50, 80, 'STORM');
        expect(storm).toBeLessThan(sunny);
    });

    it('should breach wall when HP reaches 0', () => {
        const result = siege.breachWall(100, 150);
        expect(result.breached).toBe(true);
        expect(result.remainingHp).toBe(0);
    });

    it('should not breach wall with insufficient damage', () => {
        const result = siege.breachWall(100, 50);
        expect(result.breached).toBe(false);
        expect(result.remainingHp).toBe(50);
    });

    it('should calculate siege efficiency', () => {
        const eff = siege.getSiegeEfficiency('TREBUCHET', 'SUNNY', 'PLAIN');
        expect(eff).toBeGreaterThan(0);
    });

    it('should damage deployed weapons', () => {
        siege.deploySiegeWeapon('CATAPULT', 'A1');
        const deployed = siege.getDeployedWeapons();
        const weaponId = deployed[0].weaponId;
        const result = siege.damageWeapon(weaponId, 10);
        expect(result).toBe(true);
    });

    it('should destroy weapon when durability reaches 0', () => {
        siege.deploySiegeWeapon('CATAPULT', 'A1');
        const deployed = siege.getDeployedWeapons();
        const weaponId = deployed[0].weaponId;
        siege.damageWeapon(weaponId, 100);
        expect(siege.getDeployedWeapons().length).toBe(0);
    });
});
