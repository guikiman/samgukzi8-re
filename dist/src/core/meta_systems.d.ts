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
export interface Achievement {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly unlockedAt?: number;
}
export interface EndingRecord {
    readonly endingId: string;
    readonly unlockedAt: number;
    readonly playthroughTag: string;
}
export declare class MetaManager {
    private achievements;
    private completedEndings;
    private static instance;
    /** 싱글톤 — 클리어 데이터는 세션 전역에서 유지 */
    static getInstance(): MetaManager;
    /** 업적 정의 등록 (모더 확장 대응 — 중복 등록 무시) */
    registerAchievement(id: string, name: string, description: string): void;
    /** 업적 해금 — 이미 해금된 경우 false */
    unlockAchievement(achievementId: string, at?: number): boolean;
    isAchievementUnlocked(achievementId: string): boolean;
    getUnlockedAchievements(): readonly Achievement[];
    /** 엔딩 도달 기록 — 중복 기록은 최초 1회만 */
    triggerEnding(endingId: string, playthroughTag?: string, at?: number): boolean;
    hasEnding(endingId: string): boolean;
    getCompletedEndings(): readonly EndingRecord[];
    /** 테스트 및 새 플레이 초기화용 */
    reset(): void;
}
export interface Heirloom {
    readonly heirloomId: string;
    readonly name: string;
    readonly ownerId: OfficerID;
    readonly lineage: OfficerID[];
}
export interface BloodRelation {
    readonly parentId: OfficerID;
    readonly childId: OfficerID;
    readonly isIllegitimate: boolean;
}
export declare class LegacyManager {
    private heirlooms;
    private bloodRelations;
    /** 가보 등록 — 소유자와 함께 신규 생성 */
    registerHeirloom(heirloomId: string, name: string, ownerId: OfficerID): Heirloom;
    /**
     * 가보 상속 — 소유권 이전 및 이력 기록
     * Python 원본: 이전 소유자의 가보가 없으면 무시
     */
    inheritHeirloom(heirloomId: string, newOwnerId: OfficerID): Heirloom | null;
    /** 소유자 사망 시 보유 가보 전부를 상속자에게 이전 */
    transferAllHeirlooms(oldOwnerId: OfficerID, newOwnerId: OfficerID): Heirloom[];
    getHeirloom(heirloomId: string): Heirloom | null;
    getHeirloomsOwnedBy(officerId: OfficerID): Heirloom[];
    addBloodRelation(parentId: OfficerID, childId: OfficerID, isIllegitimate?: boolean): void;
    getChildrenOf(parentId: OfficerID): OfficerID[];
    /** 상속 후보 — 적자(정자) 우선, 없으면 사생아 반환 */
    getSuccessionCandidate(parentId: OfficerID): OfficerID | null;
}
export interface WeaponModifier {
    readonly weaponId: string;
    readonly modifier: string;
    readonly attackDelta: number;
}
export declare class MetaDataManager {
    private factionNameOverrides;
    private weaponModifiers;
    /** 세력명 커스텀 변경 (모더/유저 커스텀 대응) */
    setFactionName(factionId: FactionID, name: string): void;
    getFactionName(factionId: FactionID, defaultName: string): string;
    /** 무기 모디파이어 적용 — 덧셈 공격력 보정 */
    applyWeaponModifier(weaponId: string, modifier: string, attackDelta?: number): WeaponModifier;
    getWeaponModifier(weaponId: string): WeaponModifier | null;
}
//# sourceMappingURL=meta_systems.d.ts.map