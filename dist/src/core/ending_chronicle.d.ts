/**
 * [16] 엔딩 시점 무장 평전(Chronicle) 절차적 오토 파일러
 *
 * ActionHistoryTracker → EndingChronicleGenerator
 * - 전법 크리티컬로 유명 장수를 벤 기록
 * - 결혼한 해, 반란 진압 시점
 * - 역사 문헌 형태로 자동 빌드
 */
export interface HistoryEntry {
    readonly year: number;
    readonly month: number;
    readonly eventType: 'BATTLE' | 'MARRIAGE' | 'REBELLION' | 'APPOINTMENT' | 'DIPLOMACY' | 'DEATH';
    readonly description: string;
    readonly involvedOfficers: readonly string[];
    readonly significance: number;
}
export interface ChroniclePage {
    readonly title: string;
    readonly content: string;
    readonly year: number;
    readonly entries: readonly HistoryEntry[];
}
export declare class ActionHistoryTracker {
    private history;
    private maxEntries;
    record(entry: HistoryEntry): void;
    getHistory(): readonly HistoryEntry[];
}
export declare class EndingChronicleGenerator {
    private tracker;
    constructor(tracker: ActionHistoryTracker);
    /**
     * [16] 엔딩 트리거 시 평전 생성
     * 유저의 대소 사건들을 결합해 역사 문헌 형태로 빌드
     */
    generateChronicle(playerName: string, endYear: number): ChroniclePage[];
    private formatChapter;
}
//# sourceMappingURL=ending_chronicle.d.ts.map