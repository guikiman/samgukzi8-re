/**
 * [9] 턴 스케줄러 디버그용 타임머신 레코더 — TimeMachineRecorder
 * 
 * 목적: 턴 이력 기록 및 롤백.
 */
export class TimeMachineRecorder {
    private history: any[] = [];
    public record(state: any): void { this.history.push(state); }
    public undo(): any { return this.history.pop(); }
}
