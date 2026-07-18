export class RebellionBanditEvent {
    constructor() {
        this.id = 'rebellion_bandit';
        this.name = '반란/도적 출현';
        this.type = 'REBELLION';
        this.priority = 'DOMESTIC';
        this.once = false;
    }
    condition() { return true; }
    action() {
        console.log("반란 발생: 치안 및 자원 피해.");
    }
}
//# sourceMappingURL=rebellion_bandit_event.js.map