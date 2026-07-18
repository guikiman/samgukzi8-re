/**
 * [4] 연의전 이벤트 생성기 — Narrative Event Generator
 *
 * StoryEventCompiler와 결합하여 사실/가상(IF) 이벤트 발생 여부를
 * 매달 체크하고 분기 조건 스택을 상태 트리에 마운트
 */
export class NarrativeEventGenerator {
    constructor() {
        this.historyRecords = [];
        this.butterflyEffects = new Map();
        this.effectTimestamps = new Map();
        this.eventCounter = 0;
    }
    /**
     * 이벤트 발생 기록
     */
    recordEvent(eventDescription) {
        this.historyRecords.push(eventDescription);
        this.eventCounter++;
    }
    /**
     * 나비효과 추적: 원인 → 결과 연결
     */
    trackButterflyEffect(cause, effect) {
        this.butterflyEffects.set(cause, effect);
        this.effectTimestamps.set(cause, Date.now());
    }
    /**
     * 특정 원인에 대한 나비효과 결과 조회
     */
    getButterflyEffect(cause) {
        return this.butterflyEffects.get(cause) ?? null;
    }
    /**
     * 전체 역사 기록 반환
     */
    getHistory() {
        return this.historyRecords.slice();
    }
    /**
     * 전체 나비효과 맵 반환
     */
    getAllButterflyEffects() {
        const result = {};
        for (const [cause, effect] of this.butterflyEffects) {
            result[cause] = effect;
        }
        return result;
    }
    /**
     * 특정 연도/월에 기록된 이벤트 필터링
     */
    getEventsByYear(year) {
        return this.historyRecords.filter(r => r.includes(`[${year}]`));
    }
    /**
     * 이벤트 카운트
     */
    get totalEvents() {
        return this.eventCounter;
    }
    /**
     * 특정 조건과 일치하는 이벤트 탐색
     */
    findEvents(keyword) {
        return this.historyRecords.filter(r => r.toLowerCase().includes(keyword.toLowerCase()));
    }
    reset() {
        this.historyRecords = [];
        this.butterflyEffects.clear();
        this.effectTimestamps.clear();
        this.eventCounter = 0;
    }
}
//# sourceMappingURL=narrative_event_generator.js.map