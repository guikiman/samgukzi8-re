import type { OfficerID } from "./types";
export interface PregnancyEvent {
    readonly motherId: OfficerID;
    readonly fatherId: OfficerID;
    readonly conceivedAtTurn: number;
    readonly dueTurn: number;
    readonly complications: boolean;
}
export declare class PregnancySimulator {
    private pregnancies;
    calculatePregnancyChance(motherAge: number, marriageDuration: number, existingChildren: number): number;
    conceive(motherId: OfficerID, fatherId: OfficerID, currentTurn: number): PregnancyEvent | null;
    checkBirth(pregnancy: PregnancyEvent, currentTurn: number): {
        birth: boolean;
        stillbirth: boolean;
        twins: boolean;
    };
    getActivePregnancies(): PregnancyEvent[];
    removePregnancy(motherId: OfficerID, turn: number): void;
    generateBirthEvent(motherName: string, fatherName: string, twins: boolean, stillbirth: boolean): string;
}
//# sourceMappingURL=pregnancy_simulator.d.ts.map