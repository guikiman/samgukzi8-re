export class InformationMerchantEvent {
    constructor() {
        this.id = 'information_merchant';
        this.name = '정보상';
        this.type = 'INTELLIGENCE';
        this.priority = 'DIPLOMACY';
        this.once = false;
    }
    condition() { return true; }
    action() {
        console.log("정보상: 특정 무장의 위치 및 상태 확인.");
    }
}
//# sourceMappingURL=information_merchant_event.js.map