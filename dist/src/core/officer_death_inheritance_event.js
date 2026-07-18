export class OfficerDeathInheritanceEvent {
    constructor() {
        this.id = 'officer_death_inheritance';
        this.name = '무장 사망 및 상속';
        this.type = 'DEATH_INHERITANCE';
        this.priority = 'HISTORICAL';
        this.once = true;
    }
    condition() { return true; }
    action() {
        console.log("군주 사망: 후계자에게 세력 승계 처리.");
    }
}
//# sourceMappingURL=officer_death_inheritance_event.js.map