import type { Personality } from "./types";
export interface Rumor {
    readonly id: string;
    readonly targetId: string;
    readonly text: string;
    readonly severity: "minor" | "major" | "scandal";
    readonly spreadRadius: number;
    readonly createdAt: number;
    readonly lifetime: number;
}
export interface CityReputation {
    readonly cityId: string;
    fame: number;
    infamy: number;
    activeRumors: string[];
}
export declare class ReputationRumorSystem {
    private rumors;
    private cityReputations;
    private officerReputations;
    setOfficerReputation(officerId: string, fame: number, infamy: number): void;
    getOfficerReputation(officerId: string): {
        fame: number;
        infamy: number;
    };
    setCityReputation(cityId: string, fame: number, infamy: number): void;
    getCityReputation(cityId: string): CityReputation;
    generateRumor(targetId: string, severity: Rumor["severity"], personality?: Personality): Rumor;
    propagateRumor(rumorId: string, adjacentCityIds: string[]): string[];
    applyPersonalityRumorBonus(personality: Personality): number;
    cleanExpiredRumors(): number;
    getActiveRumors(): Rumor[];
    getRumorsAbout(targetId: string): Rumor[];
}
//# sourceMappingURL=reputation_rumor_system.d.ts.map