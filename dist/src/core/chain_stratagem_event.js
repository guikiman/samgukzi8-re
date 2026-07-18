export class ChainStratagemEvent {
    constructor() {
        this.id = 'chain_stratagem';
        this.name = '연계 책략';
        this.type = 'STRATAGEM';
        this.priority = 'BATTLE';
        this.once = false;
    }
    condition() { return true; }
    action() {
        console.log("연계 책략 발동: 연환계 + 화계 연쇄.");
    }
}
//# sourceMappingURL=chain_stratagem_event.js.map