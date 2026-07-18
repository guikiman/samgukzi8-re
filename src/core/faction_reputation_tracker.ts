/**
 * [85] 세력 내 평판 트래커 — FactionReputationTracker
 * 
 * 목적: 세력 내 무장 평판 관리.
 */
export class FactionReputationTracker {
    private reputation: Map<string, number> = new Map();

    public updateReputation(officerId: string, delta: number): void {
        const current = this.reputation.get(officerId) ?? 0;
        this.reputation.set(officerId, current + delta);
        console.log(`[Reputation] ${officerId} 평판 ${delta} 변동.`);
    }
}
