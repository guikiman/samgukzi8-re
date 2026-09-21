/**
 * 의형제 결의 시스템 [C-인간관계] [25]
 *
 * 우호도가 깊은 두 무장이 의형제를 맺는다:
 *  - 조건: 양방향 우호도 70 이상 + 같은 세력(또는 한쪽 재야) + 둘 다 생존
 *  - 월간 자동 판정: 조건을 충족하는 최상위 쌍 중 확률로 결의
 *  - 효과: SWORN_BROTHER 엣지 생성 (우호도 90으로 초기화)
 *    + 세력 평판 상승 (의리의 상징) + 결의 축하 로그
 *
 * 의형제가 되면 sworn_brother_rescue_system의 구출 대상이 되고,
 * 복수 이벤트와 함께 인과 사이클을 형성한다.
 */
import type { GameStore } from './game_store.js';
/** 의형제 결의 최소 우호도 */
export declare const PACT_MIN_AFFINITY = 70;
/** 월간 결의 확률 (조건 충족 쌍 1개당) */
export declare const PACT_MONTHLY_CHANCE = 0.35;
/** 결의 시 세력 평판 상승량 */
export declare const PACT_REPUTATION_BONUS = 3;
/** 결의 시 설정되는 우호도 */
export declare const PACT_AFFINITY_SET = 90;
export interface SwornBrotherPactRecord {
    officerAId: string;
    officerAName: string;
    officerBId: string;
    officerBName: string;
    factionId: string | null;
    message: string;
}
export interface SwornBrotherPactReport {
    pacts: SwornBrotherPactRecord[];
    messages: string[];
}
/**
 * 의형제 결의 가능 쌍 탐색 — 순수 조회 (사이드 이펙트 없음)
 * 조건: 양방향 우호도 70+ / 둘 다 생존 / 같은 세력 또는 한쪽 재야 / 기존 의형제 아님
 */
export declare function findPactCandidates(store: GameStore, minAffinity?: number): Array<{
    aId: string;
    bId: string;
    affinity: number;
}>;
/**
 * 의형제 결의 실행 — 엣지 생성 + 세력 평판 상승
 */
export declare function executeSwornBrotherPact(store: GameStore, aId: string, bId: string): SwornBrotherPactRecord | null;
/**
 * 월간 의형제 결의 판정 — 엔진 월간 주기에서 호출.
 * 조건 충족 쌍 중 최상위 1개만 확률적으로 결의 (월 1회 제한).
 */
export declare function processMonthlySwornBrotherPacts(store: GameStore): SwornBrotherPactReport;
//# sourceMappingURL=sworn_brother_pact_system.d.ts.map