/**
 * [15] 역사 연표 로그 제너레이터 — ChronicleLogGenerator
 * 
 * 목적: 이벤트 기록 및 엔딩 기록.
 */
export class ChronicleLogGenerator {
    private logs: string[] = [];

    public addLog(event: string, year: number): void {
        this.logs.push(`[${year}년] ${event}`);
    }

    public getLogs(): string[] {
        return this.logs;
    }
}
