export class DragDropFormation {
    constructor() {
        this.slots = [
            { position: "vanguard", label: "전봉", assignedOfficerId: null, maxSoldiers: 5000 },
            { position: "center", label: "중군", assignedOfficerId: null, maxSoldiers: 10000 },
            { position: "rearguard", label: "후군", assignedOfficerId: null, maxSoldiers: 3000 },
            { position: "left_wing", label: "좌익", assignedOfficerId: null, maxSoldiers: 4000 },
            { position: "right_wing", label: "우익", assignedOfficerId: null, maxSoldiers: 4000 },
        ];
        this.availableOfficers = [];
    }
    setAvailableOfficers(officers) {
        this.availableOfficers = officers;
    }
    assignToSlot(slotPosition, officerId) {
        const slot = this.slots.find((s) => s.position === slotPosition);
        if (!slot)
            return false;
        if (slot.assignedOfficerId)
            return false;
        const officer = this.availableOfficers.find((o) => o.id === officerId);
        if (!officer)
            return false;
        if (this.isOfficerAssigned(officerId))
            return false;
        slot.assignedOfficerId = officerId;
        return true;
    }
    removeFromSlot(officerId) {
        const slot = this.slots.find((s) => s.assignedOfficerId === officerId);
        if (!slot)
            return false;
        slot.assignedOfficerId = null;
        return true;
    }
    moveOfficer(fromPosition, toPosition) {
        if (fromPosition === toPosition)
            return false;
        const fromSlot = this.slots.find((s) => s.position === fromPosition);
        const toSlot = this.slots.find((s) => s.position === toPosition);
        if (!fromSlot || !toSlot)
            return false;
        if (toSlot.assignedOfficerId)
            return false;
        toSlot.assignedOfficerId = fromSlot.assignedOfficerId;
        fromSlot.assignedOfficerId = null;
        return true;
    }
    isOfficerAssigned(officerId) {
        return this.slots.some((s) => s.assignedOfficerId === officerId);
    }
    getSlotOf(officerId) {
        return this.slots.find((s) => s.assignedOfficerId === officerId) ?? null;
    }
    getSlots() {
        return [...this.slots];
    }
    getAssignedOfficers() {
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
    calculateTotalMorale() {
        let total = 50;
        for (const slot of this.slots) {
            if (slot.assignedOfficerId)
                total += 5;
        }
        return Math.min(100, total);
    }
    clearAll() {
        for (const slot of this.slots) {
            slot.assignedOfficerId = null;
        }
    }
}
//# sourceMappingURL=drag_drop_formation.js.map