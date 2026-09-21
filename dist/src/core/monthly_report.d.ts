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
    cities: Array<{
        name: string;
        funds: number;
        development: number;
        commerce: number;
        farming: number;
    }>;
    /** AI 세력 요약 */
    factions: Array<{
        name: string;
        gold: number;
        cities: number;
        officers: number;
    }>;
}
export declare class MonthlyReportSystem {
    private store;
    constructor(store: GameStore);
    generate(): MonthlyReport;
}
//# sourceMappingURL=monthly_report.d.ts.map