/**
 * [Task 1] GameCalendar — 연도/계절/월 기반 시간 동기화 모델
 *
 * 삼국지 8 리메이크 특유의 연도/계절(춘/하/추/동) 및
 * 월(Month) 단위 시간을 관리하는 서브 상태 클래스.
 */
export type Season = "spring" | "summer" | "autumn" | "winter";
export declare class GameCalendar {
    year: number;
    month: number;
    constructor(year?: number, month?: number);
    get season(): Season;
    advanceMonths(n: number): void;
    advanceTurn(): void;
    clone(): GameCalendar;
    toString(): string;
}
//# sourceMappingURL=game_calendar.d.ts.map