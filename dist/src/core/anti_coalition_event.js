export class AntiCoalitionEvent {
    constructor() {
        this.id = 'anti_coalition';
        this.name = '반조조 연합';
        this.type = 'COALITION';
        this.priority = 'DIPLOMACY';
        this.once = false;
    }
    condition() { return true; }
    action() {
        console.log("반조조 연합 발동: 주변 세력과 연합군 결성.");
    }
}
//# sourceMappingURL=anti_coalition_event.js.map