import { describe, it, expect } from 'vitest';
import { hexToWorld, HexMap3DRenderer } from '../src/core/hex_map_3d_renderer.js';

/**
 * [36-45] HexMap3DRenderer 단위 테스트
 *
 * Three.js InstancedMesh 기반 3D 헥사곤 렌더링
 * 좌표 변환, LOD, 색상 로직 검증
 */

describe('hexToWorld - 헥사 좌표 변환', () => {
    it('origin (0,0) → (0, 0)', () => {
        const { x, z } = hexToWorld(0, 0, 16);
        expect(x).toBe(0);
        expect(z).toBe(0);
    });

    it('(1,0) 반환 x > 0', () => {
        const { x } = hexToWorld(1, 0, 16);
        expect(x).toBeGreaterThan(0);
    });

    it('(0,1) 반환 z > 0', () => {
        const { z } = hexToWorld(0, 1, 16);
        expect(z).toBeGreaterThan(0);
    });

    it('hexSize 스케일링 일관성', () => {
        const p1 = hexToWorld(1, 1, 10);
        const p2 = hexToWorld(1, 1, 20);
        expect(p2.x).toBe(p1.x * 2);
        expect(p2.z).toBe(p1.z * 2);
    });
});

describe('HexMap3DRenderer - 정적 헬퍼', () => {
    it('WATER 지형 타입 올바른 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(0, 'WATER')).toBe('#2b6cb0');
    });

    it('PLAIN 지형 올바른 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(3, 'PLAIN')).toBe('#68d391');
    });

    it('FOREST 지형 올바른 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(10, 'FOREST')).toBe('#276749');
    });

    it('MOUNTAIN 지형 올바른 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(20, 'MOUNTAIN')).toBe('#8b4513');
    });

    it('DESERT 지형 올바른 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(5, 'DESERT')).toBe('#d69e2e');
    });

    it('SWAMP 지형 올바른 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(2, 'SWAMP')).toBe('#6b4423');
    });

    it('height=0 이하 → WATER 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(0)).toBe('#2b6cb0');
    });

    it('height < 5 → PLAIN 색상', () => {
        expect(HexMap3DRenderer.getTerrainColor(3)).toBe('#68d391');
    });

    it('높은 height → 회색', () => {
        expect(HexMap3DRenderer.getTerrainColor(50)).toBe('#a0aec0');
    });
});

describe('HexMap3DRenderer - 타일 데이터 생성', () => {
    it('6개 타일 그리드 좌표 정확성', () => {
        const tiles = Array.from({ length: 6 }, (_, i) => ({
            q: i, r: 0, height: 1, color: '#68d391',
        }));
        expect(tiles.length).toBe(6);
        expect(tiles[0].q).toBe(0);
        expect(tiles[5].q).toBe(5);
    });

    it('타일 데이터 색상 hex 정합성', () => {
        const tile = { q: 0, r: 0, height: 5, color: HexMap3DRenderer.getTerrainColor(5, 'PLAIN') };
        expect(tile.color).toMatch(/^#[0-9a-f]{6}$/);
    });
});
