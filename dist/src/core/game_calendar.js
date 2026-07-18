/**
 * [Task 1] GameCalendar — 연도/계절/월 기반 시간 동기화 모델
 *
 * 삼국지 8 리메이크 특유의 연도/계절(춘/하/추/동) 및
 * 월(Month) 단위 시간을 관리하는 서브 상태 클래스.
 */
const SEASON_CYCLE = ["spring", "summer", "autumn", "winter"];
export class GameCalendar {
    constructor(year = 184, month = 1) {
        this.year = year;
        this.month = month;
    }
    get season() {
        return SEASON_CYCLE[Math.floor((this.month - 1) / 3)];
    }
    advanceMonths(n) {
        this.month += n;
        while (this.month > 12) {
            this.month -= 12;
            this.year++;
        }
    }
    advanceTurn() {
        this.advanceMonths(1);
    }
    clone() {
        return new GameCalendar(this.year, this.month);
    }
    toString() {
        const seasonLabels = {
            spring: "춘", summer: "하", autumn: "추", winter: "동",
        };
        return `${this.year}년 ${this.month}월 (${seasonLabels[this.season]})`;
    }
}
//# sourceMappingURL=game_calendar.js.map