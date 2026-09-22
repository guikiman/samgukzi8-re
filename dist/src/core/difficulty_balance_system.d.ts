/**
 * 난이도 밸런싱 시스템 [X-난이도][E-도시내정]
 *
 * 시나리오 난이도(1~5)에 따라 로밍/방문 이벤트의 빈도와 효과를 조절한다:
 *  - 낮은 난이도: 이벤트 자주 발생 + 효과 큼 (초보자 지원)
 *  - 높은 난이도: 이벤트 드물게 + 산적 피해는 커짐 (생존 압박)
 *
 * 스토어 GlobalState.difficulty에서 읽어 배율만 제공하므로
 * 기존 판정 로직을 침범하지 않고 시스템 간 공유된다.
 */
import type { GameStore } from './game_store.js';
/** 난이도 배율표 — 인덱스 = difficulty - 1 (1~5) */
export interface DifficultyMultiplier {
    /** 로밍 이벤트 빈도 배율 (matcher 확률에 곱연산 대상은 아님 — 샘플 도시 수에 적용) */
    roamingFrequency: number;
    /** 재야 무장 방문 빈도 배율 */
    visitFrequency: number;
    /** 플레이어 수혜 효과 배율 (선양/교역/기술 등) */
    benefitScale: number;
    /** 산적 약탈 피해 배율 */
    banditScale: number;
}
/** 난이도 1(쉬움)~5(지옥) 배율표 */
export declare const DIFFICULTY_MULTIPLIERS: DifficultyMultiplier[];
/** 기본 난이도 (미지정 시 — 표준) */
export declare const DEFAULT_DIFFICULTY = 3;
/** 스토어에서 유효 난이도를 읽는다 (1~5 클램프, 구버전 세이브 undefined 허용) */
export declare function getDifficulty(store: GameStore): number;
/** 스토어에서 난이도 배율을 조회한다 */
export declare function getDifficultyMultiplier(store: GameStore): DifficultyMultiplier;
/** 난이도 반영 방문 확률 — 기본 확률에 빈도 배율을 곱하고 1로 클램프 */
export declare function scaleVisitChance(baseChance: number, store: GameStore): number;
/** 난이도 반영 로밍 샘플 도시 수 — 기본 수에 빈도 배율을 곱하고 [1, 전체]로 클램프 */
export declare function scaleRoamingCityCount(baseCount: number, totalCities: number, store: GameStore): number;
//# sourceMappingURL=difficulty_balance_system.d.ts.map