import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { OfficerStatus } from '../src/core/types.js';
import { processBattleSpoils } from '../src/core/battle_spoils_system.js';
import { isCaptive, getCapturedOriginFaction } from '../src/core/captive_escape_system.js';
import { applyCaptiveRecruitPenalty, NEMESIS_AFFINITY_DROP } from '../src/core/captive_recruit_penalty_system.js';
import { FactionRelation } from '../src/core/diplomacy_engine.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('포로 등용 원수화 페널티 [24][341-360]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0); // 플레이어 = 조조 (fac_0)
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    /** target 1명만 확정 포획 (나머지 roll 0.99 도주) */
    function captureOnly(store: GameStore, targetId: string) {
        const defenders = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.id === targetId ? 0 : 0.99 }));
        return processBattleSpoils(store, 'city_허창', 'city_건업', rolls);
    }

    it('포획 마커에 원소속 세력이 기록된다', () => {
        const { store } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        expect(originFactionId).toBeTruthy();

        captureOnly(store, target.id);
        expect(isCaptive(store, target.id)).toBe(true);
        expect(getCapturedOriginFaction(store, target.id)).toBe(originFactionId);
    });

    it('포로 등용 시 원소속 세력과 전쟁 상태가 된다 (원수화)', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        captureOnly(store, target.id);

        // 등용 전: 중립
        const diplo = engine.diplomacyEngine;
        expect(diplo.getRelation('fac_0', originFactionId)).toBe(FactionRelation.NEUTRAL);

        const penalty = applyCaptiveRecruitPenalty(store, diplo, 'fac_0', target.id);
        expect(penalty.originFactionId).toBe(originFactionId);
        expect(diplo.getRelation('fac_0', originFactionId)).toBe(FactionRelation.WAR);
        expect(penalty.messages.some(m => m.includes('원수화'))).toBe(true);
    });

    it('동맹 세력의 포로를 등용하면 동맹이 파기된다', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        captureOnly(store, target.id);

        const diplo = engine.diplomacyEngine;
        diplo.formAlliance('fac_0', originFactionId);
        expect(diplo.getRelation('fac_0', originFactionId)).toBe(FactionRelation.ALLIANCE);

        const penalty = applyCaptiveRecruitPenalty(store, diplo, 'fac_0', target.id);
        expect(diplo.getRelation('fac_0', originFactionId)).toBe(FactionRelation.NEUTRAL);
        expect(penalty.diplomacyMessage).toContain('파기');
    });

    it('원소속 세력의 남은 무장들이 등용당한 무장을 원수(NEMESIS)로 기억한다', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        captureOnly(store, target.id);

        const comrades = store.getOfficersByFaction(originFactionId)
            .filter(o => o.id !== target.id);
        expect(comrades.length).toBeGreaterThan(0);

        const penalty = applyCaptiveRecruitPenalty(store, engine.diplomacyEngine, 'fac_0', target.id);
        expect(penalty.nemesisComradeIds.length).toBe(comrades.length);

        for (const comrade of comrades) {
            const edge = store.getRelationships(comrade.id).find(e => e.target === target.id);
            expect(edge).toBeDefined();
            expect(edge!.type).toBe('NEMESIS');
            expect(edge!.affinity).toBeLessThanOrEqual(NEMESIS_AFFINITY_DROP);
            // 역방향 사본도 동일
            const reverse = store.getRelationships(target.id).find(e => e.target === comrade.id);
            expect(reverse!.affinity).toBe(edge!.affinity);
        }
    });

    it('멸망한 원소속 세력은 페널티 대상이 아니다', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        captureOnly(store, target.id);

        // 원소속 세력 멸망 → removeFaction으로 스토어 제거
        const originFactionId = getCapturedOriginFaction(store, target.id)!;
        store.removeFaction(originFactionId);
        expect(getCapturedOriginFaction(store, target.id)).toBeNull();

        const penalty = applyCaptiveRecruitPenalty(store, engine.diplomacyEngine, 'fac_0', target.id);
        expect(penalty.originFactionId).toBeNull();
        expect(penalty.nemesisComradeIds).toHaveLength(0);
        expect(penalty.messages).toHaveLength(0);
    });

    it('일반(비포로) 무장 등용은 페널티가 없다', () => {
        const { store, engine } = setupWorld();
        // 재야 무장 — CAPTURED 마커가 없음
        const freeOfficer = store.getAllOfficers().find(o => o.status === OfficerStatus.FREE);
        expect(freeOfficer).toBeDefined();

        const penalty = applyCaptiveRecruitPenalty(store, engine.diplomacyEngine, 'fac_0', freeOfficer!.id);
        expect(penalty.originFactionId).toBeNull();
        expect(penalty.messages).toHaveLength(0);
        // 외교 관계 변화 없음
        expect(engine.diplomacyEngine.getRelation('fac_0', 'fac_1')).toBe(FactionRelation.NEUTRAL);
    });

    it('loyaltySystem.recruit 성공 시 포로 출신이면 자동으로 페널티가 적용된다', () => {
        const { store, engine } = setupWorld();
        const loyalty = engine['loyaltySystem'];
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        captureOnly(store, target.id);

        // 스텁으로 등용 확정 성공
        const realRandom = Math.random;
        Math.random = () => 0;
        let result: { success: boolean; message: string };
        try {
            result = loyalty.recruit(target.id, 'fac_0', 'city_허창');
        } finally {
            Math.random = realRandom;
        }
        expect(result.success).toBe(true);
        // 페널티 메시지가 loyaltySystem에 기록됨 (UI 로그용)
        expect(loyalty.penaltyMessages.some(m => m.includes('원수화') || m.includes('원수로'))).toBe(true);
        // 실제 외교 반영
        expect(engine.diplomacyEngine.getRelation('fac_0', originFactionId)).toBe(FactionRelation.WAR);
        // 등용 후 포로 마커는 유지 기록되지만 소속은 새 세력
        const after = store.getOfficer(target.id)!;
        expect(after.factionId).toBe('fac_0');
    });
});
