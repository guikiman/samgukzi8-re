/**
 * 월간 보고서 [E1-361 연계] — 월말 정산 후 수입/지출/AI 행동 요약
 */

import type { GameStore } from './game_store.js';

export interface MonthlyReport {
    year: number;
    month: number;
    turnCount: number;
    /** 플레이어 세력 재정 */
    playerGold: number;
    playerFood: number;
    goldIncome: number;
    foodIncome: number;
    /** 도시별 요약 */
    cities: Array<{ name: string; funds: number; development: number; commerce: number; farming: number }>;
    /** AI 세력 요약 */
    factions: Array<{ name: string; gold: number; cities: number; officers: number }>;
}

export class MonthlyReportSystem {
    constructor(private store: GameStore) {}

    generate(): MonthlyReport {
        const gs = this.store.getGlobalState();
        const playerFactionId = gs.playerFactionId;
        const playerFaction = playerFactionId ? this.store.getFaction(playerFactionId) : null;
        const playerCities = playerFactionId ? this.store.getCitiesByFaction(playerFactionId) : [];

        return {
            year: gs.time.year,
            month: gs.time.month,
            turnCount: gs.turnCount,
            playerGold: playerFaction?.gold ?? 0,
            playerFood: playerFaction?.food ?? 0,
            goldIncome: playerCities.reduce((s, c) => s + c.goldIncome, 0),
            foodIncome: playerCities.reduce((s, c) => s + c.foodIncome, 0),
            cities: playerCities.map(c => ({
                name: c.name,
                funds: c.funds,
                development: c.development,
                commerce: c.developmentStats.commerce,
                farming: c.developmentStats.farming,
            })),
            factions: this.store.getAllFactions()
                .filter(f => f.id !== playerFactionId)
                .map(f => ({
                    name: f.name,
                    gold: f.gold,
                    cities: this.store.getCitiesByFaction(f.id).length,
                    officers: this.store.getAllOfficers().filter(o => o.factionId === f.id).length,
                })),
        };
    }
}
