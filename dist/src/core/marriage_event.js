export class MarriageEvent {
    constructor() {
        this.id = 'marriage';
        this.name = '결혼';
        this.type = 'MARRIAGE';
        this.priority = 'FICTIONAL';
        this.once = true;
    }
    condition() { return true; }
    action() {
        console.log("결혼 이벤트: 배우자 관계 설정 및 버프 부여.");
    }
}
//# sourceMappingURL=marriage_event.js.map