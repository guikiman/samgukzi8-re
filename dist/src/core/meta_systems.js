/**
 * [Phase 18 + Phase 24] 메타 게임 · 가문 상속 · 메타 데이터 관리
 * 파일: src/core/meta_systems.ts
 *
 * 설계 스펙:
 * - [213] 업적 시스템, [214] 멀티 엔딩 — meta_manager.py 포팅
 * - [431] 가보 상속, [432] 사생아/자녀 관계 — legacy_manager.py 포팅
 * - 세력명 변경/무기 모디파이어 — meta_data_manager.py 포팅
 *
 * Python 원본: src/systems/meta_manager.py, legacy_manager.py, meta_data_manager.py
 */
export class MetaManager {
    constructor() {
        this.achievements = new Map();
        this.completedEndings = new Map();
    }
    /** 싱글톤 — 클리어 데이터는 세션 전역에서 유지 */
    static getInstance() {
        if (!MetaManager.instance)
            MetaManager.instance = new MetaManager();
        return MetaManager.instance;
    }
    // --------------------------------------------------------
    // [213] 업적 시스템
    // --------------------------------------------------------
    /** 업적 정의 등록 (모더 확장 대응 — 중복 등록 무시) */
    registerAchievement(id, name, description) {
        if (this.achievements.has(id))
            return;
        this.achievements.set(id, { id, name, description });
    }
    /** 업적 해금 — 이미 해금된 경우 false */
    unlockAchievement(achievementId, at) {
        const record = this.achievements.get(achievementId);
        if (!record || record.unlockedAt !== undefined)
            return false;
        this.achievements.set(achievementId, { ...record, unlockedAt: at ?? Date.now() });
        return true;
    }
    isAchievementUnlocked(achievementId) {
        return this.achievements.get(achievementId)?.unlockedAt !== undefined;
    }
    getUnlockedAchievements() {
        return [...this.achievements.values()].filter((a) => a.unlockedAt !== undefined);
    }
    // --------------------------------------------------------
    // [214] 멀티 엔딩 시스템
    // --------------------------------------------------------
    /** 엔딩 도달 기록 — 중복 기록은 최초 1회만 */
    triggerEnding(endingId, playthroughTag = 'default', at) {
        if (this.completedEndings.has(endingId))
            return false;
        this.completedEndings.set(endingId, {
            endingId,
            unlockedAt: at ?? Date.now(),
            playthroughTag,
        });
        return true;
    }
    hasEnding(endingId) {
        return this.completedEndings.has(endingId);
    }
    getCompletedEndings() {
        return [...this.completedEndings.values()];
    }
    /** 테스트 및 새 플레이 초기화용 */
    reset() {
        this.achievements.clear();
        this.completedEndings.clear();
    }
}
MetaManager.instance = null;
export class LegacyManager {
    constructor() {
        this.heirlooms = new Map();
        this.bloodRelations = [];
    }
    // --------------------------------------------------------
    // [431] 가보 상속
    // --------------------------------------------------------
    /** 가보 등록 — 소유자와 함께 신규 생성 */
    registerHeirloom(heirloomId, name, ownerId) {
        const existing = this.heirlooms.get(heirloomId);
        if (existing)
            return existing;
        const heirloom = { heirloomId, name, ownerId, lineage: [ownerId] };
        this.heirlooms.set(heirloomId, heirloom);
        return heirloom;
    }
    /**
     * 가보 상속 — 소유권 이전 및 이력 기록
     * Python 원본: 이전 소유자의 가보가 없으면 무시
     */
    inheritHeirloom(heirloomId, newOwnerId) {
        const heirloom = this.heirlooms.get(heirloomId);
        if (!heirloom)
            return null;
        const updated = {
            ...heirloom,
            ownerId: newOwnerId,
            lineage: [newOwnerId, ...heirloom.lineage],
        };
        this.heirlooms.set(heirloomId, updated);
        return updated;
    }
    /** 소유자 사망 시 보유 가보 전부를 상속자에게 이전 */
    transferAllHeirlooms(oldOwnerId, newOwnerId) {
        const transferred = [];
        for (const [id, h] of this.heirlooms) {
            if (h.ownerId === oldOwnerId) {
                const updated = this.inheritHeirloom(id, newOwnerId);
                if (updated)
                    transferred.push(updated);
            }
        }
        return transferred;
    }
    getHeirloom(heirloomId) {
        return this.heirlooms.get(heirloomId) ?? null;
    }
    getHeirloomsOwnedBy(officerId) {
        return [...this.heirlooms.values()].filter((h) => h.ownerId === officerId);
    }
    // --------------------------------------------------------
    // [432] 사생아/자녀 관계
    // --------------------------------------------------------
    addBloodRelation(parentId, childId, isIllegitimate = false) {
        const dup = this.bloodRelations.some((r) => r.parentId === parentId && r.childId === childId);
        if (!dup)
            this.bloodRelations.push({ parentId, childId, isIllegitimate });
    }
    getChildrenOf(parentId) {
        return this.bloodRelations
            .filter((r) => r.parentId === parentId)
            .map((r) => r.childId);
    }
    /** 상속 후보 — 적자(정자) 우선, 없으면 사생아 반환 */
    getSuccessionCandidate(parentId) {
        const children = this.bloodRelations.filter((r) => r.parentId === parentId);
        return children.find((r) => !r.isIllegitimate)?.childId
            ?? children[0]?.childId
            ?? null;
    }
}
export class MetaDataManager {
    constructor() {
        this.factionNameOverrides = new Map();
        this.weaponModifiers = new Map();
    }
    /** 세력명 커스텀 변경 (모더/유저 커스텀 대응) */
    setFactionName(factionId, name) {
        this.factionNameOverrides.set(factionId, name);
    }
    getFactionName(factionId, defaultName) {
        return this.factionNameOverrides.get(factionId) ?? defaultName;
    }
    /** 무기 모디파이어 적용 — 덧셈 공격력 보정 */
    applyWeaponModifier(weaponId, modifier, attackDelta = 0) {
        const existing = this.weaponModifiers.get(weaponId);
        const merged = {
            weaponId,
            modifier: existing ? `${existing.modifier}+${modifier}` : modifier,
            attackDelta: (existing?.attackDelta ?? 0) + attackDelta,
        };
        this.weaponModifiers.set(weaponId, merged);
        return merged;
    }
    getWeaponModifier(weaponId) {
        return this.weaponModifiers.get(weaponId) ?? null;
    }
}
//# sourceMappingURL=meta_systems.js.map