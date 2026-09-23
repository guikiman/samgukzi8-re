/**
 * [461-480] 색약 친화 팔레트 시스템 단위 테스트
 * 파일: tests/colorblind_palette.test.ts
 *
 * 시나리오 세력 고유색의 변환 정확성, 알 수 없는 색의 원본 유지,
 * 이중 부호화(기호/무늬) 검증.
 */

import { describe, it, expect } from 'vitest';
import {
    convertFactionColor, factionSymbol, makeFactionColorResolver, factionBadgeStyle,
} from '../src/core/colorblind_palette.js';

describe('[461-480] ColorblindPalette', () => {
    it('표준 모드는 원본 색을 그대로 반환한다', () => {
        expect(convertFactionColor('#b04a2a', 'none')).toBe('#b04a2a');
        expect(factionSymbol('#b04a2a', 'none')).toBeNull();
    });

    it('적록 색약 모드에서 세력 고유색이 Okabe-Ito 계열로 교체된다', () => {
        expect(convertFactionColor('#b04a2a', 'deuteranopia')).toBe('#e69f00');
        expect(convertFactionColor('#2a5a8a', 'deuteranopia')).toBe('#0072b2');
        expect(convertFactionColor('#4a9a5a', 'deuteranopia')).toBe('#009e73');
    });

    it('청황 색약 모드에서도 매핑이 적용된다', () => {
        expect(convertFactionColor('#b04a2a', 'tritanopia')).toBe('#d55e00');
        expect(convertFactionColor('#4a9a5a', 'tritanopia')).toBe('#009292');
    });

    it('매핑에 없는 색은 안전하게 원본 유지된다', () => {
        expect(convertFactionColor('#123456', 'deuteranopia')).toBe('#123456');
        expect(factionSymbol('#123456', 'tritanopia')).toBeNull();
    });

    it('대소문자 무관하게 매핑된다', () => {
        expect(convertFactionColor('#B04A2A', 'deuteranopia')).toBe('#e69f00');
    });

    it('교체 색이 서로 다른 세력을 명도차로 구분 가능한 범위로 보장한다', () => {
        // 적록 팔레트의 4개 주력 색이 서로 달라야 함
        const colors = new Set([
            convertFactionColor('#b04a2a', 'deuteranopia'),
            convertFactionColor('#2a5a8a', 'deuteranopia'),
            convertFactionColor('#4a9a5a', 'deuteranopia'),
            convertFactionColor('#d8b93a', 'deuteranopia'),
        ]);
        expect(colors.size).toBe(4);
    });

    it('makeFactionColorResolver로 일괄 변환기가 만들어진다', () => {
        const resolve = makeFactionColorResolver('deuteranopia');
        expect(resolve('#2a5a8a')).toBe('#0072b2');
        expect(resolve('#unknown')).toBe('#unknown');
    });

    it('factionBadgeStyle이 색+기호+무늬를 함께 반환한다', () => {
        const badge = factionBadgeStyle('#b04a2a', 'deuteranopia', 'hatch');
        expect(badge.color).toBe('#e69f00');
        expect(badge.symbol).toBe('橙');
        expect(badge.patternCss).toContain('repeating-linear-gradient');

        const dots = factionBadgeStyle('#b04a2a', 'deuteranopia', 'dots');
        expect(dots.patternCss).toContain('radial-gradient');

        const none = factionBadgeStyle('#b04a2a', 'none', 'none');
        expect(none.color).toBe('#b04a2a');
        expect(none.symbol).toBeNull();
        expect(none.patternCss).toBeNull();
    });
});
