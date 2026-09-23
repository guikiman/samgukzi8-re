/**
 * 삼국지 8 리메이크 — AI 워커 시뮬레이터 (Worker 사이드)
 * 파일: src/ai/ai_worker_simulator.ts
 *
 * Web Worker 내부에서 실행되는 1,000명 무장 AI 의사결정 엔진.
 * 세력 단위로 연산을 분할하여 결과를 스트리밍 전송하며,
 * 야망/충성도/군주 성향/도시 자원 가중치로 행동을 결정한다.
 *
 * [201] Web Worker 비동기 AI 연산
 * [121-130] 고급 AI 및 NPC 행동 패턴
 * Python 원본: src/systems/ai_strategy_manager.py → TypeScript 포팅 + 확장
 */
import type { AIDecision, OfficerID } from '../core/types.js';
/** 메인 스레드 → Worker 전송용 경량 무장 스냅샷 (직렬화 가능) */
export interface OfficerSnapshot {
    id: OfficerID;
    name: string;
    factionId: string | null;
    cityId: string | null;
    /** 야망 0~100 */
    ambition: number;
    /** 충성도 0~100 */
    loyalty: number;
    /** 도덕성 0~100 */
    morality: number;
    /** 악명 0~100 */
    infamy: number;
    /** 능력치 5종 */
    stats: {
        leadership: number;
        might: number;
        intelligence: number;
        politics: number;
        charisma: number;
    };
    /** 플레이어 세력 소속 여부 — true면 AI 제외 */
    isPlayer: boolean;
}
/** 메인 스레드 → Worker 전송용 경량 도시 스냅샷 */
export interface CitySnapshot {
    id: string;
    name: string;
    ownerId: string | null;
    /** 방어도 0~100 — 주둔 병력 비율 프록시로도 사용 (garrison ≈ maxTroops × defense/100) */
    defense: number;
    /** 인구 */
    population: number;
    /** 도시 자금 (City.funds) */
    funds: number;
    /** 병량 추정치 — 월 식량 수입 × 10 (City 도메인에 병량 필드가 없어 프록시 사용) */
    foodStores: number;
    /** 개발도 0~100 */
    development: number;
    /** 징병 가능 최대 병력 — 인구/100 추정 */
    maxTroops: number;
}
/** 메인 스레드 → Worker 전송용 경량 세력 스냅샷 */
export interface FactionSnapshot {
    id: string;
    name: string;
    leaderId: string;
    /** 군주 성향: 패도(정복) / 왕도(균형) / 의리(수성) — 정책 가중치에서 유도 */
    temperament: 'HEGEMON' | 'KINGLY' | 'RIGHTEOUS';
    gold: number;
    food: number;
    cityCount: number;
    /** 전쟁 중인 세력 ID 목록 */
    atWarWith: string[];
    /** 동맹 세력 ID 목록 */
    alliedWith: string[];
}
/** AI 턴 시작 페이로드 */
export interface AITurnPayload {
    year: number;
    month: number;
    turn: number;
    factions: Record<string, FactionSnapshot>;
    officers: OfficerSnapshot[];
    cities: Record<string, CitySnapshot>;
}
/** 세력 단위 스트리밍 결과 */
export interface FactionDecisionBatch {
    factionId: string;
    decisions: AIDecision[];
    /** 배치 연산 소요 ms (성능 진단용) */
    elapsedMs: number;
}
export type WorkerOutboundMessage = {
    type: 'STREAM_FACTION_DECISION';
    data: FactionDecisionBatch;
} | {
    type: 'AI_TURN_COMPLETE';
    data: {
        totalDecisions: number;
        elapsedMs: number;
    };
} | {
    type: 'ERROR';
    data: string;
};
/**
 * 단일 무장의 행동을 결정한다.
 *
 * 의사결정 계층:
 *   1. 위기 대응   — 충성도 붕괴(하야 검토)
 *   2. 정복 타겟팅 — 공격 성향 × 야망 × 전쟁 중 최약 도시
 *   3. 병량 위기   — 개간 시급
 *   4. 군주 성향   — 세력 temperament 가중치로 징병 배율 조정
 *   5. 도시 상황   — 최약 내정치 기반 내정
 *   6. 외교 성향   — 정치 높은 무장의 친선 강화
 *   7. 기본 행동   — 휴식
 */
export declare function calculateOfficerDecision(officer: OfficerSnapshot, cities: Record<string, CitySnapshot>, factions: Record<string, FactionSnapshot>): AIDecision | null;
/**
 * 전체 AI 턴을 세력 단위로 분할 처리한다.
 * 각 세력 연산이 끝날 때마다 onFactionBatch 콜백으로 즉시 스트리밍 전송하고,
 * UI 부하 분산을 위해 다음 배치 전에 yield (마이크로 태스크 양보) 한다.
 *
 * @returns 총 결정 수와 전체 소요 시간
 */
export declare function runAITurn(payload: AITurnPayload, onFactionBatch: (batch: FactionDecisionBatch) => void, yieldIntervalMs?: number): Promise<{
    totalDecisions: number;
    elapsedMs: number;
}>;
//# sourceMappingURL=ai_worker_simulator.d.ts.map