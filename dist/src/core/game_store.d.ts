/**
 * 삼국지 8 리메이크 — 싱글톤 중앙 상태 저장소
 * 파일: src/core/game_store.ts
 *
 * 정규화 상태 트리 (Normalized State Tree)
 * 모든 엔티티를 1차원 테이블로 정규화하여 O(1) 조회 보장
 * Redux 스타일 구독 + 디스패치
 */
import { IGameStore, NormalizedState, GlobalState, Officer, Faction, City, Army, RelationshipEdge, OfficerID, FactionID, CityID, ArmyID, ICommand, GamePhase } from './types.js';
type StoreListener = (state: NormalizedState, globalState: GlobalState) => void;
declare class GameStore implements IGameStore {
    private state;
    private globalState;
    private listeners;
    private static instance;
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
    removeOfficer(id: OfficerID): void;
    /** 세력 제거 — 멸망 처리용. 소속 도시 무주화 + 무장/인덱스 정리 [213] */
    removeFaction(id: FactionID): void;
    addRelationship(edge: RelationshipEdge): void;
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