import { describe, it, expect, afterEach, vi } from 'vitest';
import { ProvocationSystem } from '../src/core/provocation_system';

describe('ProvocationSystem', () => {
    const prov = new ProvocationSystem();

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should succeed with high intelligence and provoke skill', () => {
        // 성공 확률이 0.9 클램프라 단일 굴림은 플래키함 → 랜덤 고정 (0.5 < 0.9 성공 보장)
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const result = prov.attemptProvocation(
            'caster_1', 95, true,
            'target_1', 50, 80,
            { q: 5, r: 5 }, { q: 0, r: 0 },
        );
        expect(result.success).toBe(true);
        expect(result.duration).toBe(2);
        expect(prov.isProvoked('target_1')).toBe(true);
    });

    it('should fail without provoke skill', () => {
        const result = prov.attemptProvocation(
            'caster_1', 95, false,
            'target_1', 50, 80,
            { q: 5, r: 5 }, { q: 0, r: 0 },
        );
        expect(result.success).toBe(false);
        expect(result.description).toContain('도발 특기 없음');
    });

    it('should expire provoked state after duration', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5); // 도발 성공 고정
        const p = new ProvocationSystem();
        p.attemptProvocation('caster_1', 95, true, 'target_1', 50, 80, { q: 5, r: 5 }, { q: 0, r: 0 });
        expect(p.isProvoked('target_1')).toBe(true);

        p.processTurnEnd();
        expect(p.isProvoked('target_1')).toBe(true);

        p.processTurnEnd();
        expect(p.isProvoked('target_1')).toBe(false);
    });
});
