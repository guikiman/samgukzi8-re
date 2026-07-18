export class EmperorInstallationEvent {
    constructor() {
        this.id = 'emperor_installation';
        this.name = '황제 옹립';
        this.type = 'EMPEROR';
        this.priority = 'HISTORICAL';
        this.once = true;
    }
    condition() { return true; }
    action() {
        console.log("황제 옹립: 위엄 +300, 타 세력 반감.");
    }
}
//# sourceMappingURL=emperor_installation_event.js.map