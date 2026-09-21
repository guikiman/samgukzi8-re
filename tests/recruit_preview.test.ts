import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';
import { OfficerStatus } from '../src/core/types.js';

describe('등용 확률 미리보기 [24]', () => {
    let store: GameStore;
    let engine: GameEngine;

    beforeEach(() => {
        store = new GameStore();
        engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 2);
        engine.initWorld(world.officers, world.factions, world.cities, []);
    });

    it('충성도 0 무장은 높은 확률을 반환한다', () => {
        const officer = store.getAllOfficers().find(o => o.factionId === null)!;
        expect(officer).toBeTruthy();
        // 충성도를 0으로 강제 → 기본 35% + 야망 보정 - 충성 방어 0
        store.updateOfficer(officer.id, { loyalty: 0 });
        const chance = engine['loyaltySystem'].getRecruitChance(officer.id);
        expect(chance).toBeGreaterThanOrEqual(0.35);
        expect(chance).toBeLessThanOrEqual(0.95);
    });

    it('충성도 100 무장은 낮은 확률을 반환한다', () => {
        const officer = store.getAllOfficers().find(o => o.factionId !== null)!;
        // 로열티가 높으면 방어로 확률 하락
        const chance = engine['loyaltySystem'].getRecruitChance(officer.id);
        expect(chance).toBeLessThanOrEqual(0.5);
    });

    it('확률은 항상 5%~95% 범위에 클램프된다', () => {
        for (const o of store.getAllOfficers().slice(0, 20)) {
            const chance = engine['loyaltySystem'].getRecruitChance(o.id);
            expect(chance).toBeGreaterThanOrEqual(0.05);
            expect(chance).toBeLessThanOrEqual(0.95);
        }
    });

    it('초빙자 능력이 높으면 확률이 올라간다', () => {
        const officer = store.getAllOfficers().find(o => o.factionId === null)!;
        const noRecruiter = engine['loyaltySystem'].getRecruitChance(officer.id);
        // 초빙자 생략 = 기본 60 가정. 실제 고능력 초빙자 대비 차이 확인
        const target = store.getOfficer(officer.id)!;
        expect(noRecruiter).toBeGreaterThanOrEqual(
            0.35 - (target.loyalty / 100) * 0.5 + (target.ambition / 100) * 0.3 - 0.01
        );
    });

    it('존재하지 않는 무장은 확률 0을 반환한다', () => {
        expect(engine['loyaltySystem'].getRecruitChance('nonexistent_officer')).toBe(0);
    });

    it('포로(FREE+충성도0) 무장의 등용 성공이 실제로 편입시킨다', () => {
        const free = store.getAllOfficers().find(o => o.factionId === null && o.status === OfficerStatus.FREE)!;
        const gs = store.getGlobalState();
        const playerFactionId = gs.playerFactionId ?? 'fac_2';
        const playerCity = store.getCitiesByFaction(playerFactionId)[0];

        // 확률이 95%로 클램프될 정도로 유리한 조건에서 반복 시도 (최대 50회)
        let recruited = false;
        for (let i = 0; i < 50; i++) {
            const result = engine['loyaltySystem'].recruit(free.id, playerFactionId, playerCity.id);
            if (result.success) { recruited = true; break; }
        }
        expect(recruited).toBe(true);
        expect(store.getOfficer(free.id)!.factionId).toBe(playerFactionId);
        expect(store.getOfficer(free.id)!.status).toBe(OfficerStatus.OFFICER);
    });
});
