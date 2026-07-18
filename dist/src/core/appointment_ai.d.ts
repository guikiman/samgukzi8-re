import type { Personality, OfficerID, CityID } from "./types";
export interface OfficerProfile {
    readonly id: OfficerID;
    readonly leadership: number;
    readonly might: number;
    readonly intelligence: number;
    readonly politics: number;
    readonly charisma: number;
    readonly loyalty: number;
    readonly merit: number;
    readonly personality: Personality;
    readonly currentRank: number;
}
export interface Appointment {
    readonly officerId: OfficerID;
    readonly position: "governor" | "commander" | "strategist" | "diplomat" | "tax_collector";
    readonly locationId?: CityID;
}
export declare class AppointmentAI {
    selectGovernor(candidates: OfficerProfile[]): Appointment | null;
    selectCommander(candidates: OfficerProfile[]): Appointment | null;
    selectStrategist(candidates: OfficerProfile[]): Appointment | null;
    assignGovernors(officers: OfficerProfile[], cities: Array<{
        id: CityID;
        importance: number;
    }>): Appointment[];
    calculateGovernorCompetence(officer: OfficerProfile, cityStability: number): number;
    promoteByMerit(officer: OfficerProfile): {
        promoted: boolean;
        newRank?: number;
    };
}
//# sourceMappingURL=appointment_ai.d.ts.map