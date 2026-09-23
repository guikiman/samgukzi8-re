/**
 * [Phase 20] 첩보의 예술 + [Phase 25] 동적 내러티브 + [321] 기후
 * 파일: src/core/intelligence_narrative_climate.ts
 *
 * 설계 스펙:
 * - [341-360] 첩보 네트워크, 위조 문서 — intelligence_manager.py 포팅
 * - [441-460] 내러티브 기록, 나비 효과 추적 — narrative_manager.py 포팅
 * - [321-340] 지역 기후 상태 갱신 — climate_manager.py 포팅
 *
 * Python 원본: src/systems/intelligence_manager.py, narrative_manager.py, climate_manager.py
 */
import type { FactionID, CityID } from './types.js';
export interface IntelligenceNetwork {
    readonly factionId: FactionID;
    readonly cityId: CityID;
    readonly level: number;
    readonly builtAtTurn: number;
}
export interface ForgedDocumentResult {
    readonly success: boolean;
    readonly documentId: string;
    readonly detectionRisk: number;
}
export declare class IntelligenceManager {
    private networks;
    private forgedDocs;
    private docSeq;
    private static readonly MAX_NETWORK_LEVEL;
    /**
     * 첩보망 구축/강화 — 동일 세력+도시는 레벨업 처리
     */
    buildNetwork(factionId: FactionID, cityId: CityID, turn?: number): IntelligenceNetwork;
    /**
     * 도시에 설치된 첩보망 조회 (타 세력 것 포함)
     */
    getNetworksInCity(cityId: CityID): IntelligenceNetwork[];
    getNetwork(factionId: FactionID, cityId: CityID): IntelligenceNetwork | null;
    /**
     * [352] 위조 문서 작성 — 첩보망 레벨이 높을수록 성공률/발각률 개선
     */
    forgeDocument(targetFaction: FactionID, intelLevel?: number): ForgedDocumentResult;
    getForgedDocumentCount(): number;
    /** 전체 첩보망 조회 — 월간 유지비 처리용 */
    getAllNetworks(): readonly IntelligenceNetwork[];
    /**
     * 첩보망 피로도 감소 — [346] 유지 소모. 월간 틱에서 호출.
     * 피로도(level)가 0 이하로 떨어지면 첩보망이 붕괴(제거)된다.
     * @returns 생존한 첩보망 (붕괴/부재 시 null)
     */
    decayNetworks(factionId: FactionID, cityId: CityID, amount: number): IntelligenceNetwork | null;
    /** 첩보망 직렬화 — 세이브 포함 [17] */
    serializeNetworks(): Array<{
        factionId: FactionID;
        cityId: CityID;
        level: number;
        builtAtTurn: number;
    }>;
    /** 첩보망 복원 — 세이브 로드 (빈 배열이면 초기화 상태 유지) */
    restoreNetworks(data: Array<{
        factionId: FactionID;
        cityId: CityID;
        level: number;
        builtAtTurn: number;
    }>): void;
}
export interface NarrativeEvent {
    readonly id: number;
    readonly description: string;
    readonly recordedAt: number;
}
export interface ButterflyEffect {
    readonly id: number;
    readonly cause: string;
    readonly effect: string;
    readonly recordedAt: number;
}
export declare class NarrativeManager {
    private events;
    private butterflyEffects;
    private seq;
    /** 연대기에 사건 기록 */
    recordEvent(eventDescription: string, at?: number): NarrativeEvent;
    /**
     * 나비 효과 추적 — 작은 원인이 이후 역사 분기로 이어진 사실을 기록
     * (예: "삼고초려" → "천하 삼분지일")
     */
    trackButterflyEffect(cause: string, effect: string, at?: number): ButterflyEffect;
    getEvents(): readonly NarrativeEvent[];
    getButterflyEffects(): readonly ButterflyEffect[];
    clear(): void;
}
export type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'SNOW' | 'FOG' | 'HEATWAVE';
export interface LocalClimate {
    readonly regionId: string;
    weather: WeatherType;
    temperature: number;
    harvestModifier: number;
}
export declare class ClimateManager {
    private climates;
    constructor();
    /** 특정 지역 날씨 갱신 — [321-340] 계절 전환 연동 */
    updateClimate(regionId: string, newWeather: WeatherType, temperature?: number): LocalClimate | null;
    getClimate(regionId: string): LocalClimate | null;
    getAllClimates(): readonly LocalClimate[];
    /** 날씨 → 수확 보정 매핑 (월간 보고서 기후 시각화용 public) */
    static weatherToHarvest(weather: WeatherType): number;
}
export interface EnmityRecord {
    readonly targetId: string;
    readonly enemyId: string;
    readonly intensity: number;
    readonly registeredAt: number;
}
/**
 * SocialInteractionManager — 원수/원한 등록 및 조회
 * Python 원본: src/systems/social_interaction.py (add_enmity)
 * 복수(vendetta) 시스템과 연동
 */
export declare class SocialInteractionManager {
    private enmities;
    /** 원수 관계 등록 — 동일 대상 중복 등록 시 강도 누적 (최대 100) */
    addEnmity(targetId: string, enemyId: string, intensity?: number): EnmityRecord;
    /** 복수 대상 조회 — 강도 내림차순 */
    getEnemiesOf(targetId: string): EnmityRecord[];
    hasEnmity(a: string, b: string): boolean;
}
export interface ClearReward {
    readonly endingId: string;
    readonly bonusType: 'STAT_BOOST' | 'UNLOCK_SCENARIO' | 'UNLOCK_ITEM' | 'TITLE';
    readonly value: string;
}
/**
 * SaveRewardManager — 클리어 데이터에 따른 주차 보상 지급
 * Python 원본: src/systems/save_manager.py (apply_clear_rewards)
 */
export declare class SaveRewardManager {
    private claimedRewards;
    /**
     * 클리어 보상 지급 — 엔딩 ID 기반 주차 보상 테이블
     */
    applyClearRewards(endingId: string, playthroughTag?: string): ClearReward[];
    getClaimedRewards(playthroughTag: string): readonly ClearReward[];
}
//# sourceMappingURL=intelligence_narrative_climate.d.ts.map