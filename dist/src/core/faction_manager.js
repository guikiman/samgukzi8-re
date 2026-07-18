/**
 * [2] 파벌 및 갈등 관리 — Faction Manager
 *
 * [383] 파벌 갈등 (구신 vs 신진)
 * [385] 낙하산 인사 불만
 */
export class FactionManager {
    constructor() {
        this.cliques = new Map();
        this.rivalryLevels = new Map();
    }
    rivalryKey(a, b) {
        return [a, b].sort().join('::');
    }
    manageCliqueRivalry(cliqueA, cliqueB, conflict) {
        const key = this.rivalryKey(cliqueA, cliqueB);
        const current = this.rivalryLevels.get(key) ?? 0;
        this.rivalryLevels.set(key, Math.min(100, current + conflict));
    }
    getRivalryLevel(cliqueA, cliqueB) {
        return this.rivalryLevels.get(this.rivalryKey(cliqueA, cliqueB)) ?? 0;
    }
    addToClique(cliqueId, officerId) {
        if (!this.cliques.has(cliqueId)) {
            this.cliques.set(cliqueId, new Set());
        }
        this.cliques.get(cliqueId).add(officerId);
    }
    removeFromClique(cliqueId, officerId) {
        this.cliques.get(cliqueId)?.delete(officerId);
    }
    getCliqueMembers(cliqueId) {
        return Array.from(this.cliques.get(cliqueId) ?? []);
    }
    getCliques() {
        return Array.from(this.cliques.keys());
    }
    getAllRivalries() {
        return Array.from(this.rivalryLevels.entries()).map(([key, level]) => {
            const [a, b] = key.split('::');
            return { cliqueA: a, cliqueB: b, conflictLevel: level };
        });
    }
    reset() {
        this.cliques.clear();
        this.rivalryLevels.clear();
    }
}
//# sourceMappingURL=faction_manager.js.map