import type { ChildGenome } from "./child_genetics";
import type { OfficerID } from "./types";
export interface DebutOfficer {
    readonly id: OfficerID;
    readonly name: string;
    readonly age: number;
    readonly genome: ChildGenome;
    readonly parentIds: [OfficerID, OfficerID];
    readonly mentorId: OfficerID | null;
    readonly debutType: "faction_officer" | "free_retainer" | "wanderer";
}
export declare class ComingOfAgeSystem {
    private readonly ADULTHOOD_AGE;
    checkComingOfAge(age: number): boolean;
    generateName(fatherName: string, motherName: string, gender: "M" | "F"): string;
    determineDebut(genome: ChildGenome, parentFactionId: string | null, parentMerit: number): {
        type: DebutOfficer["debutType"];
        startingRank: number;
        startingLoyalty: number;
    };
    generateDebutEvent(childName: string, debutType: DebutOfficer["debutType"], fatherName: string): string;
}
//# sourceMappingURL=coming_of_age_system.d.ts.map