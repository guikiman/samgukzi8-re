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
import type { GameStore } from './game_store.js';
/**
 * 세력 평판 → 등용 성공률 보정값 (순수 함수)
 * 세력 군주의 fame은 플러스, infamy는 마이너스로 작용.
 */
export declare function getReputationRecruitModifier(store: GameStore, factionId: string | null): number;
/**
 * 세력 평판 → 외교 제안 수락률 보정값 (순수 함수)
 * 제안하는 세력(faction)의 평판 기준. 명성 +, 악명 −.
 */
export declare function getReputationDiplomacyModifier(store: GameStore, factionId: string | null): number;
/**
 * 평판 반영 등용 성공률 — 기존 chance에 보정을 더해 클램프한다.
 * UI 미리보기(getRecruitChance)와 실제 recruit() 양쪽에서 사용.
 */
export declare function applyReputationToRecruitChance(store: GameStore, factionId: string | null, baseChance: number): number;
/** 평판 보정 설명 문구 (UI 표시용) */
export declare function describeReputationModifier(modifier: number): string;
//# sourceMappingURL=reputation_effect_system.d.ts.map