/**
 * 시나리오 연의전 이벤트 체인 로더 [300][106-114]
 *
 * src/data/scenarios/events/index.json의 체인 정의를 읽어
 * EventChainNode로 변환하고 EventEngine 큐에 적재한다.
 *
 * 설계 스펙:
 * - [300] 이벤트 체인 큐 관리자와 연동 — 시나리오 시작 시 전체 체인 적재
 * - JSON Schema 검증 [301] — 모더 확장 데이터가 게임을 파괴하지 않도록 방어
 * - 시나리오 ID로 필터링하여 해당 시나리오의 체인만 로드
 */
import type { EventChainNode, EventResult } from './event_chain_engine.js';
export interface EventChainJsonCondition {
    type: string;
    targetId?: string;
    targetFaction?: string;
    targetCity?: string;
    minValue?: number;
    maxValue?: number;
    probability?: number;
}
export interface EventChainJsonNode {
    eventId: string;
    eventName: string;
    priority?: number;
    conditions: EventChainJsonCondition[];
    result?: {
        eventType?: string;
        dialogueLines?: string[];
        rewards?: Record<string, unknown>;
        nextEventId?: string | null;
    };
}
export interface EventChainJson {
    eventId: string;
    eventName: string;
    conditions: EventChainJsonCondition[];
    result?: Partial<EventResult>;
    chainNextId?: string | null;
    priority?: number;
}
export interface ScenarioEventChainJson {
    scenarioId: string;
    chainId: string;
    chainName?: string;
    nodes: EventChainJsonNode[];
}
export interface ScenarioEventsFile {
    chains: ScenarioEventChainJson[];
}
export declare class EventChainValidationError extends Error {
    readonly chainId: string;
    constructor(message: string, chainId: string);
}
/** JSON 노드 → EventChainNode (createEventChainNode로 기본값 보장) */
export declare function toEventChainNode(raw: EventChainJsonNode): EventChainNode;
/** 시나리오 ID에 해당하는 체인 노드 맵 반환 — { chainId: EventChainNode[] } */
export declare function parseScenarioEvents(file: unknown, scenarioId: string): Map<string, EventChainNode[]>;
/**
 * 시나리오 이벤트 체인을 EventEngine 큐에 적재 [300].
 * 시나리오 선택 시 1회 호출. 이미 적재된 체인은 건너뛴다.
 * @returns 적재된 체인 ID 목록
 */
export declare function loadScenarioEventChains(eventEngine: import('./event_chain_engine.js').EventEngine, file: unknown, scenarioId: string): string[];
/** 빌트인 시나리오 이벤트 파일 (모더 데이터와 병합 가능) */
export declare const BUILTIN_SCENARIO_EVENTS: ScenarioEventsFile;
//# sourceMappingURL=scenario_event_loader.d.ts.map