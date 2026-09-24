/**
 * 삼국지 8 리메이크 — 싱글톤 중앙 상태 저장소
 * 파일: src/core/game_store.ts
 *
 * 정규화 상태 트리 (Normalized State Tree)
 * 모든 엔티티를 1차원 테이블로 정규화하여 O(1) 조회 보장
 * Redux 스타일 구독 + 디스패치
 */
import { IGameStore, NormalizedState, GlobalState, Officer, Faction, City, Army, RelationshipEdge, OfficerID, FactionID, CityID, ArmyID, ICommand, GamePhase } from './types.js';
import { TriStateGraphDatabase } from './relationship_graph_db.js';
type StoreListener = (state: NormalizedState, globalState: GlobalState) => void;
declare class GameStore implements IGameStore {
    private state;
    private globalState;
    private listeners;
    private static instance;
    /** 파생 관계망 그래프 인덱스 — O(1) 이웃/적대 조회 (relationship_graph_db.ts) */
    private readonly graphIndex;
    private constructor();
    static getInstance(): GameStore;
    getState(): NormalizedState;
    getGlobalState(): GlobalState;
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
    /** 세력 추가 — 모딩 핫 인젝션 [309] 및 런타임 세력 생성용. 인덱스 동기화 포함 */
    addFaction(faction: Faction): void;
    /** 도시 추가 — 모딩 핫 인젝션 [309] 및 런타임 도시 생성용. 인덱스 동기화 포함 */
    addCity(city: City): void;
    removeOfficer(id: OfficerID): void;
    /** 세력 제거 — 멸망 처리용. 소속 도시 무주화 + 무장/인덱스 정리 [213] */
    removeFaction(id: FactionID): void;
    addRelationship(edge: RelationshipEdge): void;
    /** RelationshipEdge → 그래프 인덱스 에지 동기화 */
    private syncGraphIndex;
    /**
     * 파생 관계망 그래프 인덱스 접근자 — 성능 민감 경로(관계망 뷰어, AI 등용 판정)용.
     * 세이브 복원 등 대량 변경 후에는 rebuildGraphIndex() 호출 필요.
     */
    getGraphIndex(): TriStateGraphDatabase;
    /** 전체 관계를 그래프 인덱스에 재구축 — 월드 초기화/세이브 복원 후 호출 */
    rebuildGraphIndex(): void;
    setGlobalState(updates: Partial<GlobalState>): void;
    advanceTime(): void;
    setPhase(phase: GamePhase): void;
    createSnapshot(): NormalizedState;
    restoreSnapshot(snapshot: NormalizedState): void;
    subscribe(listener: StoreListener): () => void;
    private notify;
    dispatch(command: ICommand): import('./types.js').CommandResult;
    initWorld(officers: Officer[], factions: Faction[], cities: City[], armies: Army[]): void;
    getOfficersByFaction(factionId: FactionID): Officer[];
    getCitiesByFaction(factionId: FactionID): City[];
    getOfficersByCity(cityId: CityID): Officer[];
    getAllOfficers(): Officer[];
    getAllFactions(): Faction[];
    getAllCities(): City[];
}
export declare const gameStore: GameStore;
export { GameStore };
//# sourceMappingURL=game_store.d.ts.map