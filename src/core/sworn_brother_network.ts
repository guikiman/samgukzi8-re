/**
 * [78] 의형제 도원 네트워크 — SwornBrotherNetwork
 * 
 * 목적: 의형제 관계망 관리.
 */
export class SwornBrotherNetwork {
    private swornMap: Map<string, string[]> = new Map();

    public addSworn(a: string, b: string): void {
        console.log(`[Social] ${a}와 ${b} 의형제 결성.`);
    }
}
