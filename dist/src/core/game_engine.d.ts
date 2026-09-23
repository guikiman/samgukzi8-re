/**
 * 삼국지 8 리메이크 — 통합 게임 엔진 (FSM 오케스트레이터)
 * 파일: src/core/game_engine.ts
 *
 * 모든 시스템을 통합하는 중앙 오케스트레이터
 * 유한 상태 머신 (FSM) 기반 페이즈 전환
 * 커맨드 큐 + 턴 스케줄러 + AI 워커 통합
 */
import { GamePhase, PhaseTransition, GlobalState, NormalizedState, Officer, Faction, City, Army, OfficerID, CityID, FactionID, ICommand, CommandResult, SerializedCommand, SchedulerProgress, GameEvent, EventListener, AIWorkerPayload, AIWorkerResult } from './types.js';
import { GameStore } from './game_store.js';
import { DiplomacyEngine } from './diplomacy_engine.js';
import { StrategicCommandManager } from './strategic_command_system.js';
import { LifeSimulator } from './life_simulator.js';
import { MetaManager, LegacyManager, MetaDataManager } from './meta_systems.js';
import { IntelligenceManager, NarrativeManager, ClimateManager } from './intelligence_narrative_climate.js';
export declare class GameEngine {
    private store;
    private commandQueue;
    private scheduler;
    private aiProcessor;
    private lifecycleManager;
    private fsm;
    private currentPhase;
    private phaseHistory;
    private eventListeners;
    private eventQueue;
    private worker;
    private workerPromises;
    private bootstrap;
    private factionAI;
    private fateSystem;
    private loyaltySystem;
    private diplomacy;
    private diplomacyAI;
    /** 연대기 관리자 [Y-메타][441-460] — 서사적 이벤트 기록, 세이브에 포함 */
    readonly chronicle: import('./chronicle_system.js').ChronicleManager;
    /** 포팅 시스템: 군단/평정 [76-85] */
    readonly strategicCommand: StrategicCommandManager;
    /** 포팅 시스템: 인생 시뮬레이션 [421-438] — 전상/제련/사사/은퇴 */
    readonly lifeSimulator: LifeSimulator;
    /** 포팅 시스템: 메타 게임 [213-214] — 업적/멀티 엔딩 (세션 전역 싱글톤) */
    readonly metaManager: MetaManager;
    /** 포팅 시스템: 가문/가보 상속 [431-432] */
    readonly legacyManager: LegacyManager;
    /** 포팅 시스템: 세력명/무기 모디파이어 (커스텀 데이터) */
    readonly metaDataManager: MetaDataManager;
    /** 포팅 시스템: 첩보 네트워크 [341-360] */
    readonly intelligenceManager: IntelligenceManager;
    /** 포팅 시스템: 나비 효과 내러티브 [441-460] */
    readonly narrativeManager: NarrativeManager;
    /** 포팅 시스템: 지역 기후 [321-340] */
    readonly climateManager: ClimateManager;
    private isProcessingTurn;
    /**
     * 이번 달 포팅 시스템 동향 수집 버퍼 [76-85][321-340][341-360][421-438]
     * processPortedSystemsMonthly가 채우고, 월간 보고서(MonthlyReportSystem)가 peek한다.
     * peekMonthlyPortedLog(hasRead=true)로 읽으면 비워진다.
     */
    private portedMonthlyLog;
    constructor(store?: GameStore);
    private initBootstrap;
    private buildFSM;
    transition(event: string): boolean;
    getCurrentPhase(): GamePhase;
    getPhaseHistory(): PhaseTransition[];
    private onEnterWorldMap;
    private onEnterCouncil;
    private onEnterPersonalAction;
    private onEnterBattle;
    private onExitBattle;
    private onEnterEvent;
    enqueueCommand(command: ICommand): void;
    executeNextCommand(): CommandResult | null;
    executeAllCommands(): CommandResult[];
    undoLastCommand(): boolean;
    redoLastCommand(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    getPendingCommandCount(): number;
    executeTurn(onProgress?: (progress: SchedulerProgress) => void): Promise<void>;
    private resetTurnFlags;
    private convertDecisionToCommand;
    private processMonthlyMaintenance;
    /**
     * 포팅 시스템 월간 훅 [76-85][321-340][341-360][421-438]
     * 1) 전략 명령 진행 — 출진/수송 큐 처리 및 완료 이벤트 발화
     * 2) 첩보망 유지비 — 레벨 1 소모, 미유지 시 붕괴 이벤트
     * 3) 지역 기후 전이 — 계절 기반 날씨 전이 및 수확 보정 반영
     * 4) 고령 무장 은퇴 — 60세 도달 무장 은퇴 기록
     */
    private processPortedSystemsMonthly;
    /**
     * 이번 달 포팅 시스템 동향 peek [76-85][321-340][341-360][421-438]
     * 월간 보고서(MonthlyReportSystem)가 호출. consume=true면 읽 후 버퍼를 비운다.
     */
    peekMonthlyPortedLog(consume?: boolean): {
        campaigns: Array<{
            targetCity: string;
            leaderName: string;
            soldiers: number;
        }>;
        transports: Array<{
            fromCity: string;
            toCity: string;
            gold: number;
            food: number;
            soldiers: number;
        }>;
        collapsedNetworks: Array<{
            factionId: string;
            cityId: string;
        }>;
        retired: Array<{
            officerName: string;
            age: number;
        }>;
        vagrant: Array<{
            factionName: string;
            kind: 'CONVERT' | 'RECRUIT' | 'RAID';
            success: boolean;
            message: string;
        }>;
    };
    private processWeatherEffect;
    emitEvent(event: GameEvent): void;
    subscribe(eventType: string, listener: EventListener): () => void;
    private processEventQueue;
    getPendingEvents(): GameEvent[];
    private initWorker;
    requestAIWorker(payload: AIWorkerPayload): Promise<AIWorkerResult>;
    private localAIProcessing;
    terminateWorker(): void;
    /** 외교 엔진 접근자 (UI/AI 용) [70-73] */
    get diplomacyEngine(): DiplomacyEngine;
    /**
     * 플레이어 도시 습격 커맨드 [83] — 전략 포인트 30 소비 후 습격 판정.
     * 플레이어 세력이 방랑군일 때만 가능. 성공 시 FACTION_REVIVED 이벤트.
     */
    playerRaidCity(targetCityId: CityID): {
        success: boolean;
        message: string;
    };
    save(): {
        state: NormalizedState;
        globalState: GlobalState;
        commands: SerializedCommand[];
        diplomacy: Array<{
            a: string;
            b: string;
            relation: string;
        }>;
        chronicle?: import('./chronicle_system.js').ChronicleEntry[];
        /** 포팅 시스템 스냅샷 [76-85][321-340][341-360][421-438][431-432][441-460] */
        ported?: {
            strategic: ReturnType<StrategicCommandManager['serialize']>;
            climates: Array<{
                regionId: string;
                weather: string;
                temperature: number;
                harvestModifier: number;
            }>;
            narratives: Array<{
                id: number;
                description: string;
                recordedAt: number;
            }>;
            /** 첩보망 [346] — 세이브에 포함 */
            intelNetworks?: Array<{
                factionId: FactionID;
                cityId: CityID;
                level: number;
                builtAtTurn: number;
            }>;
            /** 은퇴 무장 [434] — 세이브에 포함 */
            retiredOfficers?: Array<{
                officerId: OfficerID;
                retireYear: number;
                finalRank: string;
            }>;
        };
    };
    saveCompressed(): string;
    loadCompressed(compressed: string): boolean;
    load(data: {
        state: NormalizedState;
        globalState: GlobalState;
        commands: SerializedCommand[];
        diplomacy?: Array<{
            a: string;
            b: string;
            relation: string;
        }>;
        chronicle?: import('./chronicle_system.js').ChronicleEntry[];
        ported?: {
            strategic: ReturnType<StrategicCommandManager['serialize']>;
            climates: Array<{
                regionId: string;
                weather: string;
                temperature: number;
                harvestModifier: number;
            }>;
            narratives: Array<{
                id: number;
                description: string;
                recordedAt: number;
            }>;
            intelNetworks?: Array<{
                factionId: FactionID;
                cityId: CityID;
                level: number;
                builtAtTurn: number;
            }>;
            retiredOfficers?: Array<{
                officerId: OfficerID;
                retireYear: number;
                finalRank: string;
            }>;
        };
    }): void;
    initWorld(officers: Officer[], factions: Faction[], cities: City[], armies: Army[]): void;
    private delay;
}
export declare function getGameEngine(): GameEngine;
//# sourceMappingURL=game_engine.d.ts.map