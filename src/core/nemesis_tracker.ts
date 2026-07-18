/**
 * [79] 원수 복수 관계망 추적기 — NemesisTracker
 * 
 * 목적: 원수 관계 등록 및 추적.
 */
export class NemesisTracker {
    private nemesisMap: Map<string, string[]> = new Map();

    public addNemesis(a: string, b: string): void {
        console.log(`[Social] ${a}와 ${b}는 원수 관계.`);
    }
}
