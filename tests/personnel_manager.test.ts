/**
 * personnel_manager.ts 단위 테스트
 *
 * [64-67] 등용/포상/몰수/해고, [68-69] 임명, [74-75] 계략, [150][159][351][352]
 * 결정적 PRNG 시드를 사용해 재현 가능하게 검증한다.
 */

import { describe, it, expect } from 'vitest';
import {
    PersonnelManager,
    SchemeManager,
    createSeededPRNG,
} from '../src/core/personnel_manager.js';

function setupPersonnel(seed = 42): PersonnelManager {
    const pm = new PersonnelManager(createSeededPRNG(seed));
    pm.registerOfficer({ id: 'guanyu', name: '관우', factionId: 'shu', loyalty: 90, rank: 'regular', items: ['청룡언월도'] });
    pm.registerOfficer({ id: 'zhangfei', name: '장비', factionId: 'shu', loyalty: 80, rank: 'regular', items: [] });
    pm.registerOfficer({ id: 'luxun', name: '육손', factionId: 'wu', loyalty: 60, rank: 'regular', items: [] });
    pm.registerOfficer({ id: 'chenzhen', name: '진진', factionId: null, loyalty: 50, rank: 'recluse', items: [] });
    return pm;
}

describe('PersonnelManager [64-69]', () => {
    it('getRecruitChance — 같은 세력은 0, 재야는 50, 타세력은 충성도 절반 차감', () => {
        const pm = setupPersonnel();
        expect(pm.getRecruitChance('zhangfei', 'shu')).toBe(0);        // 같은 세력
        expect(pm.getRecruitChance('chenzhen', 'shu')).toBe(50);       // 재야
        expect(pm.getRecruitChance('luxun', 'shu')).toBe(50 - 30);     // 충성도 60 → -30
    });

    it('recruit — 존재하지 않는 무장은 실패 메시지', () => {
        const pm = setupPersonnel();
        const result = pm.recruit('ruler1', 'ghost', 'shu');
        expect(result.success).toBe(false);
        expect(result.message).toContain('존재하지 않');
    });

    it('recruit — 성공 시 소속 변경 + 충성도/신분 초기화 (결정적 PRNG)', () => {
        const pm = setupPersonnel(1);
        // 재야 무장 등용 (chance 50) — 시드 1에서 몇 번 안에 성공하는지 확인
        let recruited = false;
        for (let i = 0; i < 100 && !recruited; i++) {
            const r = pm.recruit('ruler1', 'chenzhen', 'shu', 70);
            if (r.success) {
                recruited = true;
                expect(r.message).toContain('등용');
                const officer = pm.getOfficer('chenzhen');
                expect(officer?.factionId).toBe('shu');
                expect(officer?.loyalty).toBe(70);
                expect(officer?.rank).toBe('regular');
            } else {
                // 실패 시 소속 불변
                expect(pm.getOfficer('chenzhen')?.factionId).toBeNull();
            }
        }
        expect(recruited).toBe(true);
    });

    it('recruit — 타세력 충성도 90 무장은 거절 확률이 매우 높음 (100회 시도 실패 허용)', () => {
        const pm = setupPersonnel(7);
        let successes = 0;
        for (let i = 0; i < 100; i++) {
            if (pm.recruit('ruler1', 'guanyu', 'wei').success) successes++;
        }
        // chance = 50 - 45 = 5% → 100회 중 성공 기대 5회, 상한 완화 검증
        expect(successes).toBeLessThanOrEqual(30);
    });

    it('reward — 충성도 상승 (gold/100) 및 100 상한', () => {
        const pm = setupPersonnel();
        const r1 = pm.reward('zhangfei', 500);
        expect(r1.success).toBe(true);
        expect(r1.loyaltyGain).toBe(5);
        expect(pm.getOfficer('zhangfei')?.loyalty).toBe(85);

        const r2 = pm.reward('zhangfei', 99999);
        expect(pm.getOfficer('zhangfei')?.loyalty).toBe(100);
        expect(r2.success).toBe(true);
    });

    it('confiscate — 같은 세력만 가능, 아이템 몰수 + 충성도 30 하락', () => {
        const pm = setupPersonnel();
        const wrong = pm.confiscate('ruler_shu', 'luxun'); // 세력 데이터 없음
        expect(wrong.success).toBe(false);

        const ok = pm.confiscate('guanyu', 'zhangfei'); // 둘 다 shu
        expect(ok.success).toBe(true);
        expect(ok.confiscatedCount).toBe(0);
        expect(pm.getOfficer('zhangfei')?.loyalty).toBe(50);

        pm.registerOfficer({ id: 'owner', name: '소유자', factionId: 'shu', loyalty: 100, rank: 'regular', items: ['a', 'b', 'c'] });
        const r = pm.confiscate('guanyu', 'owner');
        expect(r.confiscatedCount).toBe(3);
        expect(pm.getOfficer('owner')?.items).toHaveLength(0);
    });

    it('dismiss — 재야화 + recluse 신분', () => {
        const pm = setupPersonnel();
        const r = pm.dismiss('guanyu', 'zhangfei');
        expect(r.success).toBe(true);
        const officer = pm.getOfficer('zhangfei');
        expect(officer?.factionId).toBeNull();
        expect(officer?.rank).toBe('recluse');
    });

    it('appoint — 군사/도독/태수 임명', () => {
        const pm = setupPersonnel();
        const r = pm.appoint('zhangfei', 'viceroy');
        expect(r.success).toBe(true);
        expect(pm.getOfficer('zhangfei')?.rank).toBe('viceroy');
        expect(pm.appoint('ghost', 'prefect').success).toBe(false);
    });
});

describe('SchemeManager [74-75][150][159][351][352]', () => {
    it('sabotage — 최소 투자금 미달 시 실패', () => {
        const sm = new SchemeManager(undefined, createSeededPRNG(42));
        const r = sm.sabotage('Luoyang', 99);
        expect(r.success).toBe(false);
        expect(r.message).toContain('100');
    });

    it('sabotage — 투자금에 비례한 성공 확률 (결정적)', () => {
        // investment 5000 → chance = min(70, 100) = 70%
        const sm = new SchemeManager(undefined, createSeededPRNG(3));
        let successes = 0;
        for (let i = 0; i < 1000; i++) {
            if (sm.sabotage('Xuchang', 5000).success) successes++;
        }
        // 기대 700회, 통계적 범위 검증
        expect(successes).toBeGreaterThan(600);
        expect(successes).toBeLessThan(800);
    });

    it('sowDiscord — 성공 시 대상 충성도 20 하락', () => {
        const pm = setupPersonnel(5);
        const sm = new SchemeManager(pm, createSeededPRNG(5));
        const before = pm.getOfficer('luxun')?.loyalty ?? 0;
        let dropped = false;
        for (let i = 0; i < 200 && !dropped; i++) {
            const r = sm.sowDiscord('luxun', 1000);
            if (r.success) {
                dropped = true;
                expect(r.loyaltyDrop).toBe(20);
                expect(pm.getOfficer('luxun')?.loyalty).toBe(Math.max(0, before - 20));
            }
        }
        expect(dropped).toBe(true);
    });

    it('plantSpy — 30% 확률 (결정적 PRNG 통계 검증)', () => {
        const sm = new SchemeManager(undefined, createSeededPRNG(11));
        let successes = 0;
        for (let i = 0; i < 1000; i++) {
            if (sm.plantSpy('spy1').success) successes++;
        }
        expect(successes).toBeGreaterThan(200);
        expect(successes).toBeLessThan(400);
    });

    it('spreadRumor / hireBarbarianMercenary / acceptExileGovernment', () => {
        const sm = new SchemeManager();
        expect(sm.spreadRumor('wu', '가짜 후방 침공 소문').success).toBe(true);
        expect(sm.hireBarbarianMercenary('shu', 'nanman')).toBe(true);
        expect(sm.hireBarbarianMercenary('', '')).toBe(false);
        expect(sm.acceptExileGovernment('shu', 'wu')).toBe(true);
        expect(sm.acceptExileGovernment('shu', 'shu')).toBe(false);
    });
});
