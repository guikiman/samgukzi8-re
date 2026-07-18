/**
 * [75] 지능형 하야 판단 알고리즘 — ResignationAI
 * 
 * 목적: 군주 무능/악행 시 하야 결정.
 */
export class ResignationAI {
    public shouldResign(officer: any, ruler: any): boolean {
        return officer.loyalty < 10 || (ruler.isTyrant && officer.fame > 50);
    }
}
