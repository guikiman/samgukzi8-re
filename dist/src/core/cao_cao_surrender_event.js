export class CaoCaoSurrenderEvent {
    constructor() {
        this.id = 'cao_cao_surrender';
        this.name = '조조 항복';
        this.type = 'SURRENDER';
        this.priority = 'HISTORICAL';
        this.once = true;
    }
    condition() { return true; }
    action() {
        console.log("조조가 항복했습니다.");
    }
}
//# sourceMappingURL=cao_cao_surrender_event.js.map