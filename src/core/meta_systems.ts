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

import type { OfficerID, FactionID } from './types.js';

// ============================================================
// 1. 메타 게임 시스템 — 업적 및 멀티 엔딩
// ============================================================

export interface Achievement {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly unlockedAt?: number;   // 해금 시각 (ms) — 미해금이면 undefined
}

export interface EndingRecord {
    readonly endingId: string;
    readonly unlockedAt: number;
    readonly playthroughTag: string; // 세이브 식별 태그
}

export class MetaManager {
    private achievements: Map<string, Achievement> = new Map();
    private completedEndings: Map<string, EndingRecord> = new Map();
    private static instance: MetaManager | null = null;

    /** 싱글톤 — 클리어 데이터는 세션 전역에서 유지 */
    static getInstance(): MetaManager {
        if (!MetaManager.instance) MetaManager.instance = new MetaManager();
        return MetaManager.instance;
    }

    // --------------------------------------------------------
    // [213] 업적 시스템
    // --------------------------------------------------------

    /** 업적 정의 등록 (모더 확장 대응 — 중복 등록 무시) */
    registerAchievement(id: string, name: string, description: string): void {
        if (this.achievements.has(id)) return;
        this.achievements.set(id, { id, name, description });
    }

    /** 업적 해금 — 이미 해금된 경우 false */
    unlockAchievement(achievementId: string, at?: number): boolean {
        const record = this.achievements.get(achievementId);
        if (!record || record.unlockedAt !== undefined) return false;
        this.achievements.set(achievementId, { ...record, unlockedAt: at ?? Date.now() });
        return true;
    }

    isAchievementUnlocked(achievementId: string): boolean {
        return this.achievements.get(achievementId)?.unlockedAt !== undefined;
    }

    getUnlockedAchievements(): readonly Achievement[] {
        return [...this.achievements.values()].filter((a) => a.unlockedAt !== undefined);
    }

    // --------------------------------------------------------
    // [214] 멀티 엔딩 시스템
    // --------------------------------------------------------

    /** 엔딩 도달 기록 — 중복 기록은 최초 1회만 */
    triggerEnding(endingId: string, playthroughTag = 'default', at?: number): boolean {
        if (this.completedEndings.has(endingId)) return false;
        this.completedEndings.set(endingId, {
            endingId,
            unlockedAt: at ?? Date.now(),
            playthroughTag,
        });
        return true;
    }

    hasEnding(endingId: string): boolean {
        return this.completedEndings.has(endingId);
    }

    getCompletedEndings(): readonly EndingRecord[] {
        return [...this.completedEndings.values()];
    }

    /** 테스트 및 새 플레이 초기화용 */
    reset(): void {
        this.achievements.clear();
        this.completedEndings.clear();
    }
}

// ============================================================
// 2. 가문 및 상속 시스템 — 가보/혈연
// ============================================================

export interface Heirloom {
    readonly heirloomId: string;
    readonly name: string;
    readonly ownerId: OfficerID;        // 현재 소유자
    readonly lineage: OfficerID[];      // 소유 이력 (최신순)
}

export interface BloodRelation {
    readonly parentId: OfficerID;
    readonly childId: OfficerID;
    readonly isIllegitimate: boolean;   // 사생아 여부 [432]
}

export class LegacyManager {
    private heirlooms: Map<string, Heirloom> = new Map();
    private bloodRelations: BloodRelation[] = [];

    // --------------------------------------------------------
    // [431] 가보 상속
    // --------------------------------------------------------

    /** 가보 등록 — 소유자와 함께 신규 생성 */
    registerHeirloom(heirloomId: string, name: string, ownerId: OfficerID): Heirloom {
        const existing = this.heirlooms.get(heirloomId);
        if (existing) return existing;
        const heirloom: Heirloom = { heirloomId, name, ownerId, lineage: [ownerId] };
        this.heirlooms.set(heirloomId, heirloom);
        return heirloom;
    }

    /**
     * 가보 상속 — 소유권 이전 및 이력 기록
     * Python 원본: 이전 소유자의 가보가 없으면 무시
     */
    inheritHeirloom(heirloomId: string, newOwnerId: OfficerID): Heirloom | null {
        const heirloom = this.heirlooms.get(heirloomId);
        if (!heirloom) return null;
        const updated: Heirloom = {
            ...heirloom,
            ownerId: newOwnerId,
            lineage: [newOwnerId, ...heirloom.lineage],
        };
        this.heirlooms.set(heirloomId, updated);
        return updated;
    }

    /** 소유자 사망 시 보유 가보 전부를 상속자에게 이전 */
    transferAllHeirlooms(oldOwnerId: OfficerID, newOwnerId: OfficerID): Heirloom[] {
        const transferred: Heirloom[] = [];
        for (const [id, h] of this.heirlooms) {
            if (h.ownerId === oldOwnerId) {
                const updated = this.inheritHeirloom(id, newOwnerId);
                if (updated) transferred.push(updated);
            }
        }
        return transferred;
    }

    getHeirloom(heirloomId: string): Heirloom | null {
        return this.heirlooms.get(heirloomId) ?? null;
    }

    getHeirloomsOwnedBy(officerId: OfficerID): Heirloom[] {
        return [...this.heirlooms.values()].filter((h) => h.ownerId === officerId);
    }

    // --------------------------------------------------------
    // [432] 사생아/자녀 관계
    // --------------------------------------------------------

    addBloodRelation(parentId: OfficerID, childId: OfficerID, isIllegitimate = false): void {
        const dup = this.bloodRelations.some(
            (r) => r.parentId === parentId && r.childId === childId,
        );
        if (!dup) this.bloodRelations.push({ parentId, childId, isIllegitimate });
    }

    getChildrenOf(parentId: OfficerID): OfficerID[] {
        return this.bloodRelations
            .filter((r) => r.parentId === parentId)
            .map((r) => r.childId);
    }

    /** 상속 후보 — 적자(정자) 우선, 없으면 사생아 반환 */
    getSuccessionCandidate(parentId: OfficerID): OfficerID | null {
        const children = this.bloodRelations.filter((r) => r.parentId === parentId);
        return children.find((r) => !r.isIllegitimate)?.childId
            ?? children[0]?.childId
            ?? null;
    }
}

// ============================================================
// 3. 메타 데이터 관리 — 세력명/무기 모디파이어
// ============================================================

export interface WeaponModifier {
    readonly weaponId: string;
    readonly modifier: string;
    readonly attackDelta: number;
}

export class MetaDataManager {
    private factionNameOverrides: Map<FactionID, string> = new Map();
    private weaponModifiers: Map<string, WeaponModifier> = new Map();

    /** 세력명 커스텀 변경 (모더/유저 커스텀 대응) */
    setFactionName(factionId: FactionID, name: string): void {
        this.factionNameOverrides.set(factionId, name);
    }

    getFactionName(factionId: FactionID, defaultName: string): string {
        return this.factionNameOverrides.get(factionId) ?? defaultName;
    }

    /** 무기 모디파이어 적용 — 덧셈 공격력 보정 */
    applyWeaponModifier(weaponId: string, modifier: string, attackDelta = 0): WeaponModifier {
        const existing = this.weaponModifiers.get(weaponId);
        const merged: WeaponModifier = {
            weaponId,
            modifier: existing ? `${existing.modifier}+${modifier}` : modifier,
            attackDelta: (existing?.attackDelta ?? 0) + attackDelta,
        };
        this.weaponModifiers.set(weaponId, merged);
        return merged;
    }

    getWeaponModifier(weaponId: string): WeaponModifier | null {
        return this.weaponModifiers.get(weaponId) ?? null;
    }
}
