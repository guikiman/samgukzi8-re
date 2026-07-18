/**
 * [9] 턴 스케줄러 디버그용 타임머신 레코더 — TimeMachineRecorder
 *
 * 목적: 턴 이력 기록 및 롤백.
 */
export class TimeMachineRecorder {
    constructor() {
        this.history = [];
    }
    record(state) { this.history.push(state); }
    undo() { return this.history.pop(); }
}
//# sourceMappingURL=time_machine_recorder.js.map