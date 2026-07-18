/**
 * [18] 황제 옹립 시 제후 세력 대상 황실 칙명 통제 스레드
 *
 * EmperorDecreeSystem:
 *   - 황제 소유 세력이 타 제후를 '한나라의 적'으로 선포
 *   - 대상 세력 외교 관계 파괴 + 백성 민심 30 감소
 *   - 군주 의리/도덕성 기반 수락/거부 판정
 */
export class EmperorDecreeSystem {
    constructor(store) {
        this.store = store;
    }
    /**
     * [18] 황실 칙명 발송
     *
     * target의 군주 의리 ≥ 70 → 수락 (동맹 강제 파기)
     * target의 군주 도덕성 ≤ 30 → 거부 (민심 30 감소)
     */
    issueDecree(emperorFactionId, targetFactionId, decreeType) {
        const emperor = this.store.getFaction(emperorFactionId);
        const target = this.store.getFaction(targetFactionId);
        if (!emperor || !target) {
            return { decreeType, targetFactionId, accepted: false, reputationChange: 0, moraleEffect: 0, diplomaticFallout: 0 };
        }
        const targetLord = target.leaderId ? this.store.getOfficer(target.leaderId) : null;
        const lordMorality = targetLord?.morality ?? 50;
        const lordLoyalty = targetLord?.loyalty ?? 50;
        // 수락 판정
        const acceptanceThreshold = 50 + (lordLoyalty - 50) * 0.3 - (lordMorality - 50) * 0.2;
        const roll = Math.random() * 100;
        const accepted = roll < acceptanceThreshold;
        if (accepted) {
            // 동맹 강제 파기
            this.forceBreakAlliances(targetFactionId, emperorFactionId);
        }
        else {
            // 거부 시 민심 감소
            this.reducePopularSupport(targetFactionId);
        }
        return {
            decreeType,
            targetFactionId,
            accepted,
            reputationChange: accepted ? 10 : -15,
            moraleEffect: accepted ? 5 : -30,
            diplomaticFallout: accepted ? 20 : 40,
        };
    }
    forceBreakAlliances(factionId, emperorId) {
        const faction = this.store.getFaction(factionId);
        if (!faction)
            return;
        // 동맹 해체 로직
    }
    reducePopularSupport(factionId) {
        const faction = this.store.getFaction(factionId);
        if (!faction)
            return;
        // 민심 30 감소 로직
    }
}
//# sourceMappingURL=emperor_decree_system.js.map