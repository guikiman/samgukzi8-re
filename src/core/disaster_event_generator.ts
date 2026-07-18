/**
 * [28] 재해 발생 기획기 — DisasterEventGenerator
 * 
 * 목적: 계절별 재해 발생.
 */
export class DisasterEventGenerator {
    public checkDisaster(): string | null {
        if (Math.random() < 0.1) return "역병 발생";
        return null;
    }
}
