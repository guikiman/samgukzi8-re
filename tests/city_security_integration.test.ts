import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';
import { RIOT_THRESHOLD } from '../src/core/city_security_system.js';

describe('도시 안정 월간 판정 연동 [148]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 2); // 유비 = 플레이어
        engine.initWorld(world.officers, world.factions, world.cities, []);
        return { store, engine, world };
    }

    /** 판정 순서: 군량 수입(processMonthlyMaintenance)은 아사 판정 후 반영되므로,
     *  executeTurn 직전에 food=0으로 만들면 1회성 수입 회복 없이 판정을 통과한다. */
    it('평시에는 아사/민란이 발생하지 않는다', async () => {
        const { engine, store } = setupWorld();
        // 군량/자금 충분히 보장
        for (const f of store.getAllFactions()) {
            store.updateFaction(f.id, { food: 100000, gold: 100000 });
        }
        const riots: string[] = [];
        const starves: string[] = [];
        engine.subscribe('CITY_RIOT', (e) => riots.push(String(e.payload.cityId)));
        engine.subscribe('CITY_STARVATION', (e) => starves.push(String(e.payload.cityId)));
        await engine.executeTurn();
        expect(riots.length).toBe(0);
        expect(starves.length).toBe(0);
        // 월간 로그도 비어 있어야 함
        const log = engine.peekMonthlySecurityLog(true);
        expect(log.riots.length).toBe(0);
        expect(log.starvations.length).toBe(0);
    });

    it('세력 군량 0이면 소속 도시에서 아사(병력 5% 소모)가 발생한다', async () => {
        const { engine, store, world } = setupWorld();
        // 모든 세력 군량 0 — 판정은 수입 반영 전이므로 이 턴에서 확정 발생
        for (const f of store.getAllFactions()) {
            store.updateFaction(f.id, { food: 0 });
        }
        const starves: Array<{ cityId: string; losses: number }> = [];
        engine.subscribe('CITY_STARVATION', (e) => {
            starves.push({
                cityId: String(e.payload.cityId),
                losses: Number(e.payload.losses),
            });
        });
        await engine.executeTurn();

        // 소유 도시 전체에서 아사 발생 (Python 규격: soldiers(=development 프록시) // 20)
        expect(starves.length).toBeGreaterThan(0);
        for (const s of starves) {
            // Python: soldiers // 20 — 병력 프록시는 도시 development
            expect(s.losses).toBeGreaterThan(0);
            const after = store.getCity(s.cityId as never)?.development ?? 0;
            expect(after).toBeGreaterThanOrEqual(0);
        }
        // 월간 로그에도 기록
        const log = engine.peekMonthlySecurityLog(true);
        expect(log.starvations.length).toBe(starves.length);
        // consume 후 비워짐
        expect(engine.peekMonthlySecurityLog().starvations.length).toBe(0);
    });

    it('민란 위험도 100 도달 시 억제 실패하면 도시가 소속 세력에서 이탈한다', async () => {
        const { engine, store, world } = setupWorld();
        const riots: Array<{ cityId: string; from: string | null }> = [];
        engine.subscribe('CITY_RIOT', (e) => {
            riots.push({
                cityId: String(e.payload.cityId),
                from: (e.payload.fromFactionId as string | null) ?? null,
            });
        });
        // 위험도 축적: 군량 0으로 반복 아사 → 턴당 순증 +10 (아사 +15, 자연감소 -5).
        // 100 도달에 10턴. 안전 마진을 두고 12턴 축적 후 억제 실패(override 1.0)로 민란 확정.
        for (let i = 0; i < 12; i++) {
            for (const f of store.getAllFactions()) {
                store.updateFaction(f.id, { food: 0 });
            }
            await engine.executeTurn();
        }
        for (const f of store.getAllFactions()) {
            store.updateFaction(f.id, { food: 0 });
        }
        engine.setRiotRollOverride(1.0); // roll < suppression(≤0.8)이 항상 거짓 → 억제 실패 확정
        await engine.executeTurn();

        // 민란 발생 → 소유 도시 전체 무주화
        expect(riots.length).toBeGreaterThan(0);
        for (const r of riots) {
            expect(store.getCity(r.cityId as never)?.ownerId).toBeNull();
        }
    });

    it('민란 발생 시 연대기에 기록된다', async () => {
        const { engine, store } = setupWorld();
        // 위험도 축적 12턴 (턴당 순증 +10) + 억제 실패 강제로 민란 확정 발생
        for (let i = 0; i < 12; i++) {
            for (const f of store.getAllFactions()) {
                store.updateFaction(f.id, { food: 0 });
            }
            await engine.executeTurn();
        }
        for (const f of store.getAllFactions()) {
            store.updateFaction(f.id, { food: 0 });
        }
        engine.setRiotRollOverride(1.0);
        await engine.executeTurn();

        const entries = engine.chronicle.list();
        const riotEntries = entries.filter(e => e.text.includes('민란'));
        expect(riotEntries.length).toBeGreaterThan(0);
    });
});
