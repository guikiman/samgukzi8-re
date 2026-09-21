/**
 * 평판 효과 시스템 [11] [24] [341-360]
 *
 * 세력 군주의 명성(fame)/악명(infamy)이 실제 판정에 영향을 준다:
 *  1) 등용 성공률: 군주 명성이 높으면 상대 무장이 "그 세력에 들어가고 싶다" —
 *     fame 보정 (최대 +10%p), 악명이 높으면 무서워 기피 (최대 −10%p)
 *  2) 외교 수락률: 명성 높은 세력의 동맹 제안은 받아들여지기 쉽고,
 *     악명 높은 세력의 제안은 경계됨 (동맹/휴전 제안 성공률 ±15%p)
 *
 * 순수 함수 계층 — 기존 수식에 보정치를 더하는 방식이라 세이브 호환 무관.
 */
/** 명성 → 등용 보정 계수 (fame 500 기준 ±) */
const FAME_RECRUIT_FACTOR = 0.0002;
/** 악명 → 등용 기피 계수 */
const INFAMY_RECRUIT_FACTOR = 0.001;
/** 등용 보정 클램프 (±0.10) */
const RECRUIT_MODIFIER_CLAMP = 0.10;
/** 외교 수락률 보정 클램프 (±0.15) */
const DIPLOMACY_MODIFIER_CLAMP = 0.15;
/**
 * 세력 평판 → 등용 성공률 보정값 (순수 함수)
 * 세력 군주의 fame은 플러스, infamy는 마이너스로 작용.
 */
export function getReputationRecruitModifier(store, factionId) {
    if (!factionId)
        return 0;
    const faction = store.getFaction(factionId);
    if (!faction)
        return 0;
    const leader = store.getOfficer(faction.leaderId);
    if (!leader)
        return 0;
    const modifier = (leader.fame - 100) * FAME_RECRUIT_FACTOR - leader.infamy * INFAMY_RECRUIT_FACTOR;
    return Math.max(-RECRUIT_MODIFIER_CLAMP, Math.min(RECRUIT_MODIFIER_CLAMP, modifier));
}
/**
 * 세력 평판 → 외교 제안 수락률 보정값 (순수 함수)
 * 제안하는 세력(faction)의 평판 기준. 명성 +, 악명 −.
 */
export function getReputationDiplomacyModifier(store, factionId) {
    if (!factionId)
        return 0;
    const faction = store.getFaction(factionId);
    if (!faction)
        return 0;
    const leader = store.getOfficer(faction.leaderId);
    if (!leader)
        return 0;
    // 명성 100을 기준 0으로: (fame − 100) / 1000, infamy는 2배 페널티
    const modifier = (leader.fame - 100) / 1000 - (leader.infamy * 2) / 1000;
    return Math.max(-DIPLOMACY_MODIFIER_CLAMP, Math.min(DIPLOMACY_MODIFIER_CLAMP, modifier));
}
/**
 * 평판 반영 등용 성공률 — 기존 chance에 보정을 더해 클램프한다.
 * UI 미리보기(getRecruitChance)와 실제 recruit() 양쪽에서 사용.
 */
export function applyReputationToRecruitChance(store, factionId, baseChance) {
    const modifier = getReputationRecruitModifier(store, factionId);
    return Math.max(0.05, Math.min(0.95, baseChance + modifier));
}
/** 평판 보정 설명 문구 (UI 표시용) */
export function describeReputationModifier(modifier) {
    if (modifier >= 0.05)
        return `✨ 명성 보정 +${Math.round(modifier * 100)}%p`;
    if (modifier <= -0.05)
        return `⚠️ 악명 페널티 ${Math.round(modifier * 100)}%p`;
    if (modifier > 0)
        return `명성 보정 +${Math.round(modifier * 100)}%p`;
    if (modifier < 0)
        return `악명 페널티 ${Math.round(modifier * 100)}%p`;
    return '';
}
//# sourceMappingURL=reputation_effect_system.js.map