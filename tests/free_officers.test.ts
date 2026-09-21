import { describe, it, expect } from 'vitest';
import { buildWorld } from '../src/core/scenario_system';
import type { ScenarioData } from '../src/core/scenario_system';

function makeScenario(
    id: string,
    factions: Array<{ name: string; capital: string; leader_id: string }>,
): ScenarioData {
    return {
        id,
        title_kr: '테스트',
        title_en: 'test',
        start_date: '200-01',
        description: '',
        difficulty: 1,
        factions: factions.map(f => ({ ...f, color: '#123456' })),
        special_conditions: { victory: '', historical_mode: true },
        status: 'active',
    };
}

describe('재야 무장 배치 [24]', () => {
    it('시나리오별 재야 무장이 어느 세력에도 속하지 않은 채 배치된다', () => {
        // 05 삼분천하: 황충·방통·위연이 신야에 재야
        const s = makeScenario('05', [
            { name: '조조', capital: '허창', leader_id: 'cao_cao' },
            { name: '손권', capital: '건업', leader_id: 'sun_quan' },
            { name: '유비', capital: '신야', leader_id: 'liu_bei' },
        ]);
        const world = buildWorld(s, 2);

        const free = world.officers.filter(o => o.factionId === null && o.status === 'FREE');
        const freeIds = free.map(o => o.id);
        expect(freeIds).toContain('huang_zhong');
        expect(freeIds).toContain('pang_tong');
        expect(freeIds).toContain('wei_yan');

        // 소속 없음 + FREE 상태
        for (const o of free) {
            expect(o.factionId).toBeNull();
            expect(o.status).toBe('FREE');
            expect(o.runtime.factionId).toBeNull();
        }
    });

    it('재야 무장이 지정 도시(플레이어 수도)에 배치된다 — 등용 UI에서 바로 보인다', () => {
        const s = makeScenario('05', [
            { name: '조조', capital: '허창', leader_id: 'cao_cao' },
            { name: '손권', capital: '건업', leader_id: 'sun_quan' },
            { name: '유비', capital: '신야', leader_id: 'liu_bei' },
        ]);
        const world = buildWorld(s, 2);
        const xinye = world.cities.find(c => c.name === '신야')!;

        const xinyeFree = world.officers.filter(o => o.factionId === null && o.cityId === xinye.id);
        expect(xinyeFree.length).toBeGreaterThanOrEqual(3);
        expect(xinyeFree.map(o => o.id)).toContain('huang_zhong');
    });

    it('재야 무장이 세력 무장 목록/도시 officerIds에 오염되지 않는다', () => {
        const s = makeScenario('05', [
            { name: '조조', capital: '허창', leader_id: 'cao_cao' },
            { name: '손권', capital: '건업', leader_id: 'sun_quan' },
            { name: '유비', capital: '신야', leader_id: 'liu_bei' },
        ]);
        const world = buildWorld(s, 2);

        const fac = world.factions.find(f => f.id === 'fac_2')!; // 유비
        expect(fac.officers).not.toContain('huang_zhong');
        expect(fac.officers).not.toContain('pang_tong');

        const xinye = world.cities.find(c => c.name === '신야')!;
        expect(xinye.officerIds).not.toContain('huang_zhong');
    });

    it('모든 시나리오에서 무장 ID 중복이 없다 (로스터 vs 재야 명단 이중 배치 방지)', () => {
        // 실제 index.json의 세력 구성을 그대로 사용
        const configs: Record<string, Array<{ name: string; capital: string; leader_id: string }>> = {
            '01': [
                { name: '하진', capital: '낙양', leader_id: 'he_jin' },
                { name: '장각', capital: '거록', leader_id: 'zhang_jiao' },
            ],
            '02': [
                { name: '동탁', capital: '낙양', leader_id: 'dong_zhuo' },
                { name: '원소', capital: '업', leader_id: 'yuan_shao' },
                { name: '조조', capital: '진류', leader_id: 'cao_cao' },
                { name: '손견', capital: '장사', leader_id: 'sun_jian' },
            ],
            '03': [
                { name: '조조', capital: '연주', leader_id: 'cao_cao' },
                { name: '유비', capital: '서주', leader_id: 'liu_bei' },
                { name: '여포', capital: '하비', leader_id: 'lv_bu' },
                { name: '손책', capital: '여강', leader_id: 'sun_ce' },
                { name: '원술', capital: '수춘', leader_id: 'yuan_shu' },
            ],
            '04': [
                { name: '조조', capital: '허창', leader_id: 'cao_cao' },
                { name: '원소', capital: '업', leader_id: 'yuan_shao' },
                { name: '손씨', capital: '오', leader_id: 'sun_ce' },
                { name: '유비', capital: '여남', leader_id: 'liu_bei' },
            ],
            '05': [
                { name: '조조', capital: '허창', leader_id: 'cao_cao' },
                { name: '손권', capital: '건업', leader_id: 'sun_quan' },
                { name: '유비', capital: '신야', leader_id: 'liu_bei' },
            ],
            '06': [
                { name: '촉', capital: '한중', leader_id: 'liu_bei' },
                { name: '위', capital: '낙양', leader_id: 'cao_cao' },
                { name: '오', capital: '건업', leader_id: 'sun_quan' },
            ],
        };

        for (const [id, factions] of Object.entries(configs)) {
            const s = makeScenario(id, factions);
            const world = buildWorld(s, 0);
            const ids = world.officers.map(o => o.id);
            const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
            expect(dupes, `시나리오 ${id} 중복 ID: ${dupes.join(', ')}`).toHaveLength(0);
        }
    });
});
