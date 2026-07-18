import { describe, it, expect } from 'vitest';
import { InkWashShader } from '../src/core/ink_wash_shader';

describe('InkWashShader', () => {
    const shader = new InkWashShader();

    it('should return spring style', () => {
        const style = shader.getInkWashStyle('SPRING', 'SUNNY');
        expect(style.inkIntensity).toBe(0.3);
        expect(style.colorSaturation).toBeGreaterThan(0);
    });

    it('should return winter style', () => {
        const style = shader.getInkWashStyle('WINTER', 'SNOW');
        expect(style.inkIntensity).toBe(0.2);
    });

    it('should adjust for storm weather', () => {
        const style = shader.getInkWashStyle('SUMMER', 'STORM');
        expect(style.inkIntensity).toBe(0.7);
        expect(style.colorSaturation).toBe(0.2);
    });

    it('should return different styles for different seasons', () => {
        const spring = shader.getInkWashStyle('SPRING', 'SUNNY');
        const autumn = shader.getInkWashStyle('AUTUMN', 'SUNNY');
        expect(spring.brushStrokeWidth).not.toBe(autumn.brushStrokeWidth);
    });

    it('should return CSS filter string', () => {
        const style = shader.getInkWashStyle('SPRING', 'SUNNY');
        const css = shader.getCSSFilter(style);
        expect(css).toContain('saturate');
        expect(css).toContain('contrast');
    });

    it('should have valid paper texture strength', () => {
        const style = shader.getInkWashStyle('WINTER', 'FOG');
        expect(style.paperTextureStrength).toBeGreaterThan(0);
        expect(style.paperTextureStrength).toBeLessThan(1);
    });

    it('should have edge darkening for all styles', () => {
        for (const season of ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] as const) {
            const style = shader.getInkWashStyle(season, 'SUNNY');
            expect(style.edgeDarkening).toBeGreaterThan(0);
        }
    });

    it('should have brush stroke width for all styles', () => {
        const spring = shader.getInkWashStyle('SPRING', 'SUNNY');
        const summer = shader.getInkWashStyle('SUMMER', 'SUNNY');
        expect(spring.brushStrokeWidth).toBeGreaterThan(0);
        expect(summer.brushStrokeWidth).toBeGreaterThan(0);
    });
});
