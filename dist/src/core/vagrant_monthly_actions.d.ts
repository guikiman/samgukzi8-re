/**
 * 방랑군 재기 플레이 흐름 [83][421-440] — Vagrant Monthly Actions
 * 파일: src/core/vagrant_monthly_actions.ts
 *
 * 설계 스펙:
 * - [83] 방랑군 재기 — 영지를 잃은 세력이 재야 무장 등용 + 임계 도달 시 도시 습격으로 재기
 * - [24][421-440] 등용 성공률은 군주 카리스마/명성 기반 (기존 등용 시스템과 일관)
 * - [213] 재기 성공 시 FACTION_REVIVED 이벤트 발화 — playerFactionId 유효성 유지
 *
 * 월간 처리(executeTurn → processPortedSystemsMonthly 이후):
 * 1) 등용: 방랑군은 도시가 없어도 재야 무장을 등용 시도 (도시당 1명, 군주 charisma 기반)
 * 2) 습격: 방랑 세력 병력(잔존 충성 무장 기반 가치) ≥ 도시 danger 임계 도달 시
 *    최약 도시 습격 → 점령 판정 (점수 = 통솔 합 + 난수 vs 도시 방어)
 * 3) 점령 성공 시 clearVagrantOnCityGain으로 isVagrant 해제 → 재기 완료
 */
import type { GameStore } from './game_store.js';
import type { OfficerID } from './types.js';
/** 습격 실패 결의 훼손량 — 잔존 무장 충성도 감소 */
export declare const RAID_FAIL_LOYALTY_PENALTY = 8;
/** 습격 실패 후 자율 습격 금지 개월 수 */
export declare const RAID_FAIL_FATIGUE_MONTHS = 3;
export interface VagrantRaidResult {
    factionId: string;
    factionName: string;
    kind: 'RECRUIT' | 'RAID';
    success: boolean;
    message: string;
    /** 습격 성공 시 점령한 도시 */
    capturedCityId?: string;
    /** 등용 성공 시 영입된 무장 */
    recruitedOfficerId?: OfficerID;
}
/** 방랑 세력의 재기 역량 — 잔존 충성 무장 가치(병력 환산) */
export declare function computeVagrantStrength(store: GameStore, factionId: string): number;
/**
 * 방랑군 월간 자율 행동 — executeTurn 월간 훅에서 호출
 * @returns 이번 달 등용/습격 결과 목록 (이벤트 발화/UI 로그용)
 */
export declare function processVagrantMonthlyActions(store: GameStore): VagrantRaidResult[];
/** 습격 커맨드 소비 전략 포인트 */
export declare const RAID_COMMAND_COST = 30;
export interface PlayerRaidOutcome {
    success: boolean;
    message: string;
    capturedCityId?: string;
}
/**
 * 플레이어 방랑군 습격 판정 — UI 커맨드에서 호출 [83]
 * (자율 습격과 동일한 판정식, 전략 포인트 소비는 호출부에서)
 * @returns 습격 성공 여부 및 안내 메시지
 */
export declare function resolvePlayerRaid(store: GameStore, factionId: string, targetCityId: string): PlayerRaidOutcome;
//# sourceMappingURL=vagrant_monthly_actions.d.ts.map