/**
 * [85] 세력 내 평판 트래커 — FactionReputationTracker
 *
 * 목적: 세력 내 무장 평판 관리.
 */
export class FactionReputationTracker {
    constructor() {
        this.reputation = new Map();
    }
    updateReputation(officerId, delta) {
        const current = this.reputation.get(officerId) ?? 0;
        this.reputation.set(officerId, current + delta);
        console.log(`[Reputation] ${officerId} 평판 ${delta} 변동.`);
    }
}
//# sourceMappingURL=faction_reputation_tracker.js.map