// @vitest-environment jsdom — ChinaMapRenderer가 오프스크린 레이어에서 document.createElement 사용
/**
 * [461-480] 영토 색약 무늬 패턴 테스트
 * 파일: tests/territory_pattern.test.ts
 *
 * 도시의 factionPattern이 보로노이 영토 셀에 전파되는지,
 * hatch 패턴 셀 렌더 시 사선 stroke가 추가로 발생하는지 검증한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { ChinaMapRenderer } from '../src/core/china_map_renderer';
import type { MapCityView } from '../src/core/china_map_renderer';

function makeMockCtx(counters?: { stroke?: () => void; fill?: () => void }) {
    return new Proxy({}, {
        get(_t, prop) {
            if (prop === 'measureText') return () => ({ width: 20 });
            if (prop === 'stroke') return () => counters?.stroke?.();
            if (prop === 'fill') return () => counters?.fill?.();
            return () => ({ addColorStop: () => {} });
        },
        set() { return true; },
    }) as unknown as CanvasRenderingContext2D;
}

function setupRendererEnv(counters?: { stroke?: () => void; fill?: () => void }) {
    const mockCtx = makeMockCtx(counters);
    const makeMockCanvas = () => ({
        width: 800,
        height: 600,
        getContext: () => mockCtx,
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
        if (tag === 'canvas') return makeMockCanvas() as unknown as HTMLCanvasElement;
        return originalCreateElement(tag);
    }) as never);
    return { makeMockCanvas };
}

describe('[461-480] 영토 색약 무늬 패턴', () => {
    it('MapCityView.factionPattern이 보로노이 셀에 전파된다', () => {
        const { makeMockCanvas } = setupRendererEnv();
        const renderer = new ChinaMapRenderer(makeMockCanvas() as unknown as HTMLCanvasElement);
        const cities: MapCityView[] = [
            { id: 'c1', name: '허창', x: 0.60, y: 0.40, ownerColor: '#e69f00', isPlayer: true, garrison: 10000, factionPattern: 'hatch' },
            { id: 'c2', name: '건업', x: 0.80, y: 0.60, ownerColor: '#0072b2', isPlayer: false, garrison: 8000, factionPattern: 'dots' },
        ];
        renderer.setCities(cities);
        expect(() => renderer.render()).not.toThrow();

        const cells = renderer['territoryCells'];
        expect(cells.length).toBeGreaterThan(1000); // 0.014 격자 → 72×72
        const withOwner = cells.filter((c) => c.ownerColor !== null);
        expect(withOwner.length).toBeGreaterThan(0);
        for (const c of withOwner) {
            expect(['hatch', 'dots', 'none']).toContain(c.pattern);
        }
        // 허창(0.60, 0.40) 근방 셀은 hatch, 건업(0.80, 0.60) 근방은 dots
        const cols = renderer['territoryCols'];
        const cell = 0.014;
        const near = (nx: number, ny: number) => {
            const gx = Math.max(0, Math.min(cols - 1, Math.floor(nx / cell - 0.5)));
            const gy = Math.max(0, Math.min(renderer['territoryRows'] - 1, Math.floor(ny / cell - 0.5)));
            return cells[gy * cols + gx];
        };
        expect(near(0.60, 0.40)?.pattern).toBe('hatch');
        expect(near(0.80, 0.60)?.pattern).toBe('dots');
    });

    it('패턴 미지정 도시의 영토는 모두 none이다', () => {
        const { makeMockCanvas } = setupRendererEnv();
        const renderer = new ChinaMapRenderer(makeMockCanvas() as unknown as HTMLCanvasElement);
        renderer.setCities([
            { id: 'c1', name: '허창', x: 0.60, y: 0.40, ownerColor: '#2a5a8a', isPlayer: true, garrison: 10000 },
        ]);
        renderer.render();
        const withOwner = renderer['territoryCells'].filter((c) => c.ownerColor !== null);
        expect(withOwner.length).toBeGreaterThan(0);
        for (const c of withOwner) expect(c.pattern).toBe('none');
    });

    it('hatch 패턴 렌더 시 stroke(사선)가 추가로 호출된다', () => {
        let hatchStrokes = 0;
        const { makeMockCanvas: mkA } = setupRendererEnv({ stroke: () => { hatchStrokes++; } });
        const withPattern = new ChinaMapRenderer(mkA() as unknown as HTMLCanvasElement);
        withPattern.setCities([
            { id: 'c1', name: '허창', x: 0.60, y: 0.40, ownerColor: '#e69f00', isPlayer: true, garrison: 10000, factionPattern: 'hatch' },
        ]);
        withPattern.render();

        let plainStrokes = 0;
        const { makeMockCanvas: mkB } = setupRendererEnv({ stroke: () => { plainStrokes++; } });
        const noPattern = new ChinaMapRenderer(mkB() as unknown as HTMLCanvasElement);
        noPattern.setCities([
            { id: 'c1', name: '허창', x: 0.60, y: 0.40, ownerColor: '#e69f00', isPlayer: true, garrison: 10000 },
        ]);
        noPattern.render();

        // hatch가 있을 때 stroke가 더 많아야 함 (소유 셀당 사선 1개)
        expect(hatchStrokes).toBeGreaterThan(plainStrokes);
    });
});
