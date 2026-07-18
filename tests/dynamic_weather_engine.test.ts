import { describe, it, expect } from 'vitest';
import { DynamicWeatherEngine } from '../src/core/dynamic_weather_engine';
import type { Season, Weather } from '../src/core/types';

describe('DynamicWeatherEngine', () => {
    const engine = new DynamicWeatherEngine();

    it('should roll SNOW frequently in NORTH winter', () => {
        let snowCount = 0;
        const trials = 1000;
        for (let i = 0; i < trials; i++) {
            const weather = engine.rollNextWeather('WINTER', 'NORTH');
            if (weather === 'SNOW') snowCount++;
        }
        // ~60% probability
        expect(snowCount).toBeGreaterThan(trials * 0.4);
    });

    it('should return SUNNY often in AUTUMN', () => {
        let sunnyCount = 0;
        const trials = 1000;
        for (let i = 0; i < trials; i++) {
            const weather = engine.rollNextWeather('AUTUMN', 'SOUTH');
            if (weather === 'SUNNY') sunnyCount++;
        }
        // ~75% probability
        expect(sunnyCount).toBeGreaterThan(trials * 0.6);
    });

    it('should roll RAIN in SUMMER', () => {
        let rainCount = 0;
        const trials = 1000;
        for (let i = 0; i < trials; i++) {
            const weather = engine.rollNextWeather('SUMMER', 'CENTRAL');
            if (weather === 'RAIN') rainCount++;
        }
        // ~40% probability
        expect(rainCount).toBeGreaterThan(trials * 0.25);
    });

    it('should block fire attacks in RAIN weather', () => {
        const constraints = engine.getWeatherConstraints('RAIN');
        expect(constraints.canUseFire).toBe(false);
        expect(constraints.fireSelfExtinguishBonus).toBe(0.4);
    });

    it('should reduce mobility in SNOW weather', () => {
        const constraints = engine.getWeatherConstraints('SNOW');
        expect(constraints.mobilityPenalty).toBe(2);
        expect(constraints.cavalryChargeReduction).toBe(0.3);
    });

    it('should cap range at 1 in FOG weather', () => {
        const constraints = engine.getWeatherConstraints('FOG');
        expect(constraints.rangeCap).toBe(1);
        expect(constraints.canUseFire).toBe(true);
    });

    it('should have no penalties in SUNNY weather', () => {
        const constraints = engine.getWeatherConstraints('SUNNY');
        expect(constraints.canUseFire).toBe(true);
        expect(constraints.mobilityPenalty).toBe(0);
        expect(constraints.rangeCap).toBeNull();
    });

    it('should apply STORM penalties', () => {
        const constraints = engine.getWeatherConstraints('STORM');
        expect(constraints.canUseFire).toBe(false);
        expect(constraints.mobilityPenalty).toBe(3);
        expect(constraints.cavalryChargeReduction).toBe(0.5);
        expect(constraints.rangeCap).toBe(1);
    });
});
