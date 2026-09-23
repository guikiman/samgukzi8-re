/**
 * 삼국지 8 리메이크 — 고성능 메모리 내 그래프 데이터베이스
 * 파일: src/core/relationship_graph_db.ts
 *
 * 설계 스펙 준수사항:
 * [O(1) 해시맵 구조] → 정규화된 인덱싱 & O(1) 직접 접근 최적화
 * [75% 인맥 필터링]   → 제한적 이웃 조회 (2도 깊이, 80명 최대) + 희소 행렬 압축
 * [Ripple Effect]     → 가중치 기반 전파 연산 (+/-3 단계) 및 상태 지속 주기 관리
 *
 * Performance 목표:
 * - 1,000 무장 노드 그래프 탐색 시간 < 5ms (해시맵 인덱싱 활용)
 * - 메모리 사용량 최적화: 희소 행렬 & 정규화된 스토어 접근 패턴
 *
 * Python 원본: src/systems/graph_db.py → TypeScript 포팅 + 확장
 */
/** 무장 능력치 (4 항목) — 직접 접근 최적화 */
export interface AbilityStats {
    STR: number;
    DEF: number;
    INT: number;
    POL: number;
}
/** 무장 객체를 표현하는 단일 노드 */
export interface WarlordNode {
    id: string;
    name: string;
    /** 능력치 (직접 접근 최적화) */
    stats: AbilityStats;
    /** 관계 그래프 (해시맵 기반 빠른 탐색) → 인덱스 접근 O(1) */
    relationships: {
        /** 적대 대상 집합 */
        enemies: Set<string>;
        /** 우호 대상 → 우호도 */
        friends: Map<string, number>;
        /** 부하 → 우호도 */
        subordinates: Map<string, number>;
    };
    /** 평판 점수 (-100 ~ +100) */
    reputation: number;
    /** 상태 플래그 인덱스 */
    statusIdx: number;
}
export type EdgeType = 'enemy' | 'friend' | 'sworn_brother' | 'neutral';
/** 무장 간 관계를 표현하는 단일 관계 에지 */
export interface WarlordRelationshipEdge {
    fromId: string;
    toId: string;
    type: EdgeType;
    /** 우호도 가중치 (0 ~ 100 범위 제한) */
    weight: number;
    lastUpdated: number;
}
export interface RippleLogEntry {
    degree: number;
    neighborId: string;
    sourceId: string;
    oldWeight: number;
    newWeight: number;
}
export interface RippleResult {
    /** 파동이 닿은 총 인원 */
    touchedCount: number;
    /** 전파 로그 (진단/연출용) */
    log: RippleLogEntry[];
}
export declare class TriStateGraphDatabase {
    private nodeStore;
    private edgeStore;
    /** 인접 목록 (O(1) 해시셋 탐색용) — 순방향: from → to */
    private adjMap;
    /** 역방향 인접 목록 — inMap[to] = { from... } (노드 제거 시 양방향 정리용) */
    private inMap;
    private maxNeighborsPer;
    /** 노드 추가 — O(1). 이미 존재하면 기존 노드 반환 */
    addWarlord(warlordId: string, name?: string): WarlordNode;
    getWarlord(warlordId: string): WarlordNode | null;
    getWarlordCount(): number;
    /** 노드 제거 — 순/역방향 에지와 인접 목록을 모두 정리 */
    removeWarlord(warlordId: string): boolean;
    /**
     * 두 무장 간의 관계 에지를 정규화하여 설정 (O(1)).
     *
     * 75% 인맥 필터링: 특정 무장의 인맥 개수가 임계치를 넘고 우호도가 낮으면
     * 희소 행렬 압축 규칙에 의해 그래프에서 제외 (메모리 방어).
     */
    setRelationship(fromId: string, toId: string, weight: number, edgeType?: EdgeType): void;
    /** 두 무장 간의 우호도 수치를 고속 조회 (O(1)) */
    getRelationshipWeight(fromId: string, toId: string): number;
    /** 에지 자체 조회 (O(1)) */
    getEdge(fromId: string, toId: string): WarlordRelationshipEdge | null;
    /** 특정 무장의 이웃 목록 조회 */
    getNeighbors(warlordId: string): string[];
    /** 특정 무장의 적대 목록 */
    getEnemies(warlordId: string): string[];
    /**
     * source 무장이 target 무장에게 영향(참언, 증정 등)을 주었을 때,
     * target의 최측근(의형제/절친) 네트워크망을 최대 depth(2도)까지 탐색하여
     * 감정 주기를 연쇄적으로 동적 전파(단계별 절반 감쇠)시킨다.
     */
    applyRippleEffect(targetId: string, sourceId: string, changeAmount: number, depth?: number): RippleResult;
    /** 테스트/진단용 — 현재 에지 총 개수 */
    getEdgeCount(): number;
    /** 인덱스 전체 초기화 — 월드 재구축/세이브 복원 시 파생 상태 리셋용 */
    clear(): void;
    /** 직렬화 (세이브/Worker 전송용) */
    serialize(): {
        nodes: Array<{
            id: string;
            name: string;
            stats: AbilityStats;
            reputation: number;
        }>;
        edges: Array<{
            fromId: string;
            toId: string;
            type: EdgeType;
            weight: number;
        }>;
    };
    /** 역직렬화 (세이브 복원용) */
    static deserialize(data: ReturnType<TriStateGraphDatabase['serialize']>): TriStateGraphDatabase;
}
//# sourceMappingURL=relationship_graph_db.d.ts.map