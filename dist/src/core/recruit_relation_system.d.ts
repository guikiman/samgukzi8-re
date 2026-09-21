/**
 * 등용-관계망 연동 시스템 [C-인간관계] [24]
 *
 * 등용 실패가 무장 간 관계(우호도)에 영향을 주고, 그 관계가 다시
 * 등용 성공률에 반영되는 순환을 담당한다:
 *  - 실패 시 초빙자↔대상 우호도 −10 (history에 기록)
 *  - 성공률 미리보기/실제 등용 시 우호도 보정 적용 (±0.15 클램프)
 *
 * 관계 엣지가 없으면 최초 실패 시 FRIEND 타입 엣지를 생성한다(0에서 시작).
 * 스토어의 양방향 인덱스(byOfficer.relationships)를 모두 갱신한다.
 */
import type { GameStore } from './game_store.js';
/** 등용 실패 1회당 우호도 감소량 */
export declare const RECRUIT_FAILURE_AFFINITY_DROP = -10;
/** 관계 이력 이벤트명 */
export declare const RECRUIT_FAILED_EVENT = "RECRUIT_FAILED";
/**
 * 등용 실패 후처리 — 초빙자와 대상 무장 간 우호도를 감소시킨다.
 * 엣지가 없으면 새로 생성한다 (양방향 인덱스 동시 갱신).
 */
export declare function applyRecruitFailure(store: GameStore, recruiterId: string, targetId: string): void;
/**
 * 우호도 기반 등용 성공률 보정값 조회 [C-인간관계]
 * affinity +30 이상 → +15%p, −30 이하 → −15%p (클램프)
 */
export declare function getRecruitAffinityModifier(store: GameStore, recruiterId: string, targetId: string): number;
//# sourceMappingURL=recruit_relation_system.d.ts.map