import type { Personality } from "./types";
export declare class PersonalityTextGenerator {
    generate(type: "greeting" | "recruitment" | "refusal" | "praise" | "insult" | "feast" | "duel" | "death", personality: Personality): string;
    generateRecruitmentText(recruiterPersonality: Personality, target: {
        name: string;
        rank: string;
    }): string;
    generateDuelStart(playerName: string, opponentName: string, playerPersonality: Personality, opponentPersonality: Personality): {
        playerLine: string;
        opponentLine: string;
    };
}
//# sourceMappingURL=personality_text_generator.d.ts.map