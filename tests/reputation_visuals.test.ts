import { describe, it, expect } from 'vitest';
import {
    getLeaderReputationVisual,
    getOfficerReputationVisual,
    renderReputationChip,
} from '../src/core/reputation_visuals.js';

describe('평판 시각화 [11][27]', () => {
    it('시나리오 군주 초기 명성 500 → 仁德', () => {
        const vis = getLeaderReputationVisual({ fame: 500, infamy: 0 });
        expect(vis.label).toBe('仁德');
        expect(vis.icon).toBe('✨');
        expect(vis.color).toBe('#4caf50');
    });

    it('처형으로 악명이 쌓이면 등급이 하락한다', () => {
        // 500 - 30*2 = 440 → 仁德 유지
        expect(getLeaderReputationVisual({ fame: 500, infamy: 30 }).label).toBe('仁德');
        // 500 - 100*2 = 300 → 名聲
        expect(getLeaderReputationVisual({ fame: 500, infamy: 100 }).label).toBe('名聲');
    });

    it('악명이 명성을 역전하면 暴君', () => {
        const vis = getLeaderReputationVisual({ fame: 100, infamy: 200 });
        expect(vis.label).toBe('暴君');
        expect(vis.color).toBe('#e05a5a');
    });

    it('중간 구간은 平凡', () => {
        expect(getLeaderReputationVisual({ fame: 150, infamy: 0 }).label).toBe('平凡');
    });

    it('null/undefined는 무명 처리', () => {
        expect(getLeaderReputationVisual(null).label).toBe('무명');
        expect(getLeaderReputationVisual(undefined).label).toBe('무명');
    });

    it('무장 개인 평판: 명사/흉명 구분', () => {
        expect(getOfficerReputationVisual({ fame: 420, infamy: 0 }).label).toBe('天下');
        expect(getOfficerReputationVisual({ fame: 300, infamy: 0 }).label).toBe('名士');
        expect(getOfficerReputationVisual({ fame: 50, infamy: 120 }).label).toBe('凶名');
        expect(getOfficerReputationVisual({ fame: 50, infamy: 0 }).label).toBe('무명');
    });

    it('칩 HTML에 색상과 라벨이 반영된다', () => {
        const chip = renderReputationChip(getLeaderReputationVisual({ fame: 500, infamy: 0 }));
        expect(chip).toContain('#4caf50');
        expect(chip).toContain('仁德');
    });
});
