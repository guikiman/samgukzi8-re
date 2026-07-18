/**
 * 삼국지 8 리메이크 — 심층 AI 무장 심리 및 의사결정 엔진
 * 파일: src/core/officer_ai_controller.ts
 *
 * FSM(유한상태기계) + Behavior Tree(행동 트리) 하이브리드
 * 배신 판정, 사직/가출, 원수 추적 로직 포함
 *
 * 핵심 수학 공식:
 * - 배신 확률: P(betray) = (Ambition×1.5 - Loyalty×2.0 - Affection_Ruler×0.5 + BadRulerReputation) / 100
 * - 사직 트리거: 도덕성 가중 충성도 급락
 * - 원수 추적: 관계 그래프 기반 행동 트리
 */
import { Officer, OfficerID, IGameStore, RelationshipEdge, RelationType, AIDecision } from './types.js';
export declare enum PsycheState {
    LOYAL = "LOYAL",
    DISGRUNTLED = "DISGRUNTLED",
    CONTEMPLATING_BETRAYAL = "CONTEMPLATING_BETRAYAL",
    SEEKING_RESIGNATION = "SEEKING_RESIGNATION",
    VENGEFUL = "VENGEFUL",
    REBELLIOUS = "REBELLIOUS"
}
export interface OfficerPsychologyState {
    officerId: OfficerID;
    state: PsycheState;
    loyalty: number;
    stability: number;
    stress: number;
    affectionRuler: number;
    affectionAllies: number;
    fearRuler: number;
    greedSatisfaction: number;
    betrayProbability: number;
    resignProbability: number;
    vengeanceTargetId: OfficerID | null;
    lastBetrayCheckTurn: number;
    lastResignCheckTurn: number;
    moodLog: {
        turn: number;
        event: string;
        delta: number;
    }[];
}
export declare function createInitialPsychology(officer: Officer): OfficerPsychologyState;
export interface RelationshipNode {
    officerId: OfficerID;
    edges: Map<OfficerID, RelationshipEdge>;
    affectionCache: Map<OfficerID, number>;
}
export declare class RelationshipGraph {
    private nodes;
    private store;
    constructor(store: IGameStore);
    rebuildGraph(): void;
    addNode(officerId: OfficerID): void;
    addEdge(edge: RelationshipEdge): void;
    getAffection(sourceId: OfficerID, targetId: OfficerID): number;
    getEdges(officerId: OfficerID): RelationshipEdge[];
    getRelationType(sourceId: OfficerID, targetId: OfficerID): RelationType | null;
    getSwornBrothers(officerId: OfficerID): OfficerID[];
    getNemeses(officerId: OfficerID): OfficerID[];
    getFamily(officerId: OfficerID): OfficerID[];
    getSpouse(officerId: OfficerID): OfficerID | null;
}
export type BehaviorStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';
export interface BehaviorContext {
    officer: Officer;
    psyche: OfficerPsychologyState;
    store: IGameStore;
    graph: RelationshipGraph;
    turn: number;
}
export declare abstract class BTNode {
    abstract execute(ctx: BehaviorContext): BehaviorStatus;
}
export declare class BTSequence extends BTNode {
    private children;
    constructor(children: BTNode[]);
    execute(ctx: BehaviorContext): BehaviorStatus;
}
export declare class BTSelector extends BTNode {
    private children;
    constructor(children: BTNode[]);
    execute(ctx: BehaviorContext): BehaviorStatus;
}
export declare class BTCondition extends BTNode {
    private check;
    constructor(check: (ctx: BehaviorContext) => boolean);
    execute(ctx: BehaviorContext): BehaviorStatus;
}
export declare class BTAction extends BTNode {
    private action;
    constructor(action: (ctx: BehaviorContext) => BehaviorStatus);
    execute(ctx: BehaviorContext): BehaviorStatus;
}
export declare class OfficerAIController {
    private store;
    private graph;
    private psyches;
    private behaviorTrees;
    private fsmTransitions;
    constructor(store: IGameStore);
    private buildFSM;
    private transitionState;
    private initPsychologies;
    getPsychology(officerId: OfficerID): OfficerPsychologyState | null;
    refreshGraph(): void;
    evaluateMonthlyPsychology(officerId: OfficerID, turn: number): OfficerPsychologyState | null;
    calculateBetrayProbability(officer: Officer, psyche: OfficerPsychologyState): number;
    /**
     * 공적(merit) 대비 관직 품계가 낮을 때의 불만도 계산
     * rank가 낮을수록(9품→1품) 높은 품계이므로, merit 대비 rank가 높으면 불만
     */
    private calculateRankFrustration;
    /**
     * 타 세력에서 뇌물과 함께 내응 제안이 왔는지 확인
     * 실제 구현: 외교 시스템에서 bribeOffer 플래그 확인
     */
    private checkBribeOffers;
    /**
     * 태수(도시 지배자)로서 독립 제안이 왔는지 확인
     * 도시의 ownerId가 본인이고 충성도가 낮을 때 독립 제안 가능
     */
    private checkIndependenceOffers;
    calculateResignProbability(officer: Officer, psyche: OfficerPsychologyState): number;
    /**
     * 군주의 악행 탐지 (백성 약탈, 무고한 장수 참수 등)
     * infamy와 fame 비율로 악행 정도 추론
     */
    private detectRulerAtrocities;
    /**
     * 사직 실행 — 재야화 또는 의형제 세력으로 탈주
     */
    executeResignation(officer: Officer, turn: number): 'FREE' | 'DEFECT_TO_SWORN';
    /**
     * 원수 타겟 감지 — NEMESIS 관계의 상대가 같은 세력/전장에 있는지 확인
     */
    detectVengeanceTarget(officer: Officer): OfficerID | null;
    private isInSameBattle;
    /**
     * 원수 추적 행동 트리 구축
     */
    private buildVengeanceTree;
    /**
     * 일기토 강제 청구 — 주군 명령 거역
     */
    private actionChallengeDuel;
    /**
     * 밤중 자객 침투 — 암살 시도
     */
    private actionAssassinate;
    private isNightTime;
    private evaluateStress;
    private evaluateAffection;
    private evaluateGreedSatisfaction;
    private applyFSMTransitions;
    /**
     * 배신 실행 — 반란 또는 타 세력 내응
     */
    private executeBetrayal;
    private executeBehaviorTree;
    private buildBehaviorTreeForOfficer;
    private actionContemplateBetrayal;
    private actionSeekResignation;
    private actionRebel;
    private actionLoyal;
    evaluateAllOfficers(turn: number): Map<OfficerID, OfficerPsychologyState>;
    /**
     * 심리 상태 기반 AI 결정 생성 (턴 스케줄러와 연동)
     */
    generateDecisionFromPsychology(officer: Officer, psyche: OfficerPsychologyState): AIDecision;
}
//# sourceMappingURL=officer_ai_controller.d.ts.map