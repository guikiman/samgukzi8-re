/**
 * [75] 지능형 하야 판단 알고리즘 — ResignationAI
 *
 * 목적: 군주 무능/악행 시 하야 결정.
 */
export class ResignationAI {
    shouldResign(officer, ruler) {
        return officer.loyalty < 10 || (ruler.isTyrant && officer.fame > 50);
    }
}
//# sourceMappingURL=resignation_ai.js.map