import type { OfficerID } from "./types";
export interface FormationSlot {
    readonly position: "vanguard" | "center" | "rearguard" | "left_wing" | "right_wing";
    readonly label: string;
    assignedOfficerId: OfficerID | null;
    readonly maxSoldiers: number;
}
export declare class DragDropFormation {
    private slots;
    private availableOfficers;
    setAvailableOfficers(officers: Array<{
        id: OfficerID;
        name: string;
        leadership: number;
        might: number;
        maxSoldiers: number;
    }>): void;
    assignToSlot(slotPosition: FormationSlot["position"], officerId: OfficerID): boolean;
    removeFromSlot(officerId: OfficerID): boolean;
    moveOfficer(fromPosition: FormationSlot["position"], toPosition: FormationSlot["position"]): boolean;
    isOfficerAssigned(officerId: OfficerID): boolean;
    getSlotOf(officerId: OfficerID): FormationSlot | null;
    getSlots(): FormationSlot[];
    getAssignedOfficers(): Array<{
        slot: FormationSlot;
        officer: {
            id: OfficerID;
            name: string;
        } | null;
    }>;
    calculateTotalMorale(): number;
    clearAll(): void;
}
//# sourceMappingURL=drag_drop_formation.d.ts.map