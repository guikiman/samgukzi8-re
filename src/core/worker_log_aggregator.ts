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

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4,
};

export class WorkerLogAggregator {
  private logs: LogEntry[] = [];
  private readonly maxLogs: number;
  private idCounter = 0;

  constructor(maxLogs = 10000) {
    this.maxLogs = maxLogs;
  }

  /**
   * 로그 추가
   */
  log(
    workerId: string,
    level: LogLevel,
    message: string,
    turn: number,
    context?: Record<string, unknown>,
  ): LogEntry {
    const entry: LogEntry = {
      id: `log_${this.idCounter++}_${Date.now()}`,
      timestamp: Date.now(),
      workerId, level, message, turn, context,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    return entry;
  }

  /**
   * 편의 메서드
   */
  debug(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry {
    return this.log(workerId, "DEBUG", message, turn, context);
  }

  info(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry {
    return this.log(workerId, "INFO", message, turn, context);
  }

  warn(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry {
    return this.log(workerId, "WARN", message, turn, context);
  }

  error(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry {
    return this.log(workerId, "ERROR", message, turn, context);
  }

  fatal(workerId: string, message: string, turn: number, context?: Record<string, unknown>): LogEntry {
    return this.log(workerId, "FATAL", message, turn, context);
  }

  /**
   * 로그 조회 (필터 적용)
   */
  query(filter: LogFilter): LogEntry[] {
    let results = [...this.logs];

    if (filter.workerId) {
      results = results.filter((e) => e.workerId === filter.workerId);
    }
    if (filter.level) {
      results = results.filter((e) => e.level === filter.level);
    }
    if (filter.minLevel) {
      const minRank = LOG_LEVEL_RANK[filter.minLevel];
      results = results.filter((e) => LOG_LEVEL_RANK[e.level] >= minRank);
    }
    if (filter.sinceTurn) {
      results = results.filter((e) => e.turn >= filter.sinceTurn!);
    }
    if (filter.sinceTimestamp) {
      results = results.filter((e) => e.timestamp >= filter.sinceTimestamp!);
    }
    if (filter.search) {
      const lower = filter.search.toLowerCase();
      results = results.filter((e) => e.message.toLowerCase().includes(lower));
    }

    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  /**
   * 특정 워커의 로그
   */
  getWorkerLogs(workerId: string, limit = 100): LogEntry[] {
    return this.query({ workerId, limit });
  }

  /**
   * 에러만 조회
   */
  getErrors(minLevel: LogLevel = "ERROR", limit = 50): LogEntry[] {
    return this.query({ minLevel, limit });
  }

  /**
   * 최근 로그
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 모든 로그를 문자열로 내보내기
   */
  exportLogs(filter?: LogFilter): string {
    const entries = filter ? this.query(filter) : this.logs;
    return entries.map((e) => {
      const time = new Date(e.timestamp).toISOString();
      const ctx = e.context ? ` ${JSON.stringify(e.context)}` : "";
      return `[${time}] [${e.workerId}] [${e.level}] (T${e.turn}) ${e.message}${ctx}`;
    }).join("\n");
  }

  /**
   * 통계
   */
  getStats(): { totalLogs: number; workerCount: number; levelCounts: Record<LogLevel, number>; errorCount: number } {
    const workers = new Set(this.logs.map((e) => e.workerId));
    const levelCounts: Record<LogLevel, number> = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, FATAL: 0 };
    for (const entry of this.logs) {
      levelCounts[entry.level]++;
    }
    return {
      totalLogs: this.logs.length,
      workerCount: workers.size,
      levelCounts,
      errorCount: levelCounts.ERROR + levelCounts.FATAL,
    };
  }

  /**
   * 로그 지우기
   */
  clear(): void {
    this.logs = [];
  }
}
