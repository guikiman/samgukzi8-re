/**
 * [28] 재해 발생 기획기 — DisasterEventGenerator
 *
 * 목적: 계절별 재해 발생.
 */
export class DisasterEventGenerator {
    checkDisaster() {
        if (Math.random() < 0.1)
            return "역병 발생";
        return null;
    }
}
//# sourceMappingURL=disaster_event_generator.js.map