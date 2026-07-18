export class DeathBedEvent {
    constructor() {
        this.id = 'death_bed';
        this.name = '임종 및 유서';
        this.type = 'DEATH';
        this.priority = 'HISTORICAL';
        this.once = true;
    }
    condition() { return true; }
    action() {
        console.log("임종 이벤트: 가보 및 영구 버프 전수.");
    }
}
//# sourceMappingURL=death_bed_event.js.map