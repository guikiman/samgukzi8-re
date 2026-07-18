/**
 * [2] 파벌 및 갈등 관리 — Faction Manager
 *
 * [383] 파벌 갈등 (구신 vs 신진)
 * [385] 낙하산 인사 불만
 */

import type { FactionID } from './types.js';

export interface CliqueRivalry {
    readonly cliqueA: string;
    readonly cliqueB: string;
    readonly conflictLevel: number;
}

export class FactionManager {
    private cliques: Map<string, Set<string>> = new Map();
    private rivalryLevels: Map<string, number> = new Map();

    private rivalryKey(a: string, b: string): string {
        return [a, b].sort().join('::');
    }

    manageCliqueRivalry(cliqueA: string, cliqueB: string, conflict: number): void {
        const key = this.rivalryKey(cliqueA, cliqueB);
        const current = this.rivalryLevels.get(key) ?? 0;
        this.rivalryLevels.set(key, Math.min(100, current + conflict));
    }

    getRivalryLevel(cliqueA: string, cliqueB: string): number {
        return this.rivalryLevels.get(this.rivalryKey(cliqueA, cliqueB)) ?? 0;
    }

    addToClique(cliqueId: string, officerId: string): void {
        if (!this.cliques.has(cliqueId)) {
            this.cliques.set(cliqueId, new Set());
        }
        this.cliques.get(cliqueId)!.add(officerId);
    }

    removeFromClique(cliqueId: string, officerId: string): void {
        this.cliques.get(cliqueId)?.delete(officerId);
    }

    getCliqueMembers(cliqueId: string): string[] {
        return Array.from(this.cliques.get(cliqueId) ?? []);
    }

    getCliques(): string[] {
        return Array.from(this.cliques.keys());
    }

    getAllRivalries(): CliqueRivalry[] {
        return Array.from(this.rivalryLevels.entries()).map(([key, level]) => {
            const [a, b] = key.split('::');
            return { cliqueA: a, cliqueB: b, conflictLevel: level };
        });
    }

    reset(): void {
        this.cliques.clear();
        this.rivalryLevels.clear();
    }
}
