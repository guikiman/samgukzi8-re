/**
 * [4] 연의전 이벤트 생성기 — Narrative Event Generator
 *
 * StoryEventCompiler와 결합하여 사실/가상(IF) 이벤트 발생 여부를
 * 매달 체크하고 분기 조건 스택을 상태 트리에 마운트
 */

export interface ButterflyEffect {
    cause: string;
    effect: string;
    timestamp: number;
}

export class NarrativeEventGenerator {
    private historyRecords: string[] = [];
    private butterflyEffects: Map<string, string> = new Map();
    private effectTimestamps: Map<string, number> = new Map();
    private eventCounter = 0;

    /**
     * 이벤트 발생 기록
     */
    recordEvent(eventDescription: string): void {
        this.historyRecords.push(eventDescription);
        this.eventCounter++;
    }

    /**
     * 나비효과 추적: 원인 → 결과 연결
     */
    trackButterflyEffect(cause: string, effect: string): void {
        this.butterflyEffects.set(cause, effect);
        this.effectTimestamps.set(cause, Date.now());
    }

    /**
     * 특정 원인에 대한 나비효과 결과 조회
     */
    getButterflyEffect(cause: string): string | null {
        return this.butterflyEffects.get(cause) ?? null;
    }

    /**
     * 전체 역사 기록 반환
     */
    getHistory(): string[] {
        return this.historyRecords.slice();
    }

    /**
     * 전체 나비효과 맵 반환
     */
    getAllButterflyEffects(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [cause, effect] of this.butterflyEffects) {
            result[cause] = effect;
        }
        return result;
    }

    /**
     * 특정 연도/월에 기록된 이벤트 필터링
     */
    getEventsByYear(year: number): string[] {
        return this.historyRecords.filter(r => r.includes(`[${year}]`));
    }

    /**
     * 이벤트 카운트
     */
    get totalEvents(): number {
        return this.eventCounter;
    }

    /**
     * 특정 조건과 일치하는 이벤트 탐색
     */
    findEvents(keyword: string): string[] {
        return this.historyRecords.filter(r =>
            r.toLowerCase().includes(keyword.toLowerCase()),
        );
    }

    reset(): void {
        this.historyRecords = [];
        this.butterflyEffects.clear();
        this.effectTimestamps.clear();
        this.eventCounter = 0;
    }
}
