/**
 * 의형제 구원 시스템 [C-인간관계] [131-145]
 *
 * SWORN_BROTHER(의형제) 관계인 무장이 포로로 수용되면, 같은 세력(또는 재야)의
 * 의형제가 매월 구출을 시도한다:
 *  - 구출 성공: 포로가 의형제의 도시로 탈출 (도주 없이 무사히 합류)
 *  - 구출 실패: 포로는 계속 수용 (탈출 판정은 captive_escape_system이 담당)
 *
 * 성공 확률: 기본 25% + 의형제 무력 보정(최대 +25%) — 힘으로 빼내는 구조.
 * 성공 시 의형제 간 우호도 +30 (형제의 의리 확인).
 */
import type { GameStore } from './game_store.js';
/** 월간 기본 구출 확률 */
export declare const BASE_RESCUE_CHANCE = 0.25;
/** 구출 확률 상한 */
export declare const MAX_RESCUE_CHANCE = 0.7;
/** 구출 성공 시 우호도 상승량 */
export declare const RESCUE_AFFINITY_BONUS = 30;
/** 관계 이력 이벤트명 */
export declare const RESCUE_EVENT = "SWORN_BROTHER_RESCUE";
/**
 * 두 무장이 의형제인지 확인
 */
export declare function areSwornBrothers(store: GameStore, aId: string, bId: string): boolean;
/**
 * 특정 포로를 구하려는 의형제 목록 — 생존 + 포로가 아닌 의형제만
 */
export declare function findRescuers(store: GameStore, captiveId: string): string[];
/**
 * 구출 확률 계산 (순수 함수) — 의형제의 무력이 높을수록 유리
 */
export declare function judgeRescue(might: number, roll: number, chance?: number): boolean;
export interface RescueRecord {
    officerId: string;
    officerName: string;
    rescuerId: string;
    rescuerName: string;
    toCityId: string | null;
    message: string;
}
export interface SwornBrotherRescueReport {
    rescued: RescueRecord[];
    messages: string[];
}
/**
 * 월간 의형제 구출 판정 — 엔진 월간 주기에서 호출.
 * 포로별로 첫 번째 의형제가 구출을 시도한다.
 */
export declare function processMonthlySwornBrotherRescues(store: GameStore): SwornBrotherRescueReport;
//# sourceMappingURL=sworn_brother_rescue_system.d.ts.map