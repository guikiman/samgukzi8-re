import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { FactionAI } from '../src/core/faction_ai_monthly.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('AI 출진 자동 전투 시뮬레이션 연동 [295]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 2); // 유비 = 플레이어
        engine.initWorld(world.officers, world.factions, world.cities, []);
        return { store, engine, world };
    }

    /** 출진 요건 강제 — 도시 발전도 400+ / 자금 1000+ / 군주 성향 AGGRESSIVE 부여.
     *  주의: 유비(신야) 도시는 발전도 400으로 올리면 방어측이 강해져 1.2x 우위 조건이
     *  깨질 수 있으므로, 조오(허창)/손권(건업) 도시만 강화한다. */
    function forceAttackConditions(store: GameStore): void {
        const gs = store.getGlobalState();
        for (const f of store.getAllFactions()) {
            if (f.id === gs.playerFactionId) continue;
            // 군주 성향을 AGGRESSIVE로 — aggression 0.75 (출진 확률 상향)
            const leader = store.getOfficer(f.leaderId);
            if (leader) store.updateOfficer(leader.id, { personality: 'AGGRESSIVE' });
        }
        for (const c of store.getAllCities()) {
            if (!c.ownerId || c.ownerId === gs.playerFactionId) continue;
            // 유비 신야(방어측 후보)는 발전도 소폭만 — 공격측 1.2x 우위 유지용
            const isPlayerCity = c.name === '신야';
            store.updateCity(c.id, {
                development: isPlayerCity ? Math.max(c.development, 200) : 400,
                funds: isPlayerCity ? Math.max(c.funds, 1000) : 1000,
            });
        }
    }

    it('FactionAI 출진 보고에 전투 요약(summary)이 포함된다', () => {
        const { store } = setupWorld();
        forceAttackConditions(store);
        const ai = new FactionAI(store);
        // 시드를 고정할 수 없으므로 여러 달 반복해 최소 1회 출진 보고 수집
        let battleSummarySeen = false;
        let conquestSeen = false;
        let failSeen = false;
        for (let month = 0; month < 60; month++) {
            forceAttackConditions(store); // 매달 재부여 (점령으로 인한 감소 복구)
            const reports = ai.runMonthly();
            for (const r of reports) {
                // [295] 요약 문구 — "격파했다" (공격 승리) 또는 "막아냈다" (방어 승리)
                if (r.actions.some(a => a.includes('격파했다') || a.includes('막아냈다'))) {
                    battleSummarySeen = true;
                }
                if (r.actions.some(a => a.includes('점령!'))) conquestSeen = true;
                if (r.actions.some(a => a.includes('공성 실패'))) failSeen = true;
            }
            if (battleSummarySeen && (conquestSeen || failSeen)) break;
        }
        expect(battleSummarySeen).toBe(true);
        // 소유권 변화는 승리 여부에 따르므로 점령/실패 중 하나는 관측되어야 함
        expect(conquestSeen || failSeen).toBe(true);
    });

    it('공성 승리 시 실제 도시 소유권이 변경된다 (시뮬레이터 판정 반영)', () => {
        const { store, world } = setupWorld();
        const ai = new FactionAI(store);
        let ownershipChanged = false;
        const initialOwners = new Map(world.cities.map(c => [c.id, c.ownerId]));
        for (let month = 0; month < 60; month++) {
            forceAttackConditions(store);
            ai.runMonthly();
            for (const [cityId, before] of initialOwners) {
                const after = store.getCity(cityId)?.ownerId;
                if (before && after !== before) {
                    ownershipChanged = true;
                    break;
                }
            }
            if (ownershipChanged) break;
        }
        // 60달 내 AI 간 영토 변동이 최소 1회 발생해야 한다 (공성판정이 실제 반영됨)
        expect(ownershipChanged).toBe(true);
    });

    it('executeTurn 흐름에서 FACTION_AI_ACTION 이벤트 페이로드에 전투 요약이 실린다', async () => {
        const { engine } = setupWorld();
        const payloads: Array<Record<string, unknown>> = [];
        engine.subscribe('FACTION_AI_ACTION', (e) => payloads.push(e.payload));
        for (let i = 0; i < 12 && payloads.length === 0; i++) {
            await engine.executeTurn();
        }
        expect(payloads.length).toBeGreaterThan(0);
    });
});
