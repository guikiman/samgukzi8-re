/**
 * [2] 파벌 및 갈등 관리 — Faction Manager
 *
 * [383] 파벌 갈등 (구신 vs 신진)
 * [385] 낙하산 인사 불만
 */
export interface CliqueRivalry {
    readonly cliqueA: string;
    readonly cliqueB: string;
    readonly conflictLevel: number;
}
export declare class FactionManager {
    private cliques;
    private rivalryLevels;
    private rivalryKey;
    manageCliqueRivalry(cliqueA: string, cliqueB: string, conflict: number): void;
    getRivalryLevel(cliqueA: string, cliqueB: string): number;
    addToClique(cliqueId: string, officerId: string): void;
    removeFromClique(cliqueId: string, officerId: string): void;
    getCliqueMembers(cliqueId: string): string[];
    getCliques(): string[];
    getAllRivalries(): CliqueRivalry[];
    reset(): void;
}
//# sourceMappingURL=faction_manager.d.ts.map