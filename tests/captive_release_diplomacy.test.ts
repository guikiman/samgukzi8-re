import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { OfficerStatus } from '../src/core/types.js';
import { processBattleSpoils } from '../src/core/battle_spoils_system.js';
import { isCaptive, getCapturedOriginFaction } from '../src/core/captive_escape_system.js';
import {
    applyCaptiveReleaseDiplomacy,
    RELEASE_GOODWILL_PEACE_CHANCE,
} from '../src/core/captive_recruit_penalty_system.js';
import { judgeCaptiveDiplomacy } from '../src/core/ai_captive_system.js';
import { processCaptives } from '../src/core/ai_captive_system.js';
import { FactionRelation } from '../src/core/diplomacy_engine.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('AI 포로 외교 판단 + 석방 선포 [24][341-360]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    function captureOnly(store: GameStore, targetId: string) {
        const defenders = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.id === targetId ? 0 : 0.99 }));
        return processBattleSpoils(store, 'city_허창', 'city_건업', rolls);
    }

    it('judgeCaptiveDiplomacy — 전쟁 중이면 부담 없이 등용 허용', () => {
        expect(judgeCaptiveDiplomacy(true, 200, false, 0.99)).toBe(true);
    });

    it('judgeCaptiveDiplomacy — 고능력 포로(350 이상)는 페널티 감수하고 등용', () => {
        expect(judgeCaptiveDiplomacy(false, 360, false, 0.99)).toBe(true);
        expect(judgeCaptiveDiplomacy(false, 340, false, 0.99)).toBe(false); // 낮은 능력 + 온건 + 나쁜 roll → 회피
    });

    it('judgeCaptiveDiplomacy — 잔혹형은 60%, 온건형은 20% 확률로 페널티 무시', () => {
        expect(judgeCaptiveDiplomacy(false, 200, true, 0.5)).toBe(true);   // 잔혹형 roll 0.5 < 0.6
        expect(judgeCaptiveDiplomacy(false, 200, true, 0.7)).toBe(false);
        expect(judgeCaptiveDiplomacy(false, 200, false, 0.1)).toBe(true);  // 온건형 roll 0.1 < 0.2
        expect(judgeCaptiveDiplomacy(false, 200, false, 0.3)).toBe(false);
    });

    it('석방 선포 — 전쟁 중 상대를 풀어주면 50% 확률로 휴전 + 평판 상승', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        captureOnly(store, target.id);

        // 전쟁 상태 강제
        const diplo = engine.diplomacyEngine;
        diplo.declareWar('fac_0', originFactionId);
        const repBefore = store.getFaction('fac_0')!.reputation;

        // 스텁: 휴전 확률 통과
        const realRandom = Math.random;
        Math.random = () => RELEASE_GOODWILL_PEACE_CHANCE - 0.01;
        let result: ReturnType<typeof applyCaptiveReleaseDiplomacy>;
        try {
            result = applyCaptiveReleaseDiplomacy(store, diplo, 'fac_0', target.id);
        } finally {
            Math.random = realRandom;
        }

        expect(result.originFactionId).toBe(originFactionId);
        expect(result.peaceMade).toBe(true);
        expect(diplo.getRelation('fac_0', originFactionId)).toBe(FactionRelation.NEUTRAL);
        expect(store.getFaction('fac_0')!.reputation).toBeGreaterThan(repBefore);
    });

    it('석방 선포 — 휴전 확률 미달 시 평판만 상승', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        captureOnly(store, target.id);
        const originFactionId = getCapturedOriginFaction(store, target.id)!;

        const diplo = engine.diplomacyEngine;
        diplo.declareWar('fac_0', originFactionId);
        const repBefore = store.getFaction('fac_0')!.reputation;

        const realRandom = Math.random;
        Math.random = () => 0.99; // 휴전 실패
        let result: ReturnType<typeof applyCaptiveReleaseDiplomacy>;
        try {
            result = applyCaptiveReleaseDiplomacy(store, diplo, 'fac_0', target.id);
        } finally {
            Math.random = realRandom;
        }

        expect(result.peaceMade).toBe(false);
        expect(diplo.getRelation('fac_0', originFactionId)).toBe(FactionRelation.WAR);
        expect(store.getFaction('fac_0')!.reputation).toBe(repBefore + 2);
    });

    it('processCaptives — 외교 판단에서 등용 기피 시 석방 + 석방 외교가 실행된다', () => {
        const { store, engine } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const originFactionId = target.factionId!;
        captureOnly(store, target.id);
        expect(isCaptive(store, target.id)).toBe(true);

        const diplo = engine.diplomacyEngine;
        diplo.declareWar('fac_0', originFactionId); // 전쟁 중 아님을 만들 수 없으니 반대로: 전쟁 해제 상태에서 시작
        // 전쟁 상태를 중립으로 되돌림 → warBurden=false
        diplo.makePeace('fac_0', originFactionId);

        // AI가 fac_2(손권 아님 — 유비)의 포로를 처리하는 상황을 시뮬레이션하되,
        // judgeCaptiveDiplomacy에서 회피(roll 0.99 + 온건 + 저능력)되도록 Math.random 스텁:
        // 첫 roll = execRoll(처형 판정) → 온건형 0.1 미만 아니도록 0.5
        // 두번째 = diplomacyRoll → 0.99 (회피)
        // 세번째 = judgeCaptiveRecruit용이지만 판단에서 이미 기피
        // 네번째 = 석방 외교 휴전 판정 → 0.99 (휴전 미달, 평판만)
        const calls: number[] = [];
        const realRandom = Math.random;
        Math.random = () => {
            calls.push(1);
            const idx = calls.length;
            if (idx === 1) return 0.5;   // 처형 아님
            if (idx === 2) return 0.99;  // 외교 판단 기피
            return 0.99;                 // 휴전 미달
        };
        let report: ReturnType<typeof processCaptives>;
        try {
            report = processCaptives(store, 'fac_0', [target.id], diplo);
        } finally {
            Math.random = realRandom;
        }

        const outcome = report.outcomes.find(o => o.officerId === target.id);
        expect(outcome?.decision).toBe('RELEASE');
        // 석방 외교 메시지 포함 (휴전 미달이어도 평판 상승은 진행 — 메시지는 휴전 시에만)
        const rep = store.getFaction('fac_0')!.reputation;
        expect(rep).toBeGreaterThan(0);
        // 석방 후 재야 (플레이어 등용 대상)
        expect(store.getOfficer(target.id)!.status).toBe(OfficerStatus.FREE);
    });
});
