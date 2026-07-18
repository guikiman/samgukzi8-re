/**
 * [11] 무장 유전자 조합기 — Officer Genealogy Combiner
 *
 * 육아 시스템에서 부모의 스탯 데이터(능력치, 특기, 성향)를
 * 정규분포 상에서 교차 조합하여 2세대 무장 데이터로 정형화
 */
export class OfficerGenealogyCombiner {
    constructor() {
        this.children = new Map();
    }
    /**
     * 입양
     */
    adoptChild(parentId, childId) {
        const talent = Math.floor(Math.random() * 101);
        const child = {
            childId,
            parentId,
            talentScore: talent,
            stats: { leadership: 30, might: 30, intelligence: 30, politics: 30, charisma: 30 },
            personality: 'CALM',
        };
        this.children.set(childId, child);
        return child;
    }
    /**
     * 부모 능력치 교차 조합 (정규분포 crossover)
     *
     * 자식 능력치 = (parent1 + parent2) / 2 ± 10% mutation
     */
    combineGenes(parent1, parent2, childBaseStats) {
        const statsKeys = ['leadership', 'might', 'intelligence', 'politics', 'charisma'];
        const result = { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 };
        for (const key of statsKeys) {
            const p1 = parent1[key];
            const p2 = parent2[key];
            const base = childBaseStats?.[key] ?? 0;
            // 교차 평균 + base 보정 + 무작위 변이
            const avg = Math.floor((p1 + p2) / 2) + Math.floor(base * 0.1);
            const mutation = Math.floor(avg * 0.1 * (Math.random() * 2 - 1));
            result[key] = Math.max(10, Math.min(100, avg + mutation));
        }
        return result;
    }
    /**
     * 성장 처리 (매년)
     */
    processMaturation(childId) {
        const child = this.children.get(childId);
        if (!child)
            return null;
        // 성장: talent에 비례한 능력치 상승
        const growthFactor = child.talentScore / 100;
        const statsKeys = ['leadership', 'might', 'intelligence', 'politics', 'charisma'];
        for (const key of statsKeys) {
            const gain = Math.floor(Math.random() * 5 * growthFactor);
            child.stats[key] = Math.min(100, child.stats[key] + gain);
        }
        return child;
    }
    getChild(childId) {
        return this.children.get(childId) ?? null;
    }
    getChildrenByParent(parentId) {
        return Array.from(this.children.values()).filter(c => c.parentId === parentId);
    }
    getAllChildren() {
        return Array.from(this.children.values());
    }
    removeChild(childId) {
        return this.children.delete(childId);
    }
    reset() {
        this.children.clear();
    }
}
//# sourceMappingURL=officer_genealogy_combiner.js.map