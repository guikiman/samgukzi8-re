/**
 * 복수 이벤트 시스템 [32][33][C-인간관계]
 *
 * 원수(NEMESIS) 관계인 두 무장이 전투에서 조우하면:
 *  - 무력이 높은 쪽이 복수를 노려 단기접전(일기토)을 제안
 *  - 지력이 높은 쪽이 복수를 노려 설전(논쟁)으로 도발
 *  - 승리: 우호도 대폭 상승 + 상대 사기 감소 / 복수 성사
 *  - 패배/무승부: 원한이 더 깊어짐 (우호도 추가 하락)
 *
 * 미니게임 엔진(duel/debate)과 완전히 분리된 트리거 판정 계층으로,
 * 본 게임 흐름(전투 시작/월간 처리)에서 호출만으로 동작한다.
 * 카드 선택은 executeInteraction과 동일한 자동 플레이 방식.
 */
import type { GameStore } from './game_store.js';
import { DuelMinigame } from './duel_minigame.js';
import { DebateMinigame } from './debate_minigame.js';
/** 복수 이벤트 종류 */
export type VengeanceKind = 'DUEL' | 'DEBATE';
/** 복수 이벤트 발동 확률 (조우 1회당) */
export declare const VENGEANCE_CHANCE = 0.45;
/** 복수 성사 시 우호도 상승량 (원한 해소) */
export declare const VENGEANCE_SUCCESS_AFFINITY = 40;
/** 복수 실패 시 우호도 추가 하락량 (원한 심화) */
export declare const VENGEANCE_FAIL_AFFINITY = -15;
/** 복수 성공 시 상대 유닛 사기 감소량 */
export declare const VENGEANCE_MORALE_HIT = 15;
/** 복수 이벤트 판정 결과 */
export interface VengeanceOutcome {
    /** 이벤트 발동 여부 */
    readonly triggered: boolean;
    readonly kind: VengeanceKind | null;
    /** 복수를 시도한 무장 (발동 시에만) */
    readonly actorId: string | null;
    /** 복수의 대상 무장 */
    readonly targetId: string | null;
    /** 복수 성공 여부 (발동 시에만) */
    readonly success: boolean | null;
    /** 적용된 우호도 변화 */
    readonly affinityDelta: number;
    /** 상대 유닛 사기 감소 (전투 UI 반영용) */
    readonly targetMoraleHit: number;
    /** 게임 로그용 메시지 */
    readonly message: string;
}
/**
 * 두 무장이 원수 관계인지 확인 (양방향 엣지 조회)
 */
export declare function areNemesis(store: GameStore, aId: string, bId: string): boolean;
/**
 * 복수 이벤트 발동 판정 (순수 함수 — 사이드 이펙트 없음)
 * NEMESIS 관계 + 확률을 통과해야 발동.
 * 종류는 무력/지력 우위로 결정: 무력 우위 → 단기접전, 지력 우위 → 설전.
 */
export declare function judgeVengeance(store: GameStore, aId: string, bId: string, roll: number, chance?: number): {
    triggered: boolean;
    kind: VengeanceKind | null;
    actorId: string | null;
    targetId: string | null;
};
/**
 * 복수 이벤트 실행 — 미니게임 자동 플레이 + 우호도/사기 적용.
 * judgeVengeance가 triggered일 때 호출한다. (전투 시작 시/월간 처리 시)
 */
export declare function executeVengeance(store: GameStore, actorId: string, targetId: string, kind: VengeanceKind): VengeanceOutcome;
/**
 * 전투 조우 복수 판정 — 두 무장 ID를 받아 복수 이벤트를 처리한다.
 * 전투 시작 시 아군/적군 유닛쌍마다 호출하고, 첫 발동만 채택한다.
 */
export declare function tryVengeanceOnEncounter(store: GameStore, aId: string, bId: string, roll?: number): VengeanceOutcome;
/** 복수 판정 결과 — UI에서 플레이어 관여 여부를 결정할 때 사용 */
export interface VengeanceJudgement {
    triggered: boolean;
    kind: VengeanceKind | null;
    actorId: string | null;
    targetId: string | null;
}
/** 판정만 수행 (실행 없음) — UI가 플레이어 관여 여부를 판단한 뒤 실행 방식을 선택 */
export declare function judgeVengeanceOnly(store: GameStore, aId: string, bId: string, roll?: number): VengeanceJudgement;
/**
 * 복수 이벤트를 새 미니게임 인스턴스로 시작한다 — 인터랙티브 UI용.
 * 반환된 게임 인스턴스를 UI가 카드 선택을 받아 진행하고,
 * 종료 후 finishVengeanceWithGame으로 후처리(우호도/명성)를 적용한다.
 */
export declare function startVengeanceGame(store: GameStore, actorId: string, targetId: string, kind: VengeanceKind): DuelMinigame | DebateMinigame;
/**
 * 인터랙티브/자동 미니게임 종료 후 공통 후처리 — 우호도 동기화 + 명성 변동 [C-인간관계][11]
 * success는 actor 기준 승패. message는 UI에서 이미 표시했을 수 있다.
 */
export declare function finishVengeance(store: GameStore, actorId: string, targetId: string, success: boolean): VengeanceOutcome;
/**
 * 월간 자유 복수 — 도시가 같은(또는 인접한) 원수 무장 간 월 1회 판정.
 * 엔진 월간 주기에서 호출. [C-인간관계]
 */
export declare function processMonthlyVengeance(store: GameStore): VengeanceOutcome[];
//# sourceMappingURL=vengeance_system.d.ts.map