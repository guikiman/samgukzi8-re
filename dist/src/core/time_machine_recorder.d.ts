/**
 * [9] 턴 스케줄러 디버그용 타임머신 레코더 — TimeMachineRecorder
 *
 * 목적: 턴 이력 기록 및 롤백.
 */
export declare class TimeMachineRecorder {
    private history;
    record(state: any): void;
    undo(): any;
}
//# sourceMappingURL=time_machine_recorder.d.ts.map