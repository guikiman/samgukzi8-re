/**
 * 무장 등용/배신 시스템 [24] [C-인간관계]
 *
 * 등용(Recruitment):
 * - 재야(FREE) 무장 또는 타세력 무장을 초빙
 * - 성공률 = 정치력 + 카리스마 vs 대상 충성도/야망
 * - 성공 시 플레이어(또는 실행 세력) 소속으로 편입, 도시로 배치
 *
 * 배신(Defection):
 * - 월간 정산 시 충성도가 임계 이하인 무장은 확률적으로 이탈
 * - 야망이 높을수록 이탈 확률 증가
 * - 이탈 시 재야화 (또는 인접 적 세력으로 투쟁 — 간단화: 재야)
 */

import type { GameStore } from './game_store.js';
import { OfficerStatus } from './types.js';
import { applyRecruitFailure, getRecruitAffinityModifier } from './recruit_relation_system.js';
import { applyCaptiveRecruitPenalty } from './captive_recruit_penalty_system.js';
import type { DiplomacyEngine } from './diplomacy_engine.js';
import { isCaptive } from './captive_escape_system.js';
import { applyReputationToRecruitChance } from './reputation_effect_system.js';

export interface RecruitmentResult {
    success: boolean;
    message: string;
}

export interface DefectionReport {
    officerId: string;
    officerName: string;
    fromFactionId: string | null;
    reason: 'LOYALTY_LOW' | 'AMBITION_HIGH';
}

/** 등용 난이도 상수 */
const BASE_RECRUIT_CHANCE = 0.35;
const LOYALTY_DEFENSE = 0.5;
const AMBITION_BONUS = 0.3;

/** 배신 임계값 */
const DEFECT_LOYALTY_THRESHOLD = 30;
const DEFECT_BASE_CHANCE = 0.25;
const AMBITION_DEFECT_MULTIPLIER = 1.5;

export class OfficerLoyaltySystem {
    /** 세이브 직렬화 대상 외교 엔진 — 포로 등용 페널티에서 원수화에 사용 */
    diplomacy: DiplomacyEngine | null = null;

    /** 마지막 등용 시 발생한 페널티 메시지 (UI 로그 표시용 — 등용 1건당 갱신) */
    penaltyMessages: string[] = [];

    constructor(private store: GameStore) {}

    /**
     * 등용 성공률 미리보기 [24] — UI 표시용 (실제 등용 로직과 동일 수식)
     * @param officerId 등용 대상 무장 ID
     * @param recruiterId 초빙 실행 무장 ID (생략 시 기본 능력 60 가정)
     */
    getRecruitChance(officerId: string, recruiterId?: string, targetFactionIdForChance?: string): number {
        const target = this.store.getOfficer(officerId);
        if (!target) return 0;
        const recruiter = recruiterId ? this.store.getOfficer(recruiterId) : null;
        const recruitPower = (recruiter?.stats.politics ?? 60) * 0.6 + (recruiter?.stats.charisma ?? 60) * 0.4;

        let chance = BASE_RECRUIT_CHANCE;
        chance += (recruitPower - 60) / 200;                 // 초빙 능력 ±0.2
        chance -= (target.loyalty / 100) * LOYALTY_DEFENSE;  // 충성 방어 최대 -0.5
        chance += (target.ambition / 100) * AMBITION_BONUS;  // 야망 최대 +0.3
        if (recruiterId) {
            chance += getRecruitAffinityModifier(this.store, recruiterId, officerId); // 우호도 ±0.15
        }
        // 평판 보정 [11]: 군주 명성/악명이 세력 이미지로 작용 (±0.10)
        chance = applyReputationToRecruitChance(this.store, targetFactionIdForChance ?? null, chance);
        return Math.max(0.05, Math.min(0.95, chance));
    }

    /**
     * 무장 등용 시도
     * @param officerId 등용할 무장 ID
     * @param targetFactionId 편입시킬 세력 ID
     * @param cityId 배치할 도시 ID
     * @param recruiterId 초빙 실행 무장 ID (능력치에 반영)
     */
    recruit(officerId: string, targetFactionId: string, cityId: string, recruiterId?: string): RecruitmentResult {
        const target = this.store.getOfficer(officerId);
        const faction = this.store.getFaction(targetFactionId);
        const city = this.store.getCity(cityId);
        if (!target || !faction || !city) {
            return { success: false, message: '무장/세력/도시를 찾을 수 없습니다' };
        }
        if (city.ownerId !== targetFactionId) {
            return { success: false, message: '자기 세력 도시에만 편입시킬 수 있습니다' };
        }
        if (target.factionId === targetFactionId) {
            return { success: false, message: '이미 소속된 무장입니다' };
        }
        if (target.status === OfficerStatus.FREE && !target.factionId) {
            // 재야 무장 — 등용 대상으로 유효
        }

        const recruiter = recruiterId ? this.store.getOfficer(recruiterId) : null;
        const recruitPower = (recruiter?.stats.politics ?? 60) * 0.6 + (recruiter?.stats.charisma ?? 60) * 0.4;

        // 성공률: 기본 35% + 초빙 능력 보정 - 충성도 방어 + 야망 보정
        let chance = BASE_RECRUIT_CHANCE;
        chance += (recruitPower - 60) / 200;                 // 초빙 능력 ±0.2
        chance -= (target.loyalty / 100) * LOYALTY_DEFENSE;  // 충성 방어 최대 -0.5
        chance += (target.ambition / 100) * AMBITION_BONUS;  // 야망 최대 +0.3
        chance = Math.max(0.05, Math.min(0.95, chance));

        if (recruiterId) {
            chance += getRecruitAffinityModifier(this.store, recruiterId, officerId); // 우호도 ±0.15
        }
        // 평판 보정 [11]: 세력 군주의 명성/악명 (±0.10)
        chance = applyReputationToRecruitChance(this.store, targetFactionId, chance);
        chance = Math.max(0.05, Math.min(0.95, chance));

        if (Math.random() > chance) {
            // 등용 실패 → 관계망 악화 [C-인간관계]: 초빙자가 있으면 우호도 -10
            if (recruiterId) {
                applyRecruitFailure(this.store, recruiterId, officerId);
            }
            return { success: false, message: `${target.name} 등용 실패 (확률 ${(chance * 100).toFixed(0)}%)` };
        }

        // 편입 처리 — isCaptive 판정(포로 마커 + FREE/충성도 0 조건)을 상태 변경 전에 수행
        const oldFactionId = target.factionId;
        const wasCaptive = isCaptive(this.store, officerId);
        this.store.updateOfficer(officerId, {
            factionId: targetFactionId,
            status: OfficerStatus.OFFICER,
            cityId,
            loyalty: 60 + Math.floor(Math.random() * 20),
            rank: Math.max(1, target.rank),
        });

        // 도시 무장 목록 추가
        if (!city.officerIds.includes(officerId)) {
            this.store.updateCity(cityId, { officerIds: [...city.officerIds, officerId] });
        }

        // 구세력 무장 목록에서 제거
        if (oldFactionId) {
            const oldFaction = this.store.getFaction(oldFactionId);
            if (oldFaction) {
                this.store.updateFaction(oldFactionId, {
                    officers: oldFaction.officers.filter(id => id !== officerId),
                });
            }
        }
        // 신세력 무장 목록 추가
        this.store.updateFaction(targetFactionId, {
            officers: [...faction.officers, officerId],
        });

        // 포로 등용 페널티 [24][341-360]: 포로 출신이면 원소속 세력 원수화 (동맹 파기/선전포고 + 동료 NEMESIS)
        if (this.diplomacy && wasCaptive) {
            const penalty = applyCaptiveRecruitPenalty(this.store, this.diplomacy, targetFactionId, officerId);
            for (const msg of penalty.messages) {
                this.penaltyMessages.push(msg);
            }
        }

        return { success: true, message: `${target.name} 등용 성공! ${city.name}에 배치` };
    }

    /** 월간 배신 판정 — 충성도 낮은 무장 이탈 */
    processMonthlyDefections(): DefectionReport[] {
        const defected: DefectionReport[] = [];
        const gs = this.store.getGlobalState();

        for (const officer of this.store.getAllOfficers()) {
            if (!officer.factionId || officer.factionId === gs.playerFactionId) continue;
            if (officer.status === OfficerStatus.FREE) continue;

            let defectChance = 0;
            let reason: DefectionReport['reason'] | null = null;

            if (officer.loyalty < DEFECT_LOYALTY_THRESHOLD) {
                defectChance += DEFECT_BASE_CHANCE * (1 + (DEFECT_LOYALTY_THRESHOLD - officer.loyalty) / 30);
                reason = 'LOYALTY_LOW';
            }
            if (officer.ambition >= 70 && officer.loyalty < 55) {
                defectChance += 0.15;
                reason = reason ?? 'AMBITION_HIGH';
            }

            if (reason && defectChance > 0 && Math.random() < defectChance * AMBITION_DEFECT_MULTIPLIER * 0.5) {
                const oldFaction = this.store.getFaction(officer.factionId);
                this.store.updateOfficer(officer.id, {
                    factionId: null,
                    status: OfficerStatus.FREE,
                    loyalty: 0,
                });
                if (oldFaction) {
                    this.store.updateFaction(oldFaction.id, {
                        officers: oldFaction.officers.filter(id => id !== officer.id),
                    });
                }
                // 도시 무장 목록에서 제거
                if (officer.cityId) {
                    const city = this.store.getCity(officer.cityId);
                    if (city) {
                        this.store.updateCity(city.id, {
                            officerIds: city.officerIds.filter(id => id !== officer.id),
                        });
                    }
                }
                defected.push({
                    officerId: officer.id,
                    officerName: officer.name,
                    fromFactionId: oldFaction?.id ?? null,
                    reason,
                });
            }
        }
        return defected;
    }
}
