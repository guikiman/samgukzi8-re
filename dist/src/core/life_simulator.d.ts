/**
 * [Phase 24] 무장 인생 시뮬레이션 — Life Simulator
 * 파일: src/core/life_simulator.ts
 *
 * 설계 스펙:
 * - [421] 전상(戰傷) 시스템 — 전투 부상 누적 및 능력치 페널티
 * - [422] 무기 제련 — 금 소모로 무기 제작/강화
 * - [423] 학파 수련 — 특정 학파 가입 및 효과
 * - [434] 은퇴 — 고령 무장 은퇴 처리
 * - [438] 사사(師事) — 스승-제자 관계 형성 및 능력 이전
 *
 * Python 원본: src/systems/life_simulator.py
 */
import type { OfficerID } from './types.js';
export type ScarType = 'HEAD' | 'TORSO' | 'ARM' | 'LEG' | 'EYE';
export interface ScarRecord {
    readonly officerId: OfficerID;
    readonly scarType: ScarType;
    readonly yearAcquired: number;
    readonly severity: number;
}
export interface CraftedWeapon {
    readonly officerId: OfficerID;
    readonly weaponName: string;
    readonly attackBonus: number;
    readonly yearForged: number;
}
export interface MentorshipRecord {
    readonly studentId: OfficerID;
    readonly masterId: OfficerID;
    readonly skill: OfficerSkill;
    readonly masteryGain: number;
}
export type OfficerSkill = 'MARTIAL' | 'LEADERSHIP' | 'INTELLECT' | 'POLITICS' | 'CHARISMA';
export interface RetiredOfficer {
    readonly officerId: OfficerID;
    readonly retireYear: number;
    readonly finalRank: string;
}
export declare class LifeSimulator {
    private scars;
    private craftedWeapons;
    private masteries;
    private mentorships;
    private retiredOfficers;
    private static readonly WEAPON_FORGE_COST;
    private static readonly RETIREMENT_AGE;
    private static readonly MAX_MASTERY;
    /** 전상 부여 — 중복 부상은 심각도 누적 */
    applyScar(officerId: OfficerID, scarType: ScarType, year?: number, severity?: 1 | 2 | 3): void;
    getScars(officerId: OfficerID): readonly ScarRecord[];
    hasScar(officerId: OfficerID, scarType: ScarType): boolean;
    /**
     * 전상에 따른 능력치 페널티 계산
     * @returns { STR, DEF, INT, POL } 각 항목 감소량 (음수)
     */
    getScarPenalties(officerId: OfficerID): {
        STR: number;
        DEF: number;
        INT: number;
        POL: number;
    };
    /**
     * 무기 제작/강화 — 금 500 이상 필요
     * @returns 제작 성공 시 CraftedWeapon, 실패 시 null
     */
    craftWeapon(officerId: OfficerID, gold: number, year?: number): CraftedWeapon | null;
    getWeapons(officerId: OfficerID): readonly CraftedWeapon[];
    /**
     * 사사 관계 형성 — 스승의 숙련도에서 제자에게 일부 이전
     * @returns 성공 시 MentorshipRecord, 스승이 해당 기술 미보유 시 null
     */
    masterSkill(studentId: OfficerID, masterId: OfficerID, skill: OfficerSkill): MentorshipRecord | null;
    /**
     * 숙련 직접 부여 — 세이브 로드 복원 및 초기 배경 스토리 반영용
     */
    grantMastery(officerId: OfficerID, skill: OfficerSkill, value: number): void;
    getMastery(officerId: OfficerID, skill: OfficerSkill): number;
    getMentorships(studentId?: OfficerID): readonly MentorshipRecord[];
    /** 은퇴 가능 연령 도달 여부 */
    canRetire(officerId: OfficerID, age: number): boolean;
    /** 은퇴 처리 — 이후 전투/내정 배제 대상 */
    retire(officerId: OfficerID, year: number, finalRank?: string): RetiredOfficer;
    isRetired(officerId: OfficerID): boolean;
    /** 은퇴 무장 전체 조회 — 월간 틱/세이브용 */
    getAllRetiredOfficers(): RetiredOfficer[];
    /** 은퇴 기록 복원 — 세이브 로드 (빈 배열이면 초기화 상태 유지) */
    restoreRetiredOfficers(records: RetiredOfficer[]): void;
}
//# sourceMappingURL=life_simulator.d.ts.map