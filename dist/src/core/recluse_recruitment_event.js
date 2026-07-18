export class RecluseRecruitmentEvent {
    constructor() {
        this.id = 'recluse_recruitment';
        this.name = '재야 무장 등용';
        this.type = 'RECRUITMENT';
        this.priority = 'DOMESTIC';
        this.once = false;
    }
    condition() { return true; }
    action() {
        console.log("재야 무장 방문: 등용 제안 이벤트 발생.");
    }
}
//# sourceMappingURL=recluse_recruitment_event.js.map