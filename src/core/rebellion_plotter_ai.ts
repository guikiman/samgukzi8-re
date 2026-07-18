/**
 * [61] 반란 모의 및 거사 타이밍 산출기 — RebellionPlotterAI
 * 
 * 목적: 충성도가 낮은 무장의 반란 결행.
 */
export class RebellionPlotterAI {
    public plotRebellion(officer: any): boolean {
        return officer.loyalty < 20 && officer.ambition > 80;
    }
}
