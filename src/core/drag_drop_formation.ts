import type { OfficerID } from "./types";

export interface FormationSlot {
  readonly position: "vanguard" | "center" | "rearguard" | "left_wing" | "right_wing";
  readonly label: string;
  assignedOfficerId: OfficerID | null;
  readonly maxSoldiers: number;
}

export class DragDropFormation {
  private slots: FormationSlot[] = [
    { position: "vanguard", label: "전봉", assignedOfficerId: null, maxSoldiers: 5000 },
    { position: "center", label: "중군", assignedOfficerId: null, maxSoldiers: 10000 },
    { position: "rearguard", label: "후군", assignedOfficerId: null, maxSoldiers: 3000 },
    { position: "left_wing", label: "좌익", assignedOfficerId: null, maxSoldiers: 4000 },
    { position: "right_wing", label: "우익", assignedOfficerId: null, maxSoldiers: 4000 },
  ];

  private availableOfficers: Array<{ id: OfficerID; name: string; leadership: number; might: number; maxSoldiers: number }> = [];

  setAvailableOfficers(
    officers: Array<{ id: OfficerID; name: string; leadership: number; might: number; maxSoldiers: number }>,
  ): void {
    this.availableOfficers = officers;
  }

  assignToSlot(slotPosition: FormationSlot["position"], officerId: OfficerID): boolean {
    const slot = this.slots.find((s) => s.position === slotPosition);
    if (!slot) return false;
    if (slot.assignedOfficerId) return false;
    const officer = this.availableOfficers.find((o) => o.id === officerId);
    if (!officer) return false;
    if (this.isOfficerAssigned(officerId)) return false;
    slot.assignedOfficerId = officerId;
    return true;
  }

  removeFromSlot(officerId: OfficerID): boolean {
    const slot = this.slots.find((s) => s.assignedOfficerId === officerId);
    if (!slot) return false;
    slot.assignedOfficerId = null;
    return true;
  }

  moveOfficer(fromPosition: FormationSlot["position"], toPosition: FormationSlot["position"]): boolean {
    if (fromPosition === toPosition) return false;
    const fromSlot = this.slots.find((s) => s.position === fromPosition);
    const toSlot = this.slots.find((s) => s.position === toPosition);
    if (!fromSlot || !toSlot) return false;
    if (toSlot.assignedOfficerId) return false;
    toSlot.assignedOfficerId = fromSlot.assignedOfficerId;
    fromSlot.assignedOfficerId = null;
    return true;
  }

  isOfficerAssigned(officerId: OfficerID): boolean {
    return this.slots.some((s) => s.assignedOfficerId === officerId);
  }

  getSlotOf(officerId: OfficerID): FormationSlot | null {
    return this.slots.find((s) => s.assignedOfficerId === officerId) ?? null;
  }

  getSlots(): FormationSlot[] {
    return [...this.slots];
  }

  getAssignedOfficers(): Array<{ slot: FormationSlot; officer: { id: OfficerID; name: string } | null }> {
    return this.slots.map((slot) => {
      const officer = slot.assignedOfficerId
        ? this.availableOfficers.find((o) => o.id === slot.assignedOfficerId) ?? null
        : null;
      return {
        slot,
        officer: officer ? { id: officer.id, name: officer.name } : null,
      };
    });
  }

  calculateTotalMorale(): number {
    let total = 50;
    for (const slot of this.slots) {
      if (slot.assignedOfficerId) total += 5;
    }
    return Math.min(100, total);
  }

  clearAll(): void {
    for (const slot of this.slots) {
      slot.assignedOfficerId = null;
    }
  }
}