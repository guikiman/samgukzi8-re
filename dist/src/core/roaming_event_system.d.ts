/**
 * 로밍 이벤트 시스템 [25][441-460] — 재야 명사 방문
 *
 * 매월 플레이어/AI 세력 도시에 확률적으로 방문객이 찾아온다:
 *  - SAGE(현자):   정치 상담 → 도시 기술 +8 / 세력 명성 소폭 상승
 *  - HERMIT(은자): 선양 → 군주 fame +15
 *  - MERCHANT(상인): 물물교역 → 세력 자금 +300
 *  - TRAVELER(행상인): 소문 전달 → 도시 치안 +5
 *  - BANDIT(산적): 습격 → 도시 자금 −200 / 치안 −5 (치안 낮은 도시에서만)
 *
 * 기존 EncounterMatcher(encounter_matcher.ts)의 판정표를 재사용해
 * 지형/계절/치안 기반 확률을 산출하고, 결과를 스토어에 적용한다.
 * 이벤트는 GAME_ROAMING_EVENT 타입으로 발화해 UI 로그와 연결된다.
 */
import type { GameStore } from './game_store.js';
import { type EncounterType } from './encounter_matcher.js';
/** 방문 이벤트 결과 */
export interface RoamingEventResult {
    /** 방문자 유형 */
    type: EncounterType;
    /** 발생 도시 */
    cityId: string;
    /** 도시명 */
    cityName: string;
    /** 세력명 (무주공산이면 null) */
    factionName: string | null;
    /** 게임 로그용 메시지 */
    message: string;
    /** 플레이어 세력 도시 → 자동 적용 대신 대화 선택지 제공 [25][461-480] */
    needsPlayerChoice: boolean;
}
/** 월간 처리 리포트 */
export interface RoamingEventReport {
    events: RoamingEventResult[];
}
/** 상인 교역 수익 */
export declare const MERCHANT_PROFIT = 300;
/** 현자 기술 상담 효과 */
export declare const SAGE_TECH_BOOST = 8;
/** 은자 선양 명성 효과 */
export declare const HERMIT_FAME_BOOST = 15;
/** 행상인 소문 치안 효과 */
export declare const TRAVELER_ORDER_BOOST = 5;
/** 산적 약탈 금액 */
export declare const BANDIT_PLUNDER = 200;
/**
 * 월간 로밍 이벤트 판정 + 적용. 엔진 월간 주기에서 호출.
 */
export declare function processMonthlyRoamingEvents(store: GameStore): RoamingEventReport;
//# sourceMappingURL=roaming_event_system.d.ts.map