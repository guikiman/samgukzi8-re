/**
 * [32] 상업 교역 및 시장 시세 엔진 — MarketEngine
 * 
 * 목적: 금-식량 교환 및 시세 변동.
 */
export class MarketEngine {
    public getExchangeRate(season: string): number {
        return season === 'SPRING' ? 1.5 : 1.2;
    }
}
