/**
 * 삼국지 8 리메이크 — 핵심 타입 정의
 * 파일: src/core/types.ts
 *
 * 모든 도메인 엔티티, 커맨드, 상태, 이벤트 타입 정의
 * 정규화 상태 트리 구조 + 커맨드 패턴 인터페이스
 */

// ============================================================
// 공통 유틸리티 타입
// ============================================================

export type ID = string;
export type FactionID = string;
export type OfficerID = string;
export type CityID = string;
export type ArmyID = string;

export interface Vec2 { x: number; y: number; }
export interface HexCoord { q: number; r: number; }

// ============================================================
// 게임 페이즈 (유한 상태 머신)
// ============================================================

export enum GamePhase {
    TITLE = 'TITLE',
    WORLD_MAP = 'WORLD_MAP',
    COUNCIL = 'COUNCIL',
    PERSONAL_ACTION = 'PERSONAL_ACTION',
    BATTLE = 'BATTLE',
    DIALOGUE = 'DIALOGUE',
    EVENT = 'EVENT',
    GAME_OVER = 'GAME_OVER',
}

export interface PhaseTransition {
    from: GamePhase;
    to: GamePhase;
    event: string;
    timestamp: number;
}

// ============================================================
// 시간/날씨 (전역 상태)
// ============================================================

export interface GameTime {
    year: number;
    month: number;
}

export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
export type Weather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'FOG';

export function monthToSeason(month: number): Season {
    const m = ((month - 1) % 12) + 1;
    if (m >= 3 && m <= 5) return 'SPRING';
    if (m >= 6 && m <= 8) return 'SUMMER';
    if (m >= 9 && m <= 11) return 'AUTUMN';
    return 'WINTER';
}

// ============================================================
// 무장 (Officer) 도메인
// ============================================================

export enum OfficerRank {
    UNRANKED = 0, RANK9 = 9, RANK8 = 8, RANK7 = 7,
    RANK6 = 6, RANK5 = 5, RANK4 = 4, RANK3 = 3,
    RANK2 = 2, RANK1 = 1,
}

export enum OfficerStatus {
    LORD = 'LORD',
    Viceroy = 'VICEROY',
    Strategist = 'STRATEGIST',
    Governor = 'GOVERNOR',
    OFFICER = 'OFFICER',
    FREE = 'FREE',
    REBEL = 'REBEL',
}

export type Personality = 'AGGRESSIVE' | 'CALM' | 'CAUTIOUS' | 'TIMID' | 'LOYAL' | 'AMBITIOUS' | 'RIGHTEOUS' | 'GREEDY';

export interface OfficerStats {
    leadership: number;
    might: number;
    intelligence: number;
    politics: number;
    charisma: number;
}

export interface OfficerExp {
    leadership: number;
    might: number;
    intelligence: number;
    politics: number;
    charisma: number;
}

export interface OfficerInventory {
    weapons: string[];
    mounts: string[];
    treasures: string[];
    books: string[];
}

export interface Officer {
    id: OfficerID;
    name: string;
    courtesyName: string;
    gender: 'M' | 'F';
    birthYear: number;
    deathYear: number | null;
    stats: OfficerStats;
    exp: OfficerExp;
    rank: OfficerRank;
    status: OfficerStatus;
    factionId: FactionID | null;
    cityId: CityID | null;
    personality: Personality;
    loyalty: number;
    ambition: number;
    morality: number;
    greed: number;
    actionPoints: number;
    maxActionPoints: number;
    stamina: number;
    maxStamina: number;
    fame: number;
    infamy: number;
    merit: number;
    salary: number;
    skills: string[];
    specialty: string | null;
    inventory: OfficerInventory;
    isFemaleBattleEnabled: boolean;
    hasActedThisTurn: boolean;
    hp: number;
    maxHp: number;
    injuries: number;

    // 🟢 [추가] AI 및 동적 시뮬레이션을 위한 실시간 런타임 상태
    runtime: {
        isAlive: boolean;
        factionId: string | null;
        locationId: string;
        loyalty: number;
    };
    
    // 🟢 [추가] 유전 마커 및 확장 데이터
    originClanId?: string;
    appearancePoolId?: string;
}


// ============================================================
// 세력 (Faction) 도메인
// ============================================================

export interface FactionPolicy {
    recruitmentFocus: number;
    militaryFocus: number;
    economyFocus: number;
    diplomacyFocus: number;
    cultureFocus: number;
}

export interface FactionDiplomacy {
    [targetFactionId: string]: {
        relation: number;
        treaty: 'NONE' | 'CEASEFIRE' | 'ALLIANCE' | 'VASSAL' | 'WAR';
        duration: number;
    };
}

export interface Faction {
    id: FactionID;
    name: string;
    leaderId: OfficerID;
    color: string;
    capitalCityId: CityID | null;
    cities: CityID[];
    officers: OfficerID[];
    armies: ArmyID[];
    gold: number;
    food: number;
    reputation: number;
    policy: FactionPolicy;
    diplomacy: FactionDiplomacy;
    isPlayerControlled: boolean;
    techLevel: number;
}

// ============================================================
// 도시 (City) 도메인
// ============================================================

export enum FacilityType {
    PALACE = 'PALACE',
    WALL = 'WALL',
    MARKET = 'MARKET',
    FARM = 'FARM',
    TAVERN = 'TAVERN',
    BLACKSMITH = 'BLACKSMITH',
    GRANARY = 'GRANARY',
    BARRACKS = 'BARRACKS',
}

export interface Facility {
    type: FacilityType;
    level: number;
    maxLevel: number;
    investment: number;
}

export interface CityDevelopmentStats {
    commerce: number;
    maxCommerce: number;
    farming: number;
    maxFarming: number;
    technology: number;
    maxTechnology: number;
    publicOrder: number;
    maxPublicOrder: number;
}

export interface City {
    id: CityID;
    name: string;
    hexCoord: HexCoord;
    /** 중국 전도 상의 위치 (정규화 0~1). 미지정 시 hexCoord 기반으로 계산 */
    mapX?: number;
    mapY?: number;
    population: number;
    defense: number;
    maxDefense: number;
    goldIncome: number;
    foodIncome: number;
    funds: number;
    facilities: Facility[];
    officerIds: OfficerID[];
    ownerId: FactionID | null;
    isCapital: boolean;
    development: number;
    developmentStats: CityDevelopmentStats;
    loyalty: number;
    danger: number;
    weather: Weather;
}

// ============================================================
// 관계망 (Relationship Graph)
// ============================================================

export type RelationType = 'FRIEND' | 'RIVAL' | 'SWORN_BROTHER' | 'NEMESIS' | 'FAMILY' | 'SPOUSE' | 'SUBORDINATE';

export interface RelationshipEdge {
    source: OfficerID;
    target: OfficerID;
    type: RelationType;
    affinity: number;
    history: { year: number; month: number; event: string; delta: number }[];
}

// ============================================================
// 군단 (Army) 도메인
// ============================================================

export interface Army {
    id: ArmyID;
    commanderId: OfficerID;
    officerIds: OfficerID[];
    soldiers: number;
    morale: number;
    training: number;
    supplies: number;
    originCityId: CityID;
    targetCityId: CityID | null;
    position: HexCoord | null;
    banner: string;
}

// ============================================================
// 커맨드 패턴 인터페이스
// ============================================================

export type CommandType =
    | 'DOMESTIC'
    | 'TRAINING'
    | 'RECRUITMENT'
    | 'MOVEMENT'
    | 'DIPLOMACY'
    | 'BATTLE'
    | 'REST'
    | 'SOCIAL'
    | 'SEARCH';

export interface ICommand {
    readonly id: string;
    readonly type: CommandType;
    readonly officerId: OfficerID;
    readonly turnIssued: number;
    readonly timestamp: number;

    execute(context: CommandContext): CommandResult;
    undo(context: CommandContext): boolean;
    serialize(): SerializedCommand;
}

export interface SerializedCommand {
    id: string;
    type: CommandType;
    officerId: OfficerID;
    turnIssued: number;
    timestamp: number;
    payload: Record<string, unknown>;
}

export interface CommandResult {
    success: boolean;
    message: string;
    sideEffects: SideEffect[];
}

export interface SideEffect {
    target: 'officer' | 'city' | 'faction' | 'army' | 'relation';
    targetId: ID;
    field: string;
    oldValue: unknown;
    newValue: unknown;
}

export interface CommandContext {
    store: IGameStore;
    logger: (msg: string) => void;
}

// ============================================================
// AI 의사결정
// ============================================================

export interface AIDecisionContext {
    officerId: OfficerID;
    officer: Officer;
    faction: Faction | null;
    city: City | null;
    nearbyCities: City[];
    enemyFactions: Faction[];
    allyFactions: Faction[];
    relationships: RelationshipEdge[];
    gameTime: GameTime;
    season: Season;
    weather: Weather;
}

export interface AIDecision {
    officerId: OfficerID;
    actionType: CommandType;
    priority: number;
    reasoning: string;
    targetId?: ID;
    payload: Record<string, unknown>;
}

// ============================================================
// 정규화 상태 트리 (Normalized State Tree)
// ============================================================

export interface NormalizedState {
    officers: Record<OfficerID, Officer>;
    factions: Record<FactionID, Faction>;
    cities: Record<CityID, City>;
    armies: Record<ArmyID, Army>;
    relationships: Record<string, RelationshipEdge>;
    byFaction: {
        officers: Record<FactionID, OfficerID[]>;
        cities: Record<FactionID, CityID[]>;
        armies: Record<FactionID, ArmyID[]>;
    };
    byCity: {
        officers: Record<CityID, OfficerID[]>;
    };
    byOfficer: {
        relationships: Record<OfficerID, RelationshipEdge[]>;
    };
}

export interface GlobalState {
    phase: GamePhase;
    time: GameTime;
    season: Season;
    weather: Weather;
    turnCount: number;
    selectedOfficerId: OfficerID | null;
    playerFactionId: FactionID | null;
}

// ============================================================
// 게임 스토어 인터페이스
// ============================================================

export interface IGameStore {
    getState(): NormalizedState;
    getGlobalState(): GlobalState;
    dispatch(command: ICommand): CommandResult;
    subscribe(listener: (state: NormalizedState, globalState: GlobalState) => void): () => void;
    getOfficer(id: OfficerID): Officer | null;
    getFaction(id: FactionID): Faction | null;
    getCity(id: CityID): City | null;
    getArmy(id: ArmyID): Army | null;
    getRelationships(officerId: OfficerID): RelationshipEdge[];
    updateOfficer(id: OfficerID, updates: Partial<Officer>): void;
    updateFaction(id: FactionID, updates: Partial<Faction>): void;
    updateCity(id: CityID, updates: Partial<City>): void;
    updateArmy(id: ArmyID, updates: Partial<Army>): void;
    addOfficer(officer: Officer): void;
    removeOfficer(id: OfficerID): void;
    addRelationship(edge: RelationshipEdge): void;
    setGlobalState(updates: Partial<GlobalState>): void;
    createSnapshot(): NormalizedState;
    restoreSnapshot(snapshot: NormalizedState): void;
    getAllOfficers(): Officer[];
    getAllFactions(): Faction[];
    getAllCities(): City[];
    getOfficersByFaction(factionId: FactionID): Officer[];
    getCitiesByFaction(factionId: FactionID): City[];
    getOfficersByCity(cityId: CityID): Officer[];
}

// ============================================================
// 턴 스케줄러 인터페이스
// ============================================================

export interface TurnSchedulerOptions {
    chunkSize: number;
    maxFrameTimeMs: number;
    useIdleCallback: boolean;
}

export interface SchedulerProgress {
    total: number;
    completed: number;
    currentChunk: number;
    isComplete: boolean;
}

export interface ChunkTask {
    id: string;
    officerId: OfficerID;
    execute: () => void | Promise<void>;
}

// ============================================================
// 이벤트 시스템
// ============================================================

export interface GameEvent {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp: number;
    turn: number;
}

export type EventListener = (event: GameEvent) => void;

// ============================================================
// Web Worker 메시지 프로토콜
// ============================================================

export interface WorkerRequest {
    id: string;
    type: 'AI_DECISION' | 'BATTLE_SIM' | 'PATHFIND';
    payload: Record<string, unknown>;
}

export interface WorkerResponse {
    id: string;
    success: boolean;
    result?: unknown;
    error?: string;
}

export interface AIWorkerPayload {
    officerIds: OfficerID[];
    stateSnapshot: NormalizedState;
    globalState: GlobalState;
}

export interface AIWorkerResult {
    decisions: AIDecision[];
}
