/**
 * [16] 엔딩 시점 무장 평전(Chronicle) 절차적 오토 파일러
 *
 * ActionHistoryTracker → EndingChronicleGenerator
 * - 전법 크리티컬로 유명 장수를 벤 기록
 * - 결혼한 해, 반란 진압 시점
 * - 역사 문헌 형태로 자동 빌드
 */
export class ActionHistoryTracker {
    constructor() {
        this.history = [];
        this.maxEntries = 500;
    }
    record(entry) {
        this.history.push(entry);
        if (this.history.length > this.maxEntries) {
            this.history.shift(); // 오래된 기록 제거
        }
    }
    getHistory() { return this.history; }
}
export class EndingChronicleGenerator {
    constructor(tracker) {
        this.tracker = tracker;
    }
    /**
     * [16] 엔딩 트리거 시 평전 생성
     * 유저의 대소 사건들을 결합해 역사 문헌 형태로 빌드
     */
    generateChronicle(playerName, endYear) {
        const history = this.tracker.getHistory();
        const pages = [];
        // 서문
        pages.push({
            title: `${playerName} 평전`,
            content: `삼국지 후한 말, 영웅들이 할거하던 시대. ${playerName}은/는 그 혼란 속에서 위대한 발자취를 남겼다.`,
            year: endYear,
            entries: [],
        });
        // 연도별 챕터
        const years = [...new Set(history.map(e => e.year))].sort((a, b) => a - b);
        for (const year of years) {
            const entries = history.filter(e => e.year === year && e.significance >= 30);
            if (entries.length === 0)
                continue;
            const content = this.formatChapter(entries, year);
            pages.push({ title: `${year}년`, content, year, entries });
        }
        // 주요 전투 기록
        const battles = history.filter(e => e.eventType === 'BATTLE' && e.significance >= 50);
        if (battles.length > 0) {
            const content = battles.map(b => `• ${b.description}`).join('\n');
            pages.push({ title: '주요 전투 기록', content, year: endYear, entries: battles });
        }
        return pages;
    }
    formatChapter(entries, year) {
        const lines = entries.map(e => {
            const monthStr = `${e.month}월`;
            const desc = e.description;
            const signif = e.significance >= 70 ? ' (중대한 사건)' : '';
            return `  ${monthStr}: ${desc}${signif}`;
        });
        return `${year}년, 다음과 같은 일이 있었다.\n${lines.join('\n')}`;
    }
}
//# sourceMappingURL=ending_chronicle.js.map