/**
 * 지옥 난이도 시스템 [X-난이도][E-도시내정]
 *
 * difficulty 5(지옥)에서만 작동하는 추가 제약 — 생존 압박을 극대화한다:
 *  1) 수입 감소: 도시 세수의 20%가 유실 (부패/전란 서사 로그)
 *  2) 저충성 탈영: 충성도 30 이하 무장이 매월 확률적으로 이탈
 *  3) 도시 반란: 치안 30 이하 도시가 확률적으로 소유 세력 변경(재야화)
 *
 * 난이도 1~4에서는 이 시스템이 완전히 비활성화되어 기존 균형 유지.
 * 모든 판정은 random 주입으로 결정적 테스트를 지원.
 */
import type { GameStore } from './game_store.js';
/** 지옥 난이도 임계값 */
export declare const HELL_DIFFICULTY = 5;
/** 수입 유실률 (0.2 = 20%) */
export declare const HELL_TAX_LEAK = 0.2;
/** 탈영 대상 충성도 이하 */
export declare const HELL_DESERTION_LOYALTY = 30;
/** 탈영 확률 (충성도 0 기준, 충성도에 반비례) */
export declare const HELL_DESERTION_BASE = 0.4;
/** 반란 대상 치안 이하 */
export declare const HELL_REVOLT_ORDER = 30;
/** 반란 확률 (치안 0 기준, 치안에 반비례) */
export declare const HELL_REVOLT_BASE = 0.35;
export interface HellConstraintReport {
    /** 유실된 총 세수 */
    taxLeaked: number;
    /** 탈영한 무장 */
    deserted: Array<{
        officerId: string;
        officerName: string;
        cityId: string;
    }>;
    /** 반란한 도시 */
    revolted: Array<{
        cityId: string;
        cityName: string;
        fromFactionName: string;
    }>;
}
/** 스토어가 지옥 난이도인지 확인 */
export declare function isHellDifficulty(store: GameStore): boolean;
/**
 * 월간 지옥 제약 판정. 엔진 월간 주기 말미에서 호출.
 * 난이도 5가 아니면 즉시 빈 리포트 반환 (기존 균형 무손상).
 */
export declare function processHellConstraints(store: GameStore, random?: () => number): HellConstraintReport;
//# sourceMappingURL=hell_constraint_system.d.ts.map