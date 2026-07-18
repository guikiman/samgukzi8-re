/**
 * [Task 88] 워커 로그 중앙 집계 — WorkerLogAggregator
 *
 * 여러 Web Worker에서 발생하는 로그를 중앙에서 수집하고
 * 레벨별 필터링, 버퍼링, 내보내기를 제공.
 */
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
export interface LogEntry {
    readonly id: string;
    readonly timestamp: number;
    readonly workerId: string;
    readonly level: LogLevel;
    readonly message: string;
    readonly context?: Record<string, unknown>;
    readonly turn: number;
}
export interface LogFilter {
    readonly workerId?: string;
    readonly level?: LogLevel;
    readonly minLevel?: LogLevel;
    readonly sinceTurn?: number;
    readonly sinceTimestamp?: number;
    readonly search?: string;
    readonly limit?: number;
}
export declare class WorkerLogAggregator {
    private logs;
    private readonly maxLogs;
    private idCounter;
    constructor(maxLogs?: number);
    /**
     * 로그 추가
     */
    log(workerId: string, level: LogLevel, message: string, turn: number, context?: Record<string, unknown>): LogEntry;
    /**
     * 편의 메서드
     */
    debug(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry;
    info(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry;
    warn(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry;
    error(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry;
    fatal(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry;
    /**
     * 로그 조회 (필터 적용)
     */
    query(filter: LogFilter): LogEntry[];
    /**
     * 특정 워커의 로그
     */
    getWorkerLogs(workerId: string, limit?: number): LogEntry[];
    /**
     * 에러만 조회
     */
    getErrors(minLevel?: LogLevel, limit?: number): LogEntry[];
    /**
     * 최근 로그
     */
    getRecentLogs(count?: number): LogEntry[];
    /**
     * 모든 로그를 문자열로 내보내기
     */
    exportLogs(filter?: LogFilter): string;
    /**
     * 통계
     */
    getStats(): {
        totalLogs: number;
        workerCount: number;
        levelCounts: Record<LogLevel, number>;
        errorCount: number;
    };
    /**
     * 로그 지우기
     */
    clear(): void;
}
//# sourceMappingURL=worker_log_aggregator.d.ts.map