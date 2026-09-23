import { describe, it, expect, beforeEach } from 'vitest';
import {
    StrategicCommandManager,
    StrategicPolicy,
    type ArmyUnit,
    type IPolicyBridge,
} from '../src/core/strategic_command_system';
import { LifeSimulator } from '../src/core/life_simulator';
import { LegacyManager, MetaManager, MetaDataManager } from '../src/core/meta_systems';
import {
    IntelligenceManager,
    NarrativeManager,
    ClimateManager,
    SocialInteractionManager,
    SaveRewardManager,
} from '../src/core/intelligence_narrative_climate';

// ============================================================
// [76-85] 전략 커맨드 시스템 테스트
// ============================================================

describe('StrategicCommandManager', () => {
    let manager: StrategicCommandManager;
    const army: ArmyUnit = {
        leaderId: 'off_1',
        officerIds: ['off_1', 'off_2'],
        soldiers: 5000,
        training: 80,
        morale: 70,
        formation: 'basic',
    };

    beforeEach(() => {
        manager = new StrategicCommandManager('faction_cao');
    });

    it('should consume strategy points', () => {
        expect(manager.consumePoints(50)).toBe(true);
        expect(manager.getStrategyPoints()).toBe(50);
    });

    it('should reject points beyond available budget', () => {
        expect(manager.consumePoints(101)).toBe(false);
        expect(manager.getStrategyPoints()).toBe(100);
    });

    it('should order a campaign costing 20 points [77]', () => {
        const before = manager.getStrategyPoints();
        expect(manager.orderCampaign(army, 'city_xu')).toBe(true);
        expect(manager.getStrategyPoints()).toBe(before - 20);
        expect(manager.getActiveCampaigns()).toHaveLength(1);
    });

    it('should reject campaign without soldiers', () => {
        const empty = { ...army, soldiers: 0 };
        expect(manager.orderCampaign(empty, 'city_xu')).toBe(false);
    });

    it('should order transport costing 10 points [78]', () => {
        const before = manager.getStrategyPoints();
        expect(manager.orderTransport('city_xu', 'city_ye', 200, 1000, 0)).toBe(true);
        expect(manager.getStrategyPoints()).toBe(before - 10);
    });

    it('should reject negative transport amounts', () => {
        expect(manager.orderTransport('city_xu', 'city_ye', -5, 0, 0)).toBe(false);
    });

    it('should set delegation policy via bridge [80]', () => {
        const calls: Array<{ faction: string; viceroy: string; policy: string }> = [];
        const bridge: IPolicyBridge = {
            setFactionPolicy(faction, viceroy, policy) {
                calls.push({ faction, viceroy, policy });
            },
        };
        manager.setDelegationPolicy('off_9', StrategicPolicy.DEFENSE, bridge);
        expect(manager.getDelegationPolicy('off_9')).toBe(StrategicPolicy.DEFENSE);
        expect(calls).toHaveLength(1);
        expect(calls[0].policy).toBe('defense');
    });

    it('should cancel campaign', () => {
        manager.orderCampaign(army, 'city_xu');
        expect(manager.cancelCampaign('city_xu', 'off_1')).toBe(true);
        expect(manager.getActiveCampaigns()).toHaveLength(0);
        expect(manager.cancelCampaign('city_xu', 'off_1')).toBe(false);
    });

    it('should disband vagrant army [83]', () => {
        manager.orderCampaign(army, 'city_xu');
        manager.orderTransport('city_xu', 'city_ye', 100, 100, 0);
        manager.disbandVagrantArmy();
        expect(manager.getActiveCampaigns()).toHaveLength(0);
        expect(manager.getTransportOrders()).toHaveLength(0);
    });

    it('should return formation bonuses [85]', () => {
        expect(manager.getFormationBonus('wedge').attack).toBeGreaterThan(1);
        expect(manager.getFormationBonus('square').defense).toBeGreaterThan(1);
    });

    it('should regen points on turn processing', () => {
        manager.consumePoints(100);
        expect(manager.getStrategyPoints()).toBe(0);
        manager.processTurn();
        expect(manager.getStrategyPoints()).toBe(20);
    });
});

// ============================================================
// [421-438] 인생 시뮬레이터 테스트
// ============================================================

describe('LifeSimulator', () => {
    let sim: LifeSimulator;

    beforeEach(() => {
        sim = new LifeSimulator();
    });

    it('should apply and query scars [421]', () => {
        sim.applyScar('off_1', 'ARM', 196, 2);
        expect(sim.hasScar('off_1', 'ARM')).toBe(true);
        expect(sim.getScars('off_1')).toHaveLength(1);
    });

    it('should compute scar penalties by type [421]', () => {
        sim.applyScar('off_1', 'ARM', 196, 2);
        const pen = sim.getScarPenalties('off_1');
        expect(pen.STR).toBe(-6); // 3 * severity(2)
        expect(pen.INT).toBe(0);
    });

    it('should craft weapon when gold sufficient [422]', () => {
        const weapon = sim.craftWeapon('off_1', 1000, 196);
        expect(weapon).not.toBeNull();
        expect(weapon!.attackBonus).toBe(7); // 5 + floor(1000/500)
        expect(sim.getWeapons('off_1')).toHaveLength(1);
    });

    it('should reject forging without enough gold [422]', () => {
        expect(sim.craftWeapon('off_1', 100)).toBeNull();
    });

    it('should reject mentorship when master lacks skill [438]', () => {
        expect(sim.masterSkill('off_2', 'off_1', 'MARTIAL')).toBeNull();
        expect(sim.getMentorships('off_2')).toHaveLength(0);
    });

    it('should form mentorship and transfer mastery [438]', () => {
        // 스승 숙련 부여 (세이브 로드 복원 시나리오)
        sim.grantMastery('off_1', 'MARTIAL', 50);
        const record = sim.masterSkill('off_2', 'off_1', 'MARTIAL');
        expect(record).not.toBeNull();
        expect(record!.masteryGain).toBe(10); // floor(50 * 0.2)
        expect(sim.getMastery('off_2', 'MARTIAL')).toBe(10);
        expect(sim.getMentorships('off_2')).toHaveLength(1);
    });

    it('should retire officers at proper age [434]', () => {
        expect(sim.canRetire('off_1', 65)).toBe(true);
        expect(sim.canRetire('off_1', 40)).toBe(false);
        sim.retire('off_1', 210);
        expect(sim.isRetired('off_1')).toBe(true);
        expect(sim.canRetire('off_1', 70)).toBe(false); // 이미 은퇴
    });
});

// ============================================================
// [213-214, 431-432] 메타/상속 시스템 테스트
// ============================================================

describe('MetaManager', () => {
    let meta: MetaManager;

    beforeEach(() => {
        meta = new MetaManager();
        meta.reset();
    });

    it('should unlock achievement once [213]', () => {
        meta.registerAchievement('ach_1', '최초 통일', '전국 통일 달성');
        expect(meta.unlockAchievement('ach_1')).toBe(true);
        expect(meta.unlockAchievement('ach_1')).toBe(false); // 중복 해금 방지
        expect(meta.isAchievementUnlocked('ach_1')).toBe(true);
        expect(meta.getUnlockedAchievements()).toHaveLength(1);
    });

    it('should reject unknown achievement', () => {
        expect(meta.unlockAchievement('nonexistent')).toBe(false);
    });

    it('should record each ending once [214]', () => {
        expect(meta.triggerEnding('UNIFICATION', 'pt1')).toBe(true);
        expect(meta.triggerEnding('UNIFICATION', 'pt1')).toBe(false);
        expect(meta.hasEnding('UNIFICATION')).toBe(true);
        expect(meta.getCompletedEndings()).toHaveLength(1);
    });
});

describe('LegacyManager', () => {
    let legacy: LegacyManager;

    beforeEach(() => {
        legacy = new LegacyManager();
    });

    it('should inherit heirloom with lineage [431]', () => {
        legacy.registerHeirloom('h_1', '청강검', 'off_cao');
        const result = legacy.inheritHeirloom('h_1', 'off_pi');
        expect(result).not.toBeNull();
        expect(result!.ownerId).toBe('off_pi');
        expect(result!.lineage).toEqual(['off_pi', 'off_cao']);
    });

    it('should return null for unknown heirloom', () => {
        expect(legacy.inheritHeirloom('ghost', 'off_x')).toBeNull();
    });

    it('should transfer all heirlooms on death [431]', () => {
        legacy.registerHeirloom('h_1', '청강검', 'off_cao');
        legacy.registerHeirloom('h_2', '적토마 안장', 'off_cao');
        const transferred = legacy.transferAllHeirlooms('off_cao', 'off_pi');
        expect(transferred).toHaveLength(2);
        expect(legacy.getHeirloomsOwnedBy('off_cao')).toHaveLength(0);
    });

    it('should prefer legitimate child for succession [432]', () => {
        legacy.addBloodRelation('off_cao', 'off_pi', false);   // 적자
        legacy.addBloodRelation('off_cao', 'off_chong', true); // 사생아
        expect(legacy.getSuccessionCandidate('off_cao')).toBe('off_pi');
    });
});

describe('MetaDataManager', () => {
    it('should override faction names', () => {
        const mdm = new MetaDataManager();
        mdm.setFactionName('faction_wei', '위나라(커스텀)');
        expect(mdm.getFactionName('faction_wei', '위')).toBe('위나라(커스텀)');
        expect(mdm.getFactionName('faction_shu', '촉')).toBe('촉');
    });

    it('should stack weapon modifiers', () => {
        const mdm = new MetaDataManager();
        mdm.applyWeaponModifier('w_1', '연마', 5);
        const m = mdm.applyWeaponModifier('w_1', '보강', 3);
        expect(m.attackDelta).toBe(8);
        expect(m.modifier).toBe('연마+보강');
    });
});

// ============================================================
// [341-360, 441-460, 321-340] 첩보/내러티브/기후 테스트
// ============================================================

describe('IntelligenceManager', () => {
    let intel: IntelligenceManager;

    beforeEach(() => {
        intel = new IntelligenceManager();
    });

    it('should build network and upgrade on repeat [341]', () => {
        const n1 = intel.buildNetwork('faction_cao', 'city_xu');
        expect(n1.level).toBe(1);
        const n2 = intel.buildNetwork('faction_cao', 'city_xu');
        expect(n2.level).toBe(2);
        expect(intel.getNetwork('faction_cao', 'city_xu')!.level).toBe(2);
    });

    it('should cap network level at 5', () => {
        for (let i = 0; i < 10; i++) intel.buildNetwork('faction_cao', 'city_xu');
        expect(intel.getNetwork('faction_cao', 'city_xu')!.level).toBe(5);
    });

    it('should forge documents probabilistically [352]', () => {
        const result = intel.forgeDocument('faction_shu', 5);
        expect(result.documentId).toContain('forged');
        expect(result.detectionRisk).toBeGreaterThanOrEqual(0);
    });
});

describe('NarrativeManager', () => {
    let narrative: NarrativeManager;

    beforeEach(() => {
        narrative = new NarrativeManager();
        narrative.clear();
    });

    it('should record events sequentially', () => {
        const e1 = narrative.recordEvent('삼고초려 발생');
        const e2 = narrative.recordEvent('적벽대전 개시');
        expect(e2.id).toBe(e1.id + 1);
        expect(narrative.getEvents()).toHaveLength(2);
    });

    it('should track butterfly effects [441-460]', () => {
        const b = narrative.trackButterflyEffect('유비가 촉에 입성', '천하 삼분지일');
        expect(b.cause).toContain('유비');
        expect(narrative.getButterflyEffects()).toHaveLength(1);
    });
});

describe('ClimateManager', () => {
    let climate: ClimateManager;

    beforeEach(() => {
        climate = new ClimateManager();
    });

    it('should initialize default regions', () => {
        expect(climate.getAllClimates().length).toBeGreaterThanOrEqual(4);
        expect(climate.getClimate('CENTRAL_PLAINS')).not.toBeNull();
    });

    it('should update weather and harvest modifier [321]', () => {
        const updated = climate.updateClimate('CENTRAL_PLAINS', 'STORM');
        expect(updated!.weather).toBe('STORM');
        expect(updated!.harvestModifier).toBe(0.5);
    });

    it('should return null for unknown region', () => {
        expect(climate.updateClimate('ATLANTIS', 'SUNNY')).toBeNull();
    });
});

describe('SocialInteractionManager', () => {
    let social: SocialInteractionManager;

    beforeEach(() => {
        social = new SocialInteractionManager();
    });

    it('should register enmity', () => {
        social.addEnmity('off_a', 'off_b', 40);
        expect(social.hasEnmity('off_a', 'off_b')).toBe(true);
        expect(social.getEnemiesOf('off_a')[0].enemyId).toBe('off_b');
    });

    it('should stack enmity intensity up to 100', () => {
        social.addEnmity('off_a', 'off_b', 60);
        const merged = social.addEnmity('off_a', 'off_b', 80);
        expect(merged.intensity).toBe(100); // min(100, 60+80)
    });

    it('should sort enemies by intensity', () => {
        social.addEnmity('off_a', 'weak_rival', 10);
        social.addEnmity('off_a', 'arch_rival', 90);
        expect(social.getEnemiesOf('off_a')[0].enemyId).toBe('arch_rival');
    });
});

describe('SaveRewardManager', () => {
    it('should grant clear rewards per ending', () => {
        const mgr = new SaveRewardManager();
        const rewards = mgr.applyClearRewards('UNIFICATION', 'pt1');
        expect(rewards).toHaveLength(1);
        expect(rewards[0].bonusType).toBe('UNLOCK_SCENARIO');
    });

    it('should not duplicate rewards within same playthrough', () => {
        const mgr = new SaveRewardManager();
        mgr.applyClearRewards('UNIFICATION', 'pt1');
        const again = mgr.applyClearRewards('UNIFICATION', 'pt1');
        expect(again).toHaveLength(0);
    });

    it('should return empty for unknown ending', () => {
        const mgr = new SaveRewardManager();
        expect(mgr.applyClearRewards('UNKNOWN_ENDING', 'pt1')).toHaveLength(0);
    });
});
