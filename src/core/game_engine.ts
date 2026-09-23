/**
 * 삼국지 8 리메이크 — 통합 게임 엔진 (FSM 오케스트레이터)
 * 파일: src/core/game_engine.ts
 *
 * 모든 시스템을 통합하는 중앙 오케스트레이터
 * 유한 상태 머신 (FSM) 기반 페이즈 전환
 * 커맨드 큐 + 턴 스케줄러 + AI 워커 통합
 */

import {
    GamePhase, PhaseTransition, GlobalState, NormalizedState,
    Officer, Faction, City, Army, OfficerID, CityID, FactionID,
    ICommand, CommandResult, CommandContext, SerializedCommand,
    AIDecision, SchedulerProgress,
    GameEvent, EventListener, WorkerRequest, WorkerResponse,
    AIWorkerPayload, AIWorkerResult,
} from './types.js';
import { GameStore, gameStore } from './game_store.js';
import { CommandQueue, DomesticCommand, TrainingCommand, RecruitmentCommand, MovementCommand, RestCommand, deserializeCommand } from './command_system.js';
import { TurnScheduler, AITurnProcessor, TurnLifecycleManager } from './turn_scheduler.js';
import { BootstrapContext, getBootstrap } from './bootstrap.js';
import { FactionAI } from './faction_ai_monthly.js';
import { FactionFateSystem } from './faction_fate_system.js';
import { OfficerLoyaltySystem } from './officer_loyalty_system.js';
import { DiplomacyEngine } from './diplomacy_engine.js';
import { FactionDiplomacyAI } from './faction_diplomacy_ai.js';
import { ChronicleManager } from './chronicle_system.js';
import { processHellConstraints } from './hell_constraint_system.js';
import { processMonthlyCaptiveEvents } from './captive_escape_system.js';
import { processMonthlyVengeance } from './vengeance_system.js';
import { processMonthlyRoamingEvents } from './roaming_event_system.js';
import { processMonthlyFreeOfficerVisits } from './free_officer_visit_system.js';
import { processMonthlySwornBrotherRescues } from './sworn_brother_rescue_system.js';
import { processMonthlySwornBrotherPacts } from './sworn_brother_pact_system.js';
// Python 시스템 모듈 TS 포팅 통합 [76-85][213-214][321-340][341-360][421-438][431-432][441-460]
import { StrategicCommandManager, StrategicPolicy, type IPolicyBridge } from './strategic_command_system.js';
import type { WeatherType } from './intelligence_narrative_climate.js';
import { LifeSimulator } from './life_simulator.js';
import { MetaManager, LegacyManager, MetaDataManager } from './meta_systems.js';
import { IntelligenceManager, NarrativeManager, ClimateManager } from './intelligence_narrative_climate.js';
import { processVagrantMonthlyActions, resolvePlayerRaid } from './vagrant_monthly_actions.js';

type PhaseEnterHandler = () => void | Promise<void>;
type PhaseExitHandler = () => void;

interface FSMStateConfig {
    onEnter?: PhaseEnterHandler;
    onExit?: PhaseExitHandler;
    transitions: Record<string, GamePhase>;
}

export class GameEngine {
    private store: GameStore;
    private commandQueue: CommandQueue;
    private scheduler: TurnScheduler;
    private aiProcessor: AITurnProcessor;
    private lifecycleManager: TurnLifecycleManager;
    private fsm: Record<GamePhase, FSMStateConfig>;
    private currentPhase: GamePhase;
    private phaseHistory: PhaseTransition[];
    private eventListeners: Map<string, Set<EventListener>>;
    private eventQueue: GameEvent[];
    private worker: Worker | null = null;
    private workerPromises: Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>;
    private bootstrap: BootstrapContext | null = null;
    private factionAI: import('./faction_ai_monthly.js').FactionAI;
    private fateSystem: FactionFateSystem;
    private loyaltySystem: OfficerLoyaltySystem;
    private diplomacy: DiplomacyEngine;
    private diplomacyAI: FactionDiplomacyAI;
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
    private isProcessingTurn = false;
    /**
     * 이번 달 포팅 시스템 동향 수집 버퍼 [76-85][321-340][341-360][421-438]
     * processPortedSystemsMonthly가 채우고, 월간 보고서(MonthlyReportSystem)가 peek한다.
     * peekMonthlyPortedLog(hasRead=true)로 읽으면 비워진다.
     */
    private portedMonthlyLog: {
        campaigns: Array<{ targetCity: string; leaderName: string; soldiers: number }>;
        transports: Array<{ fromCity: string; toCity: string; gold: number; food: number; soldiers: number }>;
        collapsedNetworks: Array<{ factionId: string; cityId: string }>;
        retired: Array<{ officerName: string; age: number }>;
    } = { campaigns: [], transports: [], collapsedNetworks: [], retired: [] };

    constructor(store?: GameStore) {
        this.store = store ?? gameStore;
        this.commandQueue = new CommandQueue(200);
        this.aiProcessor = new AITurnProcessor(this.store, 50);
        this.scheduler = new TurnScheduler(async (task) => {
            await this.aiProcessor.processSingleOfficer(task.officerId);
        }, { chunkSize: 50 });
        this.lifecycleManager = new TurnLifecycleManager(this.store);
        this.factionAI = new FactionAI(this.store);
        this.fateSystem = new FactionFateSystem(this.store);
        this.loyaltySystem = new OfficerLoyaltySystem(this.store);
        this.diplomacy = new DiplomacyEngine();
        // 포로 등용 시 원소속 세력 원수화 페널티에서 동일 외교 엔진 사용 [24][341-360]
        this.loyaltySystem.diplomacy = this.diplomacy;
        this.factionAI.diplomacy = this.diplomacy;
        this.diplomacyAI = new FactionDiplomacyAI(this.store, this.diplomacy);
        this.chronicle = new ChronicleManager();
        this.chronicle.attachStore(this.store);
        // 포팅 시스템 초기화 [76-85][213-214][321-340][341-360][421-438][431-432][441-460]
        this.strategicCommand = new StrategicCommandManager('player');
        this.lifeSimulator = new LifeSimulator();
        this.metaManager = MetaManager.getInstance();
        this.legacyManager = new LegacyManager();
        this.metaDataManager = new MetaDataManager();
        this.intelligenceManager = new IntelligenceManager();
        this.narrativeManager = new NarrativeManager();
        this.climateManager = new ClimateManager();
        this.currentPhase = GamePhase.TITLE;
        this.phaseHistory = [];
        this.eventListeners = new Map();
        this.eventQueue = [];
        this.workerPromises = new Map();

        this.fsm = this.buildFSM();
        this.initWorker();
        this.initBootstrap();
    }

    private initBootstrap(): void {
        this.bootstrap = getBootstrap();
        this.bootstrap.initializeEngine(this);
    }

    private buildFSM(): Record<GamePhase, FSMStateConfig> {
        return {
            [GamePhase.TITLE]: {
                onEnter: () => console.log('[Engine] TITLE phase'),
                transitions: { START: GamePhase.WORLD_MAP },
            },
            [GamePhase.WORLD_MAP]: {
                onEnter: () => this.onEnterWorldMap(),
                onExit: () => console.log('[Engine] WORLD_MAP exit'),
                transitions: {
                    COUNCIL_START: GamePhase.COUNCIL,
                    BATTLE_START: GamePhase.BATTLE,
                    EVENT_TRIGGER: GamePhase.EVENT,
                    DIALOGUE: GamePhase.DIALOGUE,
                },
            },
            [GamePhase.COUNCIL]: {
                onEnter: () => this.onEnterCouncil(),
                onExit: () => console.log('[Engine] COUNCIL exit'),
                transitions: {
                    COUNCIL_END: GamePhase.PERSONAL_ACTION,
                    BATTLE_START: GamePhase.BATTLE,
                },
            },
            [GamePhase.PERSONAL_ACTION]: {
                onEnter: () => this.onEnterPersonalAction(),
                onExit: () => console.log('[Engine] PERSONAL_ACTION exit'),
                transitions: {
                    ACTION_END: GamePhase.WORLD_MAP,
                    BATTLE_START: GamePhase.BATTLE,
                    EVENT_TRIGGER: GamePhase.EVENT,
                },
            },
            [GamePhase.BATTLE]: {
                onEnter: () => this.onEnterBattle(),
                onExit: () => this.onExitBattle(),
                transitions: {
                    BATTLE_END: GamePhase.WORLD_MAP,
                    BATTLE_LOST: GamePhase.GAME_OVER,
                },
            },
            [GamePhase.DIALOGUE]: {
                onEnter: () => console.log('[Engine] DIALOGUE enter'),
                transitions: { DIALOGUE_END: GamePhase.WORLD_MAP },
            },
            [GamePhase.EVENT]: {
                onEnter: () => this.onEnterEvent(),
                onExit: () => console.log('[Engine] EVENT exit'),
                transitions: {
                    EVENT_END: GamePhase.WORLD_MAP,
                    DIALOGUE: GamePhase.DIALOGUE,
                    BATTLE_START: GamePhase.BATTLE,
                },
            },
            [GamePhase.GAME_OVER]: {
                onEnter: () => console.log('[Engine] GAME_OVER'),
                transitions: {},
            },
        };
    }

    transition(event: string): boolean {
        const currentConfig = this.fsm[this.currentPhase];
        const targetPhase = currentConfig.transitions[event];
        if (!targetPhase) {
            console.warn(`[Engine] Invalid: ${this.currentPhase} --[${event}]--> ?`);
            return false;
        }

        if (currentConfig.onExit) currentConfig.onExit();

        const transition: PhaseTransition = {
            from: this.currentPhase, to: targetPhase, event, timestamp: Date.now(),
        };
        this.phaseHistory.push(transition);
        this.currentPhase = targetPhase;
        this.store.setPhase(targetPhase);

        const targetConfig = this.fsm[targetPhase];
        if (targetConfig.onEnter) {
            const result = targetConfig.onEnter();
            if (result instanceof Promise) {
                result.catch(err => console.error('[Engine] onEnter error:', err));
            }
        }
        this.emitEvent({ id: `phase_${Date.now()}`, type: 'PHASE_CHANGE', payload: { from: transition.from, to: transition.to }, timestamp: Date.now(), turn: this.store.getGlobalState().turnCount });
        return true;
    }

    getCurrentPhase(): GamePhase { return this.currentPhase; }
    getPhaseHistory(): PhaseTransition[] { return [...this.phaseHistory]; }

    private onEnterWorldMap(): void {
        console.log('[Engine] WORLD_MAP enter');
        this.processWeatherEffect();
    }

    private async onEnterCouncil(): Promise<void> {
        console.log('[Engine] COUNCIL enter');
    }

    private onEnterPersonalAction(): void {
        console.log('[Engine] PERSONAL_ACTION enter');
        const playerOfficer = this.store.getGlobalState().selectedOfficerId;
        if (playerOfficer) {
            const officer = this.store.getOfficer(playerOfficer);
            if (officer) {
                console.log(`[Engine] Player: ${officer.name} (AP: ${officer.actionPoints})`);
            }
        }
    }

    private onEnterBattle(): void {
        console.log('[Engine] BATTLE enter');
        this.emitEvent({ id: `battle_${Date.now()}`, type: 'BATTLE_START', payload: {}, timestamp: Date.now(), turn: this.store.getGlobalState().turnCount });
    }

    private onExitBattle(): void {
        console.log('[Engine] BATTLE exit');
    }

    private onEnterEvent(): void {
        console.log('[Engine] EVENT enter');
        this.processEventQueue();
    }

    enqueueCommand(command: ICommand): void {
        this.commandQueue.enqueue(command);
        this.emitEvent({ id: `cmd_${Date.now()}`, type: 'COMMAND_ENQUEUE', payload: { cmdId: command.id, cmdType: command.type }, timestamp: Date.now(), turn: this.store.getGlobalState().turnCount });
    }

    executeNextCommand(): CommandResult | null {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.executeNext(context);
    }

    executeAllCommands(): CommandResult[] {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.executeAll(context);
    }

    undoLastCommand(): boolean {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.undoLast(context);
    }

    redoLastCommand(): boolean {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.redoLast(context);
    }

    canUndo(): boolean { return this.commandQueue.canUndo(); }
    canRedo(): boolean { return this.commandQueue.canRedo(); }
    getPendingCommandCount(): number { return this.commandQueue.getPendingCount(); }

    async executeTurn(onProgress?: (progress: SchedulerProgress) => void): Promise<void> {
        if (this.isProcessingTurn) {
            console.warn('[Engine] Turn already processing');
            return;
        }
        this.isProcessingTurn = true;

        try {
            const gs = this.store.getGlobalState();
            console.log(`[Engine] === Turn ${gs.turnCount} | ${gs.time.year}yr ${gs.time.month}mo ===`);

            this.resetTurnFlags();
            this.transition('COUNCIL_START');
            await this.delay(10);
            this.transition('COUNCIL_END');
            await this.delay(10);

            const decisions = await this.lifecycleManager.executeAITurn(onProgress);
            console.log(`[Engine] AI decisions: ${decisions.length}`);

            for (const decision of decisions) {
                this.convertDecisionToCommand(decision);
            }

            const results = this.executeAllCommands();
            const successCount = results.filter(r => r.success).length;
            console.log(`[Engine] Commands: ${successCount}/${results.length} ok`);

            this.processEventQueue();
            if (this.bootstrap) {
                this.bootstrap.processTurnStart();
            }
            // 세력 AI 월간 자율 행동 (내정/징병/출진) [201]
            const aiReports = this.factionAI.runMonthly();
            for (const r of aiReports) {
                if (r.actions.length > 0) {
                    console.log(`[FactionAI] ${r.factionName}: ${r.actions.join(', ')}`);
                    this.emitEvent({
                        id: `faction_ai_${r.factionId}_${Date.now()}`,
                        type: 'FACTION_AI_ACTION',
                        payload: { factionId: r.factionId, actions: r.actions, conqueredCityId: r.conqueredCityId },
                        timestamp: Date.now(),
                        turn: this.store.getGlobalState().turnCount,
                    });
                }
            }
            this.processMonthlyMaintenance();
            // 포팅 시스템 월간 훅 [76-85][321-340][341-360][421-438] — 전략 명령 진행, 첩보망 유지비,
            // 지역 기후 전이, 계절 기반 수확 보정, 고령 무장 은퇴
            this.processPortedSystemsMonthly();
            // AI 세력 월간 자율 외교 (선전포고/휴전/동맹) [341-360]
            const diploReports = this.diplomacyAI.runMonthly();
            for (const r of diploReports) {
                for (const msg of r.messages) {
                    console.log(`[Diplomacy] ${r.factionName}: ${msg}`);
                    this.emitEvent({
                        id: `diplomacy_${r.factionId}_${Date.now()}_${r.messages.indexOf(msg)}`,
                        type: 'FACTION_DIPLOMACY',
                        payload: { factionId: r.factionId, factionName: r.factionName, message: msg },
                        timestamp: Date.now(),
                        turn: this.store.getGlobalState().turnCount,
                    });
                }
            }
            // 무장 배신 판정 (AI 세력 무장) [24]
            const defections = this.loyaltySystem.processMonthlyDefections();
            for (const d of defections) {
                console.log(`[Engine] 배신: ${d.officerName} (${d.reason})`);
                this.emitEvent({
                    id: `defection_${d.officerId}_${Date.now()}`,
                    type: 'OFFICER_DEFECTED',
                    payload: { officerId: d.officerId, officerName: d.officerName, reason: d.reason },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // 포로 월간 탈출 판정 + 의형제 구출 [131-145][C-인간관계]
            const rescueReport = processMonthlySwornBrotherRescues(this.store);
            for (const rec of rescueReport.rescued) {
                console.log(`[Engine] ${rec.message}`);
                this.emitEvent({
                    id: `sworn_rescue_${rec.officerId}_${Date.now()}`,
                    type: 'SWORN_BROTHER_RESCUED',
                    payload: { officerId: rec.officerId, officerName: rec.officerName, rescuerId: rec.rescuerId, rescuerName: rec.rescuerName, toCityId: rec.toCityId },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            const captiveReport = processMonthlyCaptiveEvents(this.store);
            for (const rec of captiveReport.escaped) {
                console.log(`[Engine] ${rec.message}`);
                this.emitEvent({
                    id: `captive_escape_${rec.officerId}_${Date.now()}`,
                    type: 'CAPTIVE_ESCAPED',
                    payload: { officerId: rec.officerId, officerName: rec.officerName, fromCityId: rec.fromCityId },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // 월간 복수 이벤트 — 같은 도시/전장의 원수 무장 간 설전·단기접전 [32][33][C-인간관계]
            const vengeanceOutcomes = processMonthlyVengeance(this.store);
            for (const v of vengeanceOutcomes) {
                console.log(`[Engine] ${v.message}`);
                this.emitEvent({
                    id: `vengeance_${v.actorId}_${Date.now()}`,
                    type: 'VENGEANCE_EVENT',
                    payload: { kind: v.kind, actorId: v.actorId, targetId: v.targetId, success: v.success, message: v.message },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // 월간 의형제 결의 — 깊은 우호도 무장 간 결의 [C-인간관계][25]
            const pactReport = processMonthlySwornBrotherPacts(this.store);
            for (const pact of pactReport.pacts) {
                console.log(`[Engine] ${pact.message}`);
                this.emitEvent({
                    id: `sworn_pact_${pact.officerAId}_${pact.officerBId}_${Date.now()}`,
                    type: 'SWORN_BROTHER_PACT',
                    payload: { officerAName: pact.officerAName, officerBName: pact.officerBName, factionId: pact.factionId, message: pact.message },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // 월간 로밍 이벤트 — 재야 명사 방문 (현자/은자/상인/행상인/산적) [25][441-460]
            const roamingReport = processMonthlyRoamingEvents(this.store);
            for (const ev of roamingReport.events) {
                console.log(`[Engine] ${ev.message}`);
                this.emitEvent({
                    id: `roaming_${ev.type}_${ev.cityId}_${Date.now()}`,
                    type: 'GAME_ROAMING_EVENT',
                    payload: { roamingType: ev.type, cityId: ev.cityId, cityName: ev.cityName, factionName: ev.factionName, message: ev.message },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // 재야 무장 출사 타진 — 자발적 방문 등용 [24][421-440]
            const visitReport = processMonthlyFreeOfficerVisits(this.store);
            for (const visit of visitReport) {
                console.log(`[Engine] ${visit.message}`);
                this.emitEvent({
                    id: `free_visit_${visit.officerId}_${Date.now()}`,
                    type: 'FREE_OFFICER_VISIT',
                    payload: {
                        officerId: visit.officerId,
                        officerName: visit.officerName,
                        cityId: visit.cityId,
                        cityName: visit.cityName,
                        factionId: visit.factionId,
                        factionName: visit.factionName,
                        chance: visit.chance,
                        needsPlayerChoice: visit.needsPlayerChoice,
                        joined: visit.joined,
                        message: visit.message,
                    },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // 세력 운명 판정 — 멸망/통일/방랑군 재기 [83][213]
            // 무장이 남은 세력은 제거 대신 방랑군으로 전환 — playerFactionId 유효성 보장
            const fateReport = this.fateSystem.checkFatesWithVagrantRevival(true);
            for (const v of fateReport.vagrantConversions ?? []) {
                console.log(`[Engine] 방랑군 전환: ${v.factionName} (직속 ${v.keptOfficers}, 이탈 ${v.releasedOfficers})`);
                this.emitEvent({
                    id: `vagrant_${v.factionId}_${Date.now()}`,
                    type: 'FACTION_VAGRANT',
                    payload: { factionId: v.factionId, factionName: v.factionName, keptOfficers: v.keptOfficers, releasedOfficers: v.releasedOfficers, message: v.message },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            for (const name of fateReport.destroyedFactionNames) {
                console.log(`[Engine] 세력 멸망: ${name}`);
                this.emitEvent({
                    id: `faction_destroyed_${Date.now()}`,
                    type: 'FACTION_DESTROYED',
                    payload: { factionName: name },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            if (fateReport.ending) {
                this.emitEvent({
                    id: `game_ending_${Date.now()}`,
                    type: 'GAME_ENDING',
                    payload: { ending: fateReport.ending, winner: fateReport.winnerFactionName },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // [213] playerFactionId 정합성 — 플레이어 세력 멸망 시 패배 이벤트 발화 (게임오버 트리거)
            if (fateReport.playerFactionDestroyed) {
                console.log('[Engine] 플레이어 세력 멸망 — PLAYER_DEFEAT');
                this.emitEvent({
                    id: `player_defeat_${Date.now()}`,
                    type: 'PLAYER_DEFEAT',
                    payload: { message: fateReport.playerDefeatMessage ?? '플레이어 세력이 멸망했습니다.' },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            this.store.advanceTime();
            // 지옥 난이도 제약 — 수입 유실/탈영/반란 [X-난이도]
            const hellReport = processHellConstraints(this.store);
            if (hellReport.taxLeaked > 0) {
                console.log(`[Engine] 지옥: 세수 유실 ${hellReport.taxLeaked}`);
                this.emitEvent({
                    id: `hell_tax_${Date.now()}`,
                    type: 'HELL_CONSTRAINT',
                    payload: { kind: 'TAX_LEAK', amount: hellReport.taxLeaked, message: `⚔️ 전란으로 세수 ${hellReport.taxLeaked}이(가) 유실되었습니다` },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            for (const d of hellReport.deserted) {
                console.log(`[Engine] 지옥: 탈영 ${d.officerName}`);
                this.emitEvent({
                    id: `hell_desert_${d.officerId}_${Date.now()}`,
                    type: 'HELL_CONSTRAINT',
                    payload: { kind: 'DESERTION', officerId: d.officerId, message: `🚪 저충성 무장 ${d.officerName}이(가) 군을 이탈했습니다` },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            for (const r of hellReport.revolted) {
                console.log(`[Engine] 지옥: 반란 ${r.cityName}`);
                this.emitEvent({
                    id: `hell_revolt_${r.cityId}_${Date.now()}`,
                    type: 'HELL_CONSTRAINT',
                    payload: { kind: 'REVOLT', cityId: r.cityId, message: `🔥 치안이 무너진 ${r.cityName}에서 반란이 일어 ${r.fromFactionName}에서 이탈했습니다` },
                    timestamp: Date.now(),
                    turn: this.store.getGlobalState().turnCount,
                });
            }
            // [결함 수정] 턴 중반 유지보수 이벤트(재야 방문/로밍/복수/구출 등)가
            // 다음 턴 시작까지 배출되지 않아 UI가 1턴 늦게 반응하는 문제 해소
            this.processEventQueue();
            console.log('[Engine] === Turn end ===');
        } finally {
            this.isProcessingTurn = false;
        }
    }

    private resetTurnFlags(): void {
        const officers = this.store.getAllOfficers();
        for (const officer of officers) {
            this.store.updateOfficer(officer.id, {
                hasActedThisTurn: false,
                actionPoints: officer.maxActionPoints,
            });
        }
    }

    private convertDecisionToCommand(decision: AIDecision): void {
        const officerId = decision.officerId;
        const turn = this.store.getGlobalState().turnCount;
        const payload = decision.payload;
        let command: ICommand | null = null;

        switch (decision.actionType) {
            case 'DOMESTIC':
                if (payload.cityId) {
                    command = new DomesticCommand(officerId, payload.cityId as CityID, (payload.facilityType as string) ?? 'FARM', turn);
                }
                break;
            case 'TRAINING':
                command = new TrainingCommand(officerId, (payload.statKey as 'leadership' | 'might' | 'intelligence' | 'politics' | 'charisma') ?? 'might', turn);
                break;
            case 'RECRUITMENT':
                if (payload.targetOfficerId) {
                    command = new RecruitmentCommand(officerId, payload.targetOfficerId as OfficerID, turn);
                }
                break;
            case 'MOVEMENT':
                if (payload.fromCityId && payload.toCityId) {
                    command = new MovementCommand(officerId, payload.fromCityId as CityID, payload.toCityId as CityID, turn);
                }
                break;
            case 'REST':
                command = new RestCommand(officerId, turn);
                break;
            default:
                command = new RestCommand(officerId, turn);
        }

        if (command) {
            this.enqueueCommand(command);
            this.store.updateOfficer(officerId, { hasActedThisTurn: true });
        }
    }

    private processMonthlyMaintenance(): void {
        const factions = this.store.getAllFactions();
        for (const faction of factions) {
            const cities = this.store.getCitiesByFaction(faction.id);
            const goldIncome = cities.reduce((sum, c) => sum + c.goldIncome, 0);
            const foodIncome = cities.reduce((sum, c) => sum + c.foodIncome, 0);
            this.store.updateFaction(faction.id, {
                gold: faction.gold + goldIncome,
                food: faction.food + foodIncome,
            });
            // 도시 자금에 월 수입 유입 [E1-361: 거시 경제] — 내정 재원 순환
            // 1) 발전도 연동 수입 재계산: 상업↑ → goldIncome↑, 농업↑ → foodIncome↑
            // 2) 상업 수익(골드 수입의 3배)은 도시 자금에 직접 귀속, 전액은 세력 국고로도 입금
            //    → 개발(상업+)할수록 다음 달 수입이 늘어나는 선순환
            for (const c of cities) {
                const ds = c.developmentStats;
                const newGoldIncome = 90 + Math.floor(ds.commerce);
                const newFoodIncome = 200 + Math.floor(ds.farming * 2.62);
                // 발전도 성장분: 매월 상업+3, 농업+2 자연 성장 (개발 투자 시 추가)
                const grownCommerce = Math.min(ds.maxCommerce, ds.commerce + 3);
                const grownFarming = Math.min(ds.maxFarming, ds.farming + 2);
                const grownGoldIncome = 90 + Math.floor(grownCommerce);
                this.store.updateCity(c.id, {
                    goldIncome: grownGoldIncome,
                    foodIncome: 200 + Math.floor(grownFarming * 2.62),
                    developmentStats: { ...ds, commerce: grownCommerce, farming: grownFarming },
                    funds: c.funds + grownGoldIncome * 3,
                });
                this.store.updateFaction(faction.id, { gold: faction.gold + newGoldIncome });
            }
        }

        const officers = this.store.getAllOfficers();
        const currentYear = this.store.getGlobalState().time.year;
        for (const officer of officers) {
            if (officer.deathYear && currentYear >= officer.deathYear) {
                console.log(`[Engine] ${officer.name} died (lifespan)`);
                const gs = this.store.getGlobalState();
                const age = currentYear - officer.birthYear;
                this.store.removeOfficer(officer.id);
                this.emitEvent({
                    id: `death_${officer.id}`,
                    type: 'OFFICER_DEATH',
                    payload: {
                        officerId: officer.id,
                        officerName: officer.name,
                        cause: 'OLD_AGE',
                        age,
                        year: currentYear,
                        turn: gs.turnCount,
                        factionId: officer.factionId,
                    },
                    timestamp: Date.now(),
                    turn: gs.turnCount,
                });
            }
        }
    }

    /**
     * 포팅 시스템 월간 훅 [76-85][321-340][341-360][421-438]
     * 1) 전략 명령 진행 — 출진/수송 큐 처리 및 완료 이벤트 발화
     * 2) 첩보망 유지비 — 레벨 1 소모, 미유지 시 붕괴 이벤트
     * 3) 지역 기후 전이 — 계절 기반 날씨 전이 및 수확 보정 반영
     * 4) 고령 무장 은퇴 — 60세 도달 무장 은퇴 기록
     */
    private processPortedSystemsMonthly(): void {
        const turn = this.store.getGlobalState().turnCount;

        // 1) 전략 명령 진행 [76-79]
        const { campaignsCompleted, transportsCompleted } = this.strategicCommand.processTurn(turn);
        for (const campaign of campaignsCompleted) {
            const leader = this.store.getOfficer(campaign.army.leaderId);
            this.portedMonthlyLog.campaigns.push({
                targetCity: campaign.targetCity,
                leaderName: leader?.name ?? campaign.army.leaderId,
                soldiers: campaign.army.soldiers,
            });
            this.emitEvent({
                id: `campaign_${campaign.targetCity}_${Date.now()}`,
                type: 'CAMPAIGN_ORDER_COMPLETED',
                payload: { targetCityId: campaign.targetCity, leaderId: campaign.army.leaderId, soldiers: campaign.army.soldiers },
                timestamp: Date.now(),
                turn,
            });
        }
        for (const t of transportsCompleted) {
            this.portedMonthlyLog.transports.push({
                fromCity: t.fromCity,
                toCity: t.toCity,
                gold: t.gold,
                food: t.food,
                soldiers: t.soldiers,
            });
            this.emitEvent({
                id: `transport_${t.toCity}_${Date.now()}`,
                type: 'TRANSPORT_COMPLETED',
                payload: { fromCityId: t.fromCity, toCityId: t.toCity, gold: t.gold, food: t.food, soldiers: t.soldiers },
                timestamp: Date.now(),
                turn,
            });
        }

        // 2) 첩보망 유지비 [346] — 월간 레벨 1 소모
        for (const n of this.intelligenceManager.getAllNetworks()) {
            const survived = this.intelligenceManager.decayNetworks(n.factionId, n.cityId, 1);
            if (!survived) {
                this.portedMonthlyLog.collapsedNetworks.push({ factionId: n.factionId, cityId: n.cityId });
                this.emitEvent({
                    id: `intel_collapse_${n.factionId}_${n.cityId}_${Date.now()}`,
                    type: 'INTELLIGENCE_NETWORK_COLLAPSED',
                    payload: { factionId: n.factionId, cityId: n.cityId },
                    timestamp: Date.now(),
                    turn,
                });
            }
        }

        // 3) 지역 기후 전이 [321-340] — 계절 기반 날씨 전이
        const month = this.store.getGlobalState().time.month;
        const season = month >= 3 && month <= 5 ? 'SPRING'
            : month >= 6 && month <= 8 ? 'SUMMER'
            : month >= 9 && month <= 11 ? 'AUTUMN' : 'WINTER';
        const seasonWeather: Record<string, WeatherType[]> = {
            SPRING: ['SUNNY', 'CLOUDY', 'RAIN'],
            SUMMER: ['SUNNY', 'HEATWAVE', 'STORM'],
            AUTUMN: ['SUNNY', 'CLOUDY', 'FOG'],
            WINTER: ['SNOW', 'CLOUDY'],
        };
        const seasonTemp: Record<string, number> = { SPRING: 16, SUMMER: 30, AUTUMN: 14, WINTER: -2 };
        for (const c of this.climateManager.getAllClimates()) {
            const pool = seasonWeather[season];
            const weather = pool[Math.floor(Math.random() * pool.length)];
            const updated = this.climateManager.updateClimate(c.regionId, weather, seasonTemp[season]);
            if (updated && updated.harvestModifier < 1.0) {
                // 악천후 수확 보정을 도시 소속 세력에 반영 — 군량 차감
                for (const city of this.store.getAllCities()) {
                    if (city.ownerId) {
                        const faction = this.store.getFaction(city.ownerId);
                        if (faction) {
                            const penalty = Math.round((1.0 - updated.harvestModifier) * 50);
                            if (penalty > 0) {
                                this.store.updateFaction(faction.id, { food: Math.max(0, faction.food - penalty) });
                            }
                        }
                    }
                }
            }
        }

        // 4) 고령 무장 은퇴 [434] — 60세 도달 시 은퇴 기록
        const year = this.store.getGlobalState().time.year;
        for (const officer of this.store.getAllOfficers()) {
            const age = year - officer.birthYear;
            if (this.lifeSimulator.canRetire(officer.id, age)) {
                this.lifeSimulator.retire(officer.id, year);
                this.portedMonthlyLog.retired.push({ officerName: officer.name, age });
                this.emitEvent({
                    id: `retire_${officer.id}_${Date.now()}`,
                    type: 'OFFICER_RETIRED',
                    payload: { officerId: officer.id, officerName: officer.name, age, year },
                    timestamp: Date.now(),
                    turn,
                });
            }
        }

        // 5) 방랑군 재기 행동 [83][421-440] — 재야 등용 + 도시 습격 → 재기(FACTION_REVIVED) 경로
        const vagrantResults = processVagrantMonthlyActions(this.store);
        for (const r of vagrantResults) {
            console.log(`[Engine] 방랑군: ${r.message}`);
            this.emitEvent({
                id: `vagrant_action_${r.factionId}_${r.kind}_${Date.now()}`,
                type: r.kind === 'RAID' && r.success ? 'FACTION_REVIVED' : 'VAGRANT_ACTION',
                payload: {
                    factionId: r.factionId,
                    factionName: r.factionName,
                    kind: r.kind,
                    success: r.success,
                    capturedCityId: r.capturedCityId ?? null,
                    recruitedOfficerId: r.recruitedOfficerId ?? null,
                    message: r.message,
                },
                timestamp: Date.now(),
                turn,
            });
        }
    }

    /**
     * 이번 달 포팅 시스템 동향 peek [76-85][321-340][341-360][421-438]
     * 월간 보고서(MonthlyReportSystem)가 호출. consume=true면 읽 후 버퍼를 비운다.
     */
    peekMonthlyPortedLog(consume = false): {
        campaigns: Array<{ targetCity: string; leaderName: string; soldiers: number }>;
        transports: Array<{ fromCity: string; toCity: string; gold: number; food: number; soldiers: number }>;
        collapsedNetworks: Array<{ factionId: string; cityId: string }>;
        retired: Array<{ officerName: string; age: number }>;
    } {
        const snapshot = {
            campaigns: [...this.portedMonthlyLog.campaigns],
            transports: [...this.portedMonthlyLog.transports],
            collapsedNetworks: [...this.portedMonthlyLog.collapsedNetworks],
            retired: [...this.portedMonthlyLog.retired],
        };
        if (consume) {
            this.portedMonthlyLog.campaigns = [];
            this.portedMonthlyLog.transports = [];
            this.portedMonthlyLog.collapsedNetworks = [];
            this.portedMonthlyLog.retired = [];
        }
        return snapshot;
    }

    private processWeatherEffect(): void {
        const gs = this.store.getGlobalState();
        if (gs.weather === 'STORM' || gs.weather === 'SNOW') {
            console.log(`[Engine] Weather: ${gs.weather}`);
            const officers = this.store.getAllOfficers();
            for (const officer of officers) {
                this.store.updateOfficer(officer.id, {
                    stamina: Math.max(0, officer.stamina - 5),
                });
            }
        }
    }

    emitEvent(event: GameEvent): void {
        // [결함 수정] 큐에 넣고 리스너를 즉시 발화하면 processEventQueue에서
        // 동일 이벤트가 2회 dispatch되었다 (유령 로그/이중 자동 저장의 원인).
        // 큐잉만 하고 processEventQueue에서 단일 발화하도록 변경.
        this.eventQueue.push(event);
    }

    subscribe(eventType: string, listener: EventListener): () => void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType)!.add(listener);
        return () => this.eventListeners.get(eventType)?.delete(listener);
    }

    private processEventQueue(): void {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (!event) continue;
            const listeners = this.eventListeners.get(event.type);
            if (listeners) {
                for (const listener of listeners) {
                    listener(event);
                }
            }
        }
    }

    getPendingEvents(): GameEvent[] { return [...this.eventQueue]; }

    private initWorker(): void {
        if (typeof Worker === 'undefined') {
            console.warn('[Engine] Web Worker not supported - fallback');
            return;
        }
        try {
            this.worker = new Worker(new URL('./ai_worker.js', import.meta.url), { type: 'module' });
            this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                const response = e.data;
                const pending = this.workerPromises.get(response.id);
                if (pending) {
                    if (response.success) {
                        pending.resolve(response.result);
                    } else {
                        pending.reject(new Error(response.error ?? 'Unknown worker error'));
                    }
                    this.workerPromises.delete(response.id);
                }
            };
            this.worker.onerror = (err) => {
                console.error('[Engine] Worker error:', err);
            };
        } catch (err) {
            console.warn('[Engine] Worker init failed, fallback:', err);
            this.worker = null;
        }
    }

    async requestAIWorker(payload: AIWorkerPayload): Promise<AIWorkerResult> {
        if (!this.worker) {
            return this.localAIProcessing(payload);
        }

        const request: WorkerRequest = {
            id: `ai_req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: 'AI_DECISION',
            payload: payload as unknown as Record<string, unknown>,
        };

        return new Promise((resolve, reject) => {
            this.workerPromises.set(request.id, {
                resolve: (v) => resolve(v as AIWorkerResult),
                reject,
            });
            this.worker!.postMessage(request);
        });
    }

    private async localAIProcessing(payload: AIWorkerPayload): Promise<AIWorkerResult> {
        const decisions: AIDecision[] = [];
        for (const officerId of payload.officerIds) {
            const officer = payload.stateSnapshot.officers[officerId];
            if (!officer) continue;
            decisions.push({
                officerId,
                actionType: officer.actionPoints < 20 ? 'REST' : 'DOMESTIC',
                priority: 0.5,
                reasoning: 'Local fallback decision',
                payload: { cityId: officer.cityId ?? '' },
            });
        }
        return { decisions };
    }

    terminateWorker(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.workerPromises.clear();
    }

    /** 외교 엔진 접근자 (UI/AI 용) [70-73] */
    get diplomacyEngine(): DiplomacyEngine {
        return this.diplomacy;
    }

    /**
     * 플레이어 도시 습격 커맨드 [83] — 전략 포인트 30 소비 후 습격 판정.
     * 플레이어 세력이 방랑군일 때만 가능. 성공 시 FACTION_REVIVED 이벤트.
     */
    playerRaidCity(targetCityId: CityID): { success: boolean; message: string } {
        const gs = this.store.getGlobalState();
        const pf = gs.playerFactionId;
        const faction = pf ? this.store.getFaction(pf) : null;
        if (!faction) return { success: false, message: '세력을 찾을 수 없습니다.' };
        if (!faction.isVagrant) return { success: false, message: '습격은 방랑군 상태에서만 가능합니다.' };
        if (!this.strategicCommand.orderRaid()) {
            return { success: false, message: `전략 포인트가 부족합니다 (필요 30, 현재 ${this.strategicCommand.getStrategyPoints()}).` };
        }
        const outcome = resolvePlayerRaid(this.store, pf!, targetCityId);
        this.emitEvent({
            id: `player_raid_${targetCityId}_${Date.now()}`,
            type: outcome.success ? 'FACTION_REVIVED' : 'VAGRANT_ACTION',
            payload: {
                factionId: pf,
                factionName: faction.name,
                kind: 'RAID',
                success: outcome.success,
                capturedCityId: outcome.capturedCityId ?? null,
                message: outcome.message,
            },
            timestamp: Date.now(),
            turn: gs.turnCount,
        });
        return outcome;
    }

    save(): {
        state: NormalizedState; globalState: GlobalState; commands: SerializedCommand[];
        diplomacy: Array<{ a: string; b: string; relation: string }>;
        chronicle?: import('./chronicle_system.js').ChronicleEntry[];
        /** 포팅 시스템 스냅샷 [76-85][321-340][341-360][421-438][431-432][441-460] */
        ported?: {
            strategic: ReturnType<StrategicCommandManager['serialize']>;
            climates: Array<{ regionId: string; weather: string; temperature: number; harvestModifier: number }>;
            narratives: Array<{ id: number; description: string; recordedAt: number }>;
            /** 첩보망 [346] — 세이브에 포함 */
            intelNetworks?: Array<{ factionId: FactionID; cityId: CityID; level: number; builtAtTurn: number }>;
            /** 은퇴 무장 [434] — 세이브에 포함 */
            retiredOfficers?: Array<{ officerId: OfficerID; retireYear: number; finalRank: string }>;
        };
    } {
        return {
            state: this.store.createSnapshot(),
            globalState: this.store.getGlobalState(),
            commands: this.commandQueue.serializeAll(),
            diplomacy: this.diplomacy.serialize(),
            // 연대기 포함 [Y-메타][441-460] — 이어하기 후에도 역사 유지
            chronicle: this.chronicle.serialize(),
            // 포팅 시스템 상태 포함 — 이어하기 후 군단/기후/내러티브 복원
            ported: {
                strategic: this.strategicCommand.serialize(),
                climates: this.climateManager.getAllClimates().map((c) => ({
                    regionId: c.regionId,
                    weather: c.weather,
                    temperature: c.temperature,
                    harvestModifier: c.harvestModifier,
                })),
                narratives: this.narrativeManager.getEvents().map((e) => ({
                    id: e.id,
                    description: e.description,
                    recordedAt: e.recordedAt,
                })),
                intelNetworks: this.intelligenceManager.serializeNetworks(),
                retiredOfficers: this.lifeSimulator.getAllRetiredOfficers().map((r) => ({
                    officerId: r.officerId,
                    retireYear: r.retireYear,
                    finalRank: r.finalRank,
                })),
            },
        };
    }

    saveCompressed(): string {
        if (this.bootstrap) {
            return this.bootstrap.prepareSave(this);
        }
        return JSON.stringify(this.save());
    }

    loadCompressed(compressed: string): boolean {
        if (this.bootstrap) {
            return this.bootstrap.loadFromSave(this, compressed);
        }
        try {
            const data = JSON.parse(compressed);
            this.load(data);
            return true;
        } catch {
            return false;
        }
    }

    load(data: {
        state: NormalizedState; globalState: GlobalState; commands: SerializedCommand[];
        diplomacy?: Array<{ a: string; b: string; relation: string }>;
        chronicle?: import('./chronicle_system.js').ChronicleEntry[];
        ported?: {
            strategic: ReturnType<StrategicCommandManager['serialize']>;
            climates: Array<{ regionId: string; weather: string; temperature: number; harvestModifier: number }>;
            narratives: Array<{ id: number; description: string; recordedAt: number }>;
            intelNetworks?: Array<{ factionId: FactionID; cityId: CityID; level: number; builtAtTurn: number }>;
            retiredOfficers?: Array<{ officerId: OfficerID; retireYear: number; finalRank: string }>;
        };
    }): void {
        this.store.restoreSnapshot(data.state);
        this.store.setGlobalState(data.globalState);
        // FSM을 세이브 시점 페이즈로 동기화 (onEnter 부작용 없이 상태만 복원)
        if (data.globalState.phase && data.globalState.phase !== this.currentPhase) {
            this.currentPhase = data.globalState.phase;
        }
        // 외교 관계 복원 (구버전 세이브 호환: 없으면 초기화 상태 유지)
        if (data.diplomacy) {
            this.diplomacy.restore(data.diplomacy);
        }
        // 연대기 복원 (구버전 세이브 호환: 없으면 빈 상태 유지) [Y-메타][441-460]
        if (data.chronicle) {
            this.chronicle.load(data.chronicle);
        }
        // 포팅 시스템 복원 (구버전 세이브 호환: 없으면 초기화 상태 유지)
        if (data.ported) {
            this.strategicCommand.restore(data.ported.strategic);
            for (const c of data.ported.climates) {
                this.climateManager.updateClimate(
                    c.regionId,
                    c.weather as import('./intelligence_narrative_climate.js').WeatherType,
                    c.temperature,
                );
            }
            for (const e of data.ported.narratives) {
                this.narrativeManager.recordEvent(e.description, e.recordedAt);
            }
            if (data.ported.intelNetworks) {
                this.intelligenceManager.restoreNetworks(data.ported.intelNetworks);
            }
            if (data.ported.retiredOfficers) {
                this.lifeSimulator.restoreRetiredOfficers(data.ported.retiredOfficers);
            }
        }
        this.commandQueue.clear();
        for (const cmdData of data.commands) {
            this.commandQueue.enqueue(deserializeCommand(cmdData));
        }
        console.log('[Engine] Save loaded');
    }

    initWorld(officers: Officer[], factions: Faction[], cities: City[], armies: Army[]): void {
        this.store.initWorld(officers, factions, cities, armies);
        this.transition('START');
        console.log('[Engine] World initialized');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

let engineInstance: GameEngine | null = null;

export function getGameEngine(): GameEngine {
    if (!engineInstance) engineInstance = new GameEngine();
    return engineInstance;
}
