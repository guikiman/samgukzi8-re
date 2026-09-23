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

// ============================================================
// 1. 첩보 네트워크 매니저
// ============================================================

export interface IntelligenceNetwork {
    readonly factionId: FactionID;      // 첩보망을 운영하는 세력
    readonly cityId: CityID;            // 첩보망이 설치된 도시
    readonly level: number;             // 첩보망 수준 (1~5)
    readonly builtAtTurn: number;
}

export interface ForgedDocumentResult {
    readonly success: boolean;
    readonly documentId: string;
    readonly detectionRisk: number;     // 0.0 ~ 1.0 발각 확률
}

export class IntelligenceManager {
    private networks: Map<string, IntelligenceNetwork> = new Map(); // key: `${factionId}:${cityId}`
    private forgedDocs: ForgedDocumentResult[] = [];
    private docSeq = 0;

    private static readonly MAX_NETWORK_LEVEL = 5;

    /**
     * 첩보망 구축/강화 — 동일 세력+도시는 레벨업 처리
     */
    buildNetwork(factionId: FactionID, cityId: CityID, turn = 0): IntelligenceNetwork {
        const key = `${factionId}:${cityId}`;
        const existing = this.networks.get(key);
        if (existing) {
            const upgraded: IntelligenceNetwork = {
                ...existing,
                level: Math.min(IntelligenceManager.MAX_NETWORK_LEVEL, existing.level + 1),
            };
            this.networks.set(key, upgraded);
            return upgraded;
        }
        const network: IntelligenceNetwork = { factionId, cityId, level: 1, builtAtTurn: turn };
        this.networks.set(key, network);
        return network;
    }

    /**
     * 도시에 설치된 첩보망 조회 (타 세력 것 포함)
     */
    getNetworksInCity(cityId: CityID): IntelligenceNetwork[] {
        return [...this.networks.values()].filter((n) => n.cityId === cityId);
    }

    getNetwork(factionId: FactionID, cityId: CityID): IntelligenceNetwork | null {
        return this.networks.get(`${factionId}:${cityId}`) ?? null;
    }

    /**
     * [352] 위조 문서 작성 — 첩보망 레벨이 높을수록 성공률/발각률 개선
     */
    forgeDocument(targetFaction: FactionID, intelLevel = 0): ForgedDocumentResult {
        const successChance = 0.4 + intelLevel * 0.12;   // 최대 ~1.0
        const success = Math.random() < Math.min(0.95, successChance);
        const result: ForgedDocumentResult = {
            success,
            documentId: `forged-${++this.docSeq}`,
            detectionRisk: success ? Math.max(0.05, 0.5 - intelLevel * 0.08) : 0,
        };
        this.forgedDocs.push(result);
        return result;
    }

    getForgedDocumentCount(): number {
        return this.forgedDocs.length;
    }

    /** 전체 첩보망 조회 — 월간 유지비 처리용 */
    getAllNetworks(): readonly IntelligenceNetwork[] {
        return [...this.networks.values()];
    }

    /**
     * 첩보망 피로도 감소 — [346] 유지 소모. 월간 틱에서 호출.
     * 피로도(level)가 0 이하로 떨어지면 첩보망이 붕괴(제거)된다.
     * @returns 생존한 첩보망 (붕괴/부재 시 null)
     */
    decayNetworks(factionId: FactionID, cityId: CityID, amount: number): IntelligenceNetwork | null {
        const key = `${factionId}:${cityId}`;
        const existing = this.networks.get(key);
        if (!existing) return null;
        const remaining = existing.level - amount;
        if (remaining <= 0) {
            this.networks.delete(key);
            return null;
        }
        const decayed: IntelligenceNetwork = { ...existing, level: remaining };
        this.networks.set(key, decayed);
        return decayed;
    }

    /** 첩보망 직렬화 — 세이브 포함 [17] */
    serializeNetworks(): Array<{ factionId: FactionID; cityId: CityID; level: number; builtAtTurn: number }> {
        return [...this.networks.values()].map((n) => ({
            factionId: n.factionId,
            cityId: n.cityId,
            level: n.level,
            builtAtTurn: n.builtAtTurn,
        }));
    }

    /** 첩보망 복원 — 세이브 로드 (빈 배열이면 초기화 상태 유지) */
    restoreNetworks(data: Array<{ factionId: FactionID; cityId: CityID; level: number; builtAtTurn: number }>): void {
        this.networks = new Map(data.map((n) => [`${n.factionId}:${n.cityId}`, n]));
    }
}

// ============================================================
// 2. 내러티브 매니저 — 사건 기록 및 나비 효과
// ============================================================

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

export class NarrativeManager {
    private events: NarrativeEvent[] = [];
    private butterflyEffects: ButterflyEffect[] = [];
    private seq = 0;

    /** 연대기에 사건 기록 */
    recordEvent(eventDescription: string, at?: number): NarrativeEvent {
        const event: NarrativeEvent = {
            id: ++this.seq,
            description: eventDescription,
            recordedAt: at ?? Date.now(),
        };
        this.events.push(event);
        return event;
    }

    /**
     * 나비 효과 추적 — 작은 원인이 이후 역사 분기로 이어진 사실을 기록
     * (예: "삼고초려" → "천하 삼분지일")
     */
    trackButterflyEffect(cause: string, effect: string, at?: number): ButterflyEffect {
        const record: ButterflyEffect = {
            id: ++this.seq,
            cause,
            effect,
            recordedAt: at ?? Date.now(),
        };
        this.butterflyEffects.push(record);
        return record;
    }

    getEvents(): readonly NarrativeEvent[] {
        return this.events;
    }

    getButterflyEffects(): readonly ButterflyEffect[] {
        return this.butterflyEffects;
    }

    clear(): void {
        this.events = [];
        this.butterflyEffects = [];
        this.seq = 0;
    }
}

// ============================================================
// 3. 기후 매니저 — 지역별 날씨/계절 상태
// ============================================================

export type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'SNOW' | 'FOG' | 'HEATWAVE';

export interface LocalClimate {
    readonly regionId: string;
    weather: WeatherType;
    temperature: number;        // 섭씨
    harvestModifier: number;    // 수확 보정 (0.5 ~ 1.5)
}

export class ClimateManager {
    private climates: Map<string, LocalClimate> = new Map();

    constructor() {
        // 기본 지역 기후 초기화 — 중원/북방/남방 특성 반영
        const defaults: Array<[string, WeatherType, number, number]> = [
            ['CENTRAL_PLAINS', 'SUNNY', 18, 1.0],
            ['NORTHERN_FRONTIER', 'SNOW', -5, 0.7],
            ['SOUTHERN_JUNGLE', 'RAIN', 26, 1.2],
            ['RIVERLANDS', 'CLOUDY', 15, 1.1],
        ];
        for (const [regionId, weather, temp, mod] of defaults) {
            this.climates.set(regionId, {
                regionId, weather, temperature: temp, harvestModifier: mod,
            });
        }
    }

    /** 특정 지역 날씨 갱신 — [321-340] 계절 전환 연동 */
    updateClimate(regionId: string, newWeather: WeatherType, temperature?: number): LocalClimate | null {
        const climate = this.climates.get(regionId);
        if (!climate) return null;
        const updated: LocalClimate = {
            ...climate,
            weather: newWeather,
            temperature: temperature ?? climate.temperature,
            // 악천후일수록 수확 보정 감소
            harvestModifier: ClimateManager.weatherToHarvest(newWeather),
        };
        this.climates.set(regionId, updated);
        return updated;
    }

    getClimate(regionId: string): LocalClimate | null {
        return this.climates.get(regionId) ?? null;
    }

    getAllClimates(): readonly LocalClimate[] {
        return [...this.climates.values()];
    }

    /** 날씨 → 수확 보정 매핑 (월간 보고서 기후 시각화용 public) */
    static weatherToHarvest(weather: WeatherType): number {
        switch (weather) {
            case 'SUNNY':   return 1.2;
            case 'CLOUDY':  return 1.0;
            case 'RAIN':    return 0.9;
            case 'FOG':     return 0.85;
            case 'STORM':   return 0.5;
            case 'SNOW':    return 0.6;
            case 'HEATWAVE': return 0.55;
        }
    }
}

// ============================================================
// 4. 사회적 상호작용 — 원수 관계 등록
// ============================================================

export interface EnmityRecord {
    readonly targetId: string;
    readonly enemyId: string;
    readonly intensity: number;   // 1 ~ 100
    readonly registeredAt: number;
}

/**
 * SocialInteractionManager — 원수/원한 등록 및 조회
 * Python 원본: src/systems/social_interaction.py (add_enmity)
 * 복수(vendetta) 시스템과 연동
 */
export class SocialInteractionManager {
    private enmities: EnmityRecord[] = [];

    /** 원수 관계 등록 — 동일 대상 중복 등록 시 강도 누적 (최대 100) */
    addEnmity(targetId: string, enemyId: string, intensity = 30): EnmityRecord {
        const existing = this.enmities.find(
            (e) => e.targetId === targetId && e.enemyId === enemyId,
        );
        if (existing) {
            const idx = this.enmities.indexOf(existing);
            const merged: EnmityRecord = {
                ...existing,
                intensity: Math.min(100, existing.intensity + intensity),
            };
            this.enmities[idx] = merged;
            return merged;
        }
        const record: EnmityRecord = {
            targetId, enemyId, intensity, registeredAt: Date.now(),
        };
        this.enmities.push(record);
        return record;
    }

    /** 복수 대상 조회 — 강도 내림차순 */
    getEnemiesOf(targetId: string): EnmityRecord[] {
        return this.enmities
            .filter((e) => e.targetId === targetId)
            .sort((a, b) => b.intensity - a.intensity);
    }

    hasEnmity(a: string, b: string): boolean {
        return this.enmities.some(
            (e) => (e.targetId === a && e.enemyId === b) || (e.targetId === b && e.enemyId === a),
        );
    }
}

// ============================================================
// 5. 클리어 보상 관리자
// ============================================================

export interface ClearReward {
    readonly endingId: string;
    readonly bonusType: 'STAT_BOOST' | 'UNLOCK_SCENARIO' | 'UNLOCK_ITEM' | 'TITLE';
    readonly value: string;
}

/**
 * SaveRewardManager — 클리어 데이터에 따른 주차 보상 지급
 * Python 원본: src/systems/save_manager.py (apply_clear_rewards)
 */
export class SaveRewardManager {
    private claimedRewards: Map<string, ClearReward[]> = new Map(); // key: playthroughTag

    /**
     * 클리어 보상 지급 — 엔딩 ID 기반 주차 보상 테이블
     */
    applyClearRewards(endingId: string, playthroughTag = 'default'): ClearReward[] {
        const rewardTable: Record<string, Omit<ClearReward, 'endingId'>[]> = {
            'UNIFICATION':  [{ bonusType: 'UNLOCK_SCENARIO', value: 'ALL_SCENARIOS' }],
            'HEGEMON':      [{ bonusType: 'STAT_BOOST', value: 'NEXT_PLAYTHROUGH_+10' }],
            'SAGE':         [{ bonusType: 'UNLOCK_ITEM', value: 'TAOIST_SCROLL' }],
            'DEFAULT_DEATH': [{ bonusType: 'TITLE', value: '무명의 종장' }],
        };

        const rewards = (rewardTable[endingId] ?? []).map((r) => ({ ...r, endingId }));
        const claimed = this.claimedRewards.get(playthroughTag) ?? [];
        const newRewards = rewards.filter(
            (r) => !claimed.some((c) => c.endingId === r.endingId && c.bonusType === r.bonusType),
        );
        this.claimedRewards.set(playthroughTag, [...claimed, ...newRewards]);
        return newRewards;
    }

    getClaimedRewards(playthroughTag: string): readonly ClearReward[] {
        return this.claimedRewards.get(playthroughTag) ?? [];
    }
}
