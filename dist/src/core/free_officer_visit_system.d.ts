/**
 * 재야 무장 방문 시스템 [24][421-440] — 자발적 출사 타진
 *
 * 재야(FREE) 무장이 매월 확률적으로 세력 도시를 방문해 직접 등용을 타진한다:
 *  - 방문 확률: 기본 30% × (무장 야망/100) × 명성 가중
 *  - 대상 세력: 무장이 위치한 도시의 소유 세력 (재야는 자기 도시에 머무른다)
 *  - 수락 판정: 군주 매력 기반 호감 + 군주 명성 보정
 *  - 수락: 해당 세력으로 입사 (충성도 초기값은 군주 명성에 비례)
 *  - 거절: 재야 유지, 다음 달 재타진 가능
 *
 * 플레이어 세력 도시 방문은 UI 선택지(맞이하기/사절하기)로 넘기고,
 * AI 세력 도시 방문은 자동 판정한다. roll 주입으로 결정적 테스트를 지원한다.
 */
import type { GameStore } from './game_store.js';
/** 방문 판정 결과 */
export interface FreeOfficerVisit {
    /** 방문한 재야 무장 */
    officerId: string;
    officerName: string;
    /** 방문 도시 */
    cityId: string;
    cityName: string;
    /** 대상 세력 (무주공산 도시면 null → 판정 스킵) */
    factionId: string | null;
    factionName: string | null;
    /** 군주 (없으면 null) */
    leaderId: string | null;
    leaderName: string | null;
    /** 성공 확률 (UI 미리보기용) */
    chance: number;
    /** 확률 판정 roll */
    roll: number;
    /** 최종 수락 여부 (플레이어 선택 대기 시 false) */
    joined: boolean;
    /** 플레이어 세력 → 선택지 대기, AI 세력 → 자동 판정 완료 */
    needsPlayerChoice: boolean;
    /** 로그 메시지 (AI 자동 판정 시 사용) */
    message: string;
}
/** 기본 방문 확률 */
export declare const BASE_VISIT_CHANCE = 0.3;
/** 명성 가중 — 명성 500 이상이면 확률 1.5배 (상한) */
export declare const FAME_WEIGHT_MAX = 1.5;
/** 수락 기본 확률 — 군주 매력 60 기준 */
export declare const BASE_ACCEPT_CHANCE = 0.45;
/** 수락 확률 상한 */
export declare const MAX_ACCEPT_CHANCE = 0.9;
/** 재야 무장의 월간 출사 타진 판정. 엔진 월간 주기에서 호출.
 *  @param random 확률 판정용 난수 생성기 (테스트에서 결정적 시퀀스 주입) */
export declare function processMonthlyFreeOfficerVisits(store: GameStore, random?: () => number): FreeOfficerVisit[];
/** 수락 적용 — 세력 입사 + 도시 배치 + 충성도 초기화 (명성 비례) */
export declare function applyJoin(store: GameStore, officerId: string, factionId: string, cityId: string, leaderFame: number): void;
/** 플레이어 선택 — 맞이하기 */
export declare function acceptVisit(store: GameStore, visit: FreeOfficerVisit): FreeOfficerVisit;
/** 플레이어 선택 — 사절하기 (재야 유지) */
export declare function declineVisit(visit: FreeOfficerVisit): FreeOfficerVisit;
//# sourceMappingURL=free_officer_visit_system.d.ts.map