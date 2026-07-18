/**
 * [15] 역사 연표 로그 제너레이터 — ChronicleLogGenerator
 *
 * 목적: 이벤트 기록 및 엔딩 기록.
 */
export class ChronicleLogGenerator {
    constructor() {
        this.logs = [];
    }
    addLog(event, year) {
        this.logs.push(`[${year}년] ${event}`);
    }
    getLogs() {
        return this.logs;
    }
}
//# sourceMappingURL=chronicle_log_generator.js.map