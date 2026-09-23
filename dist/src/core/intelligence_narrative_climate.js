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
export class IntelligenceManager {
    constructor() {
        this.networks = new Map(); // key: `${factionId}:${cityId}`
        this.forgedDocs = [];
        this.docSeq = 0;
    }
    /**
     * 첩보망 구축/강화 — 동일 세력+도시는 레벨업 처리
     */
    buildNetwork(factionId, cityId, turn = 0) {
        const key = `${factionId}:${cityId}`;
        const existing = this.networks.get(key);
        if (existing) {
            const upgraded = {
                ...existing,
                level: Math.min(IntelligenceManager.MAX_NETWORK_LEVEL, existing.level + 1),
            };
            this.networks.set(key, upgraded);
            return upgraded;
        }
        const network = { factionId, cityId, level: 1, builtAtTurn: turn };
        this.networks.set(key, network);
        return network;
    }
    /**
     * 도시에 설치된 첩보망 조회 (타 세력 것 포함)
     */
    getNetworksInCity(cityId) {
        return [...this.networks.values()].filter((n) => n.cityId === cityId);
    }
    getNetwork(factionId, cityId) {
        return this.networks.get(`${factionId}:${cityId}`) ?? null;
    }
    /**
     * [352] 위조 문서 작성 — 첩보망 레벨이 높을수록 성공률/발각률 개선
     */
    forgeDocument(targetFaction, intelLevel = 0) {
        const successChance = 0.4 + intelLevel * 0.12; // 최대 ~1.0
        const success = Math.random() < Math.min(0.95, successChance);
        const result = {
            success,
            documentId: `forged-${++this.docSeq}`,
            detectionRisk: success ? Math.max(0.05, 0.5 - intelLevel * 0.08) : 0,
        };
        this.forgedDocs.push(result);
        return result;
    }
    getForgedDocumentCount() {
        return this.forgedDocs.length;
    }
    /** 전체 첩보망 조회 — 월간 유지비 처리용 */
    getAllNetworks() {
        return [...this.networks.values()];
    }
    /**
     * 첩보망 피로도 감소 — [346] 유지 소모. 월간 틱에서 호출.
     * 피로도(level)가 0 이하로 떨어지면 첩보망이 붕괴(제거)된다.
     * @returns 생존한 첩보망 (붕괴/부재 시 null)
     */
    decayNetworks(factionId, cityId, amount) {
        const key = `${factionId}:${cityId}`;
        const existing = this.networks.get(key);
        if (!existing)
            return null;
        const remaining = existing.level - amount;
        if (remaining <= 0) {
            this.networks.delete(key);
            return null;
        }
        const decayed = { ...existing, level: remaining };
        this.networks.set(key, decayed);
        return decayed;
    }
    /** 첩보망 직렬화 — 세이브 포함 [17] */
    serializeNetworks() {
        return [...this.networks.values()].map((n) => ({
            factionId: n.factionId,
            cityId: n.cityId,
            level: n.level,
            builtAtTurn: n.builtAtTurn,
        }));
    }
    /** 첩보망 복원 — 세이브 로드 (빈 배열이면 초기화 상태 유지) */
    restoreNetworks(data) {
        this.networks = new Map(data.map((n) => [`${n.factionId}:${n.cityId}`, n]));
    }
}
IntelligenceManager.MAX_NETWORK_LEVEL = 5;
export class NarrativeManager {
    constructor() {
        this.events = [];
        this.butterflyEffects = [];
        this.seq = 0;
    }
    /** 연대기에 사건 기록 */
    recordEvent(eventDescription, at) {
        const event = {
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
    trackButterflyEffect(cause, effect, at) {
        const record = {
            id: ++this.seq,
            cause,
            effect,
            recordedAt: at ?? Date.now(),
        };
        this.butterflyEffects.push(record);
        return record;
    }
    getEvents() {
        return this.events;
    }
    getButterflyEffects() {
        return this.butterflyEffects;
    }
    clear() {
        this.events = [];
        this.butterflyEffects = [];
        this.seq = 0;
    }
}
export class ClimateManager {
    constructor() {
        this.climates = new Map();
        // 기본 지역 기후 초기화 — 중원/북방/남방 특성 반영
        const defaults = [
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
    updateClimate(regionId, newWeather, temperature) {
        const climate = this.climates.get(regionId);
        if (!climate)
            return null;
        const updated = {
            ...climate,
            weather: newWeather,
            temperature: temperature ?? climate.temperature,
            // 악천후일수록 수확 보정 감소
            harvestModifier: ClimateManager.weatherToHarvest(newWeather),
        };
        this.climates.set(regionId, updated);
        return updated;
    }
    getClimate(regionId) {
        return this.climates.get(regionId) ?? null;
    }
    getAllClimates() {
        return [...this.climates.values()];
    }
    /** 날씨 → 수확 보정 매핑 */
    static weatherToHarvest(weather) {
        switch (weather) {
            case 'SUNNY': return 1.2;
            case 'CLOUDY': return 1.0;
            case 'RAIN': return 0.9;
            case 'FOG': return 0.85;
            case 'STORM': return 0.5;
            case 'SNOW': return 0.6;
            case 'HEATWAVE': return 0.55;
        }
    }
}
/**
 * SocialInteractionManager — 원수/원한 등록 및 조회
 * Python 원본: src/systems/social_interaction.py (add_enmity)
 * 복수(vendetta) 시스템과 연동
 */
export class SocialInteractionManager {
    constructor() {
        this.enmities = [];
    }
    /** 원수 관계 등록 — 동일 대상 중복 등록 시 강도 누적 (최대 100) */
    addEnmity(targetId, enemyId, intensity = 30) {
        const existing = this.enmities.find((e) => e.targetId === targetId && e.enemyId === enemyId);
        if (existing) {
            const idx = this.enmities.indexOf(existing);
            const merged = {
                ...existing,
                intensity: Math.min(100, existing.intensity + intensity),
            };
            this.enmities[idx] = merged;
            return merged;
        }
        const record = {
            targetId, enemyId, intensity, registeredAt: Date.now(),
        };
        this.enmities.push(record);
        return record;
    }
    /** 복수 대상 조회 — 강도 내림차순 */
    getEnemiesOf(targetId) {
        return this.enmities
            .filter((e) => e.targetId === targetId)
            .sort((a, b) => b.intensity - a.intensity);
    }
    hasEnmity(a, b) {
        return this.enmities.some((e) => (e.targetId === a && e.enemyId === b) || (e.targetId === b && e.enemyId === a));
    }
}
/**
 * SaveRewardManager — 클리어 데이터에 따른 주차 보상 지급
 * Python 원본: src/systems/save_manager.py (apply_clear_rewards)
 */
export class SaveRewardManager {
    constructor() {
        this.claimedRewards = new Map(); // key: playthroughTag
    }
    /**
     * 클리어 보상 지급 — 엔딩 ID 기반 주차 보상 테이블
     */
    applyClearRewards(endingId, playthroughTag = 'default') {
        const rewardTable = {
            'UNIFICATION': [{ bonusType: 'UNLOCK_SCENARIO', value: 'ALL_SCENARIOS' }],
            'HEGEMON': [{ bonusType: 'STAT_BOOST', value: 'NEXT_PLAYTHROUGH_+10' }],
            'SAGE': [{ bonusType: 'UNLOCK_ITEM', value: 'TAOIST_SCROLL' }],
            'DEFAULT_DEATH': [{ bonusType: 'TITLE', value: '무명의 종장' }],
        };
        const rewards = (rewardTable[endingId] ?? []).map((r) => ({ ...r, endingId }));
        const claimed = this.claimedRewards.get(playthroughTag) ?? [];
        const newRewards = rewards.filter((r) => !claimed.some((c) => c.endingId === r.endingId && c.bonusType === r.bonusType));
        this.claimedRewards.set(playthroughTag, [...claimed, ...newRewards]);
        return newRewards;
    }
    getClaimedRewards(playthroughTag) {
        return this.claimedRewards.get(playthroughTag) ?? [];
    }
}
//# sourceMappingURL=intelligence_narrative_climate.js.map