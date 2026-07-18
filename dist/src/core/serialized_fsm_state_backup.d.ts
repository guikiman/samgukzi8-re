/**
 * [E44] FSM 상태 직렬화 자동 백업 — SerializedFSMStateBackup
 *
 * 목적: FSM 전환 시마다 직렬화 스냅샷을 IndexedDB에 저장하여
 *       브라우저 강제 종료 시 마지막 FSM 상태 복원.
 */
export interface FSMBackupEntry {
    readonly id?: number;
    readonly phase: string;
    readonly state: string;
    readonly snapshot: string;
    readonly timestamp: number;
}
export declare class SerializedFSMStateBackup {
    private db;
    private ready;
    init(): Promise<void>;
    saveState(phase: string, state: string, snapshot: string): Promise<void>;
    getLatestState(): Promise<FSMBackupEntry | null>;
    clear(): Promise<void>;
}
//# sourceMappingURL=serialized_fsm_state_backup.d.ts.map