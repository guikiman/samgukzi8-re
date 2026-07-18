import { describe, it, expect, beforeEach } from 'vitest';
import { FogOfWarManager } from '../src/core/fog_of_war_system';

describe('FogOfWarManager', () => {
    let fog: FogOfWarManager;

    beforeEach(() => {
        fog = new FogOfWarManager();
    });

    it('should set weather', () => {
        fog.setWeather('FOG');
        expect(fog.getWeather()).toBe('FOG');
    });

    it('should set time of day', () => {
        fog.setTimeOfDay('NIGHT');
        expect(fog.getTimeOfDay()).toBe('NIGHT');
    });

    it('should calculate visibility radius based on weather', () => {
        const sunny = fog.getVisibilityRadius('INFANTRY', 'SUNNY', 'DAY');
        const foggy = fog.getVisibilityRadius('INFANTRY', 'FOG', 'DAY');
        expect(sunny).toBeGreaterThan(foggy);
    });

    it('should reduce visibility at night', () => {
        const day = fog.getVisibilityRadius('INFANTRY', 'SUNNY', 'DAY');
        const night = fog.getVisibilityRadius('INFANTRY', 'SUNNY', 'NIGHT');
        expect(day).toBeGreaterThan(night);
    });

    it('should give naval units bonus vision', () => {
        const infantry = fog.getVisibilityRadius('INFANTRY', 'SUNNY', 'DAY');
        const naval = fog.getVisibilityRadius('NAVAL', 'SUNNY', 'DAY');
        expect(naval).toBeGreaterThan(infantry);
    });

    it('should update visibility from unit positions', () => {
        fog.updateVisibility([
            { unitId: 'u1', coord: { q: 0, r: 0 }, unitType: 'INFANTRY' },
        ]);
        expect(fog.isTileVisible({ q: 0, r: 0 })).toBe(true);
    });

    it('should track explored tiles', () => {
        fog.updateVisibility([
            { unitId: 'u1', coord: { q: 0, r: 0 }, unitType: 'INFANTRY' },
        ]);
        expect(fog.isTileExplored({ q: 0, r: 0 })).toBe(true);
    });

    it('should not show unexplored tiles', () => {
        expect(fog.isTileVisible({ q: 99, r: 99 })).toBe(false);
    });

    it('should reset exploration', () => {
        fog.updateVisibility([
            { unitId: 'u1', coord: { q: 0, r: 0 }, unitType: 'INFANTRY' },
        ]);
        fog.resetExploration();
        expect(fog.isTileExplored({ q: 0, r: 0 })).toBe(false);
    });

    it('should apply terrain visibility bonus', () => {
        expect(fog.getTerrainVisibilityBonus('MOUNTAIN')).toBe(2);
        expect(fog.getTerrainVisibilityBonus('FOREST')).toBe(-2);
    });
});
