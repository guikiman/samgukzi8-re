/**
 * [Task 22] 친밀도 자연 감소/증가 시스템 — AffinityDecaySystem
 *
 * 성격 궁합, 거리, 시간에 따른 자연스러운 친밀도 변화.
 */
import type { Officer, Personality } from "./types.js";
export interface AffinityDecayConfig {
    readonly baseDecayPerTurn: number;
    readonly maxAffinity: number;
    readonly minAffinity: number;
    readonly interactionBoostDecay: number;
    readonly distanceDecayFactor: number;
}
export declare class AffinityDecaySystem {
    private config;
    private compatibility;
    constructor(config?: Partial<AffinityDecayConfig>);
    resetToDefault(): void;
    private set;
    setCustomCompatibility(a: Personality, b: Personality, factor: number): void;
    getCompatibilityFactor(a: Officer, b: Officer): number;
    calculateDecay(officerA: Officer, officerB: Officer, currentAffinity: number, turnsSinceLastInteraction: number): number;
}
//# sourceMappingURL=affinity_decay_system.d.ts.map