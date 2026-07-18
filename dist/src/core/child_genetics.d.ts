import type { Personality } from "./types";
export interface ChildGenome {
    leadership: number;
    might: number;
    intelligence: number;
    politics: number;
    charisma: number;
    personality: Personality;
    gender: "M" | "F";
}
export declare class ChildGenetics {
    private readonly MUTATION_RATE;
    private readonly MUTATION_RANGE;
    generateChildGenome(fatherStats: {
        leadership: number;
        might: number;
        intelligence: number;
        politics: number;
        charisma: number;
    }, motherStats: {
        leadership: number;
        might: number;
        intelligence: number;
        politics: number;
        charisma: number;
    }, fatherPersonality: Personality, motherPersonality: Personality): ChildGenome;
    private inheritTrait;
    private mutate;
    private inheritPersonality;
    calculateTalent(genome: ChildGenome): "genius" | "gifted" | "average" | "slow";
}
//# sourceMappingURL=child_genetics.d.ts.map