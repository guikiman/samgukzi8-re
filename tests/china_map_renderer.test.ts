/**
 * 중국 전도 도시 클릭 좌표 히트 테스트 (모듈 단위)
 */
import { describe, it, expect } from 'vitest';
import { ChinaMapRenderer, pointInPolygon } from '../src/core/china_map_renderer';
import type { MapCityView } from '../src/core/china_map_renderer';

function createMockCanvas(): HTMLCanvasElement {
    const canvas = {
        width: 1200,
        height: 700,
        getContext: () => ({
            clearRect: () => {},
            fillRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            fill: () => {},
            stroke: () => {},
            arc: () => {},
            rect: () => {},
            quadraticCurveTo: () => {},
            fillText: () => {},
            strokeText: () => {},
            measureText: () => ({ width: 20 }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            setLineDash: () => {},
        }),
    } as unknown as HTMLCanvasElement;
    return canvas;
}

describe('ChinaMapRenderer', () => {
    it('도시 배치 후 화면 중앙 클릭 시 정규 좌표 변환 일관성', () => {
        const renderer = new ChinaMapRenderer(createMockCanvas());
        const cities: MapCityView[] = [
            { id: 'c1', name: '허창', x: 0.60, y: 0.40, ownerColor: '#2a5a8a', isPlayer: true, garrison: 10000 },
            { id: 'c2', name: '건업', x: 0.76, y: 0.55, ownerColor: '#b04a2a', isPlayer: false, garrison: 8000 },
        ];
        renderer.setCities(cities);

        // 정규→픽셀→정규 roundtrip (screenToNorm은 public)
        const norm = renderer.screenToNorm(600, 350);
        expect(norm.x).toBeCloseTo(0.5, 5);
        expect(norm.y).toBeCloseTo(0.46, 5);
    });

    it('pan 후 좌표가 이동한다', () => {
        const renderer = new ChinaMapRenderer(createMockCanvas());
        renderer.pan(50, 30);
        const norm = renderer.screenToNorm(600, 350);
        expect(norm.x).toBeLessThan(0.5);
        expect(norm.y).toBeLessThan(0.46);
    });

    it('pointInPolygon: 대륙 내부/외부 판정', () => {
        const square = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
        expect(pointInPolygon(0.5, 0.5, square)).toBe(true);
        expect(pointInPolygon(-0.1, 0.5, square)).toBe(false);
        expect(pointInPolygon(1.1, 0.5, square)).toBe(false);
    });

    it('zoomAt은 커서 아래 정규 좌표를 대략 보존한다', () => {
        const renderer = new ChinaMapRenderer(createMockCanvas());
        const before = renderer.screenToNorm(900, 500);
        renderer.zoomAt(1.2, 900, 500);
        const after = renderer.screenToNorm(900, 500);
        expect(after.x).toBeCloseTo(before.x, 1);
        expect(after.y).toBeCloseTo(before.y, 1);
    });
});
