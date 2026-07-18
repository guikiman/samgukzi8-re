/**
 * [27] 계절별 징수 스케줄러 — FiscalScheduler
 * 
 * 목적: 계절별 금/군량 징수.
 */
export class FiscalScheduler {
    public collectResources(city: any): { gold: number, food: number } {
        console.log("계절 징수 완료.");
        return { gold: city.commercial * 0.1, food: city.agricultural * 0.2 };
    }
}
