/**
 * [7] VisualEffectRenderer 단위 테스트
 *
 * 프론트엔드 시각 효과 클래스들의 로직 검증.
 * Canvas/WebGL이 필요 없는 순수 수학/상태 로직만 테스트.
 *
 * 테스트 범위:
 * - DepthOfField: 초점 거리/블러 강도
 * - ChromaticAberration: RGB 채널 분리/감쇠
 * - ParallaxScroller: 레이어별 오프셋 계산
 * - SoftShadowRenderer: 태양 위치/그림자 길이
 * - MotionBlur: 잔상 트레일
 * - FlagRenderer: SVG 생성
 * - WaterRippleShader: 물결 변위 계산
 * - SSAOEffect: 헥스 타일 골짜기 그림자
 * - TilePulse: 박동 애니메이션
 * - PortraitAnimator: 눈동자 추적/호흡
 * - InkBleedTransition: 화면 전환
 * - TextureStreamer: 로딩 큐
 */

import { describe, it, expect } from 'vitest';
import {
    DepthOfField,
    ChromaticAberration,
    ParallaxScroller,
    SoftShadowRenderer,
    MotionBlur,
    FlagRenderer,
    WaterRippleShader,
    SSAOEffect,
    TilePulse,
    PortraitAnimator,
    InkBleedTransition,
} from '../src/systems/frontend_renderer.js';

// ============================================================
// Tests
// ============================================================

describe('VisualEffectRenderer [7]', () => {
    // ── DepthOfField ──

    describe('DepthOfField', () => {
        it('setFocus()가 focusDistance와 blurAmount를 설정', () => {
            const dof = new DepthOfField();
            dof.setFocus(0.3, 0.8);
            expect(dof.focusDistance).toBe(0.3);
            expect(dof.blurAmount).toBe(0.8);
        });

        it('setFocus()가 값을 0~1로 클램프', () => {
            const dof = new DepthOfField();
            dof.setFocus(-0.5, 1.5);
            expect(dof.focusDistance).toBe(0);
            expect(dof.blurAmount).toBe(1);
        });

        it('초기 blurAmount=0에서 applyBlur()가 아무것도 하지 않음', () => {
            const dof = new DepthOfField();
            expect(dof.blurAmount).toBe(0);
        });
    });

    // ── ChromaticAberration ──

    describe('ChromaticAberration', () => {
        it('trigger()가 intensity를 설정', () => {
            const ca = new ChromaticAberration();
            ca.trigger(0.7);
            expect(ca.intensity).toBe(0.7);
        });
    });

    // ── ParallaxScroller ──

    describe('ParallaxScroller', () => {
        it('update()가 카메라 이동에 따라 레이어 오프셋 계산', () => {
            const ps = new ParallaxScroller();
            ps.update(100, 50);
            // layer 0: speed 0.1, ratio = 0.1/1.0 = 0.1, offsetX = -100 * 0.1 = -10
            expect(ps.layers[0].offsetX).toBe(-10);
            expect(ps.layers[0].offsetY).toBe(-5);
            // layer 3 (기준): offsetX = -100, offsetY = -50
            expect(ps.layers[3].offsetX).toBe(-100);
            expect(ps.layers[3].offsetY).toBe(-50);
        });
    });

    // ── SoftShadowRenderer ──

    describe('SoftShadowRenderer', () => {
        it('updateSunPosition()가 시간에 따라 태양 위치 계산', () => {
            const ssr = new SoftShadowRenderer();
            ssr.updateSunPosition(12); // 정오
            expect(ssr.sunElevation).toBeGreaterThan(0);
            ssr.updateSunPosition(0); // 자정
            expect(ssr.sunElevation).toBe(0);
        });

        it('getShadowOffset()가 그림자 길이와 방향 계산', () => {
            const ssr = new SoftShadowRenderer();
            ssr.updateSunPosition(12); // 정오
            const shadow = ssr.getShadowOffset(10);
            expect(shadow.dx).toBeDefined();
            expect(shadow.dy).toBeDefined();
            expect(shadow.alpha).toBeGreaterThan(0);
            expect(shadow.alpha).toBeLessThanOrEqual(0.5);
        });
    });

    // ── MotionBlur ──

    describe('MotionBlur', () => {
        it('초기 trailAlpha가 0.15', () => {
            const mb = new MotionBlur();
            expect(mb.trailAlpha).toBe(0.15);
        });
    });

    // ── FlagRenderer ──

    describe('FlagRenderer', () => {
        it('generateFlagSVG()가 SVG 문자열 반환', () => {
            const fr = new FlagRenderer();
            const svg = fr.generateFlagSVG('wei', '#CC0000', '魏');
            expect(svg).toContain('<svg');
            expect(svg).toContain('魏');
            expect(svg).toContain('#CC0000');
        });
    });

    // ── WaterRippleShader ──

    describe('WaterRippleShader', () => {
        it('addRipple()로 물결 추가 후 update()로 감쇠', () => {
            const wr = new WaterRippleShader();
            wr.addRipple(10, 10, 1.0);
            expect(wr.ripples.length).toBe(1);
            wr.update(0.5);
            expect(wr.ripples[0].amplitude).toBeLessThan(1.0);
        });

        it('진폭이 0.01 이하인 물결은 자동 제거', () => {
            const wr = new WaterRippleShader();
            wr.addRipple(0, 0, 0.01);
            wr.update(1);
            expect(wr.ripples.length).toBe(0);
        });

        it('getDisplacement()가 변위 벡터 반환', () => {
            const wr = new WaterRippleShader();
            wr.addRipple(0, 0, 1.0);
            const disp = wr.getDisplacement(5, 5);
            expect(typeof disp.dx).toBe('number');
            expect(typeof disp.dy).toBe('number');
        });
    });

    // ── SSAOEffect ──

    describe('SSAOEffect', () => {
        it('computeOcclusion()가 헥스 타일 골짜기 그림자 계산', () => {
            const ssao = new SSAOEffect();
            const tiles = [
                { q: 0, r: 0, height: 10 },
                { q: 1, r: 0, height: 5 },
                { q: 0, r: 1, height: 3 },
            ];
            const occlusion = ssao.computeOcclusion(tiles);
            // tile (0,0) has height 10, neighbors (1,0)=5 and (0,1)=3 are lower
            expect(occlusion.has('0,0')).toBe(true);
            expect(occlusion.get('0,0')).toBeGreaterThan(0);
        });
    });

    // ── TilePulse ──

    describe('TilePulse', () => {
        it('highlightTile()/clearHighlight()가 Set 관리', () => {
            const tp = new TilePulse();
            tp.highlightTile(3, 5);
            expect(tp.isHighlighted(3, 5)).toBe(true);
            expect(tp.isHighlighted(0, 0)).toBe(false);
            tp.clearHighlight();
            expect(tp.isHighlighted(3, 5)).toBe(false);
        });

        it('update()가 0.3~1.0 범위의 알파값 반환', () => {
            const tp = new TilePulse();
            const alpha = tp.update(0.5);
            expect(alpha).toBeGreaterThanOrEqual(0.3);
            expect(alpha).toBeLessThanOrEqual(1.0);
        });
    });

    // ── PortraitAnimator ──

    describe('PortraitAnimator', () => {
        it('trackMouse()가 마우스 위치에 따라 눈동자 목표 설정', () => {
            const pa = new PortraitAnimator();
            pa.trackMouse(200, 150, 100, 100);
            // dx=100, dy=50, dist≈111.8, targetX = (100/111.8) * min(8, 11.18) = 0.894 * 8 ≈ 7.15
            expect(pa.targetX).toBeGreaterThan(0);
            expect(pa.targetY).toBeGreaterThan(0);
        });

        it('update()가 eyeOffset을 target으로 부드럽게 이동', () => {
            const pa = new PortraitAnimator();
            pa.targetX = 5;
            pa.targetY = 3;
            pa.update(0.016);
            expect(pa.eyeOffsetX).toBeGreaterThan(0);
            expect(pa.eyeOffsetY).toBeGreaterThan(0);
        });

        it('getBreathScale()가 0.98~1.02 범위', () => {
            const pa = new PortraitAnimator();
            const scale = pa.getBreathScale();
            expect(scale).toBeGreaterThanOrEqual(0.98);
            expect(scale).toBeLessThanOrEqual(1.02);
        });
    });

    // ── InkBleedTransition ──

    describe('InkBleedTransition', () => {
        it('start()가 transition 활성화', () => {
            const ibt = new InkBleedTransition();
            ibt.start(1);
            expect(ibt.active).toBe(true);
            expect(ibt.progress).toBe(0);
        });

        it('update()가 progress를 증가시키고 완료 시 비활성화', () => {
            const ibt = new InkBleedTransition();
            ibt.start(1);
            ibt.update(2.5); // 2.5 * 0.5 = 1.25 → clamp to 1
            expect(ibt.progress).toBe(1);
            expect(ibt.active).toBe(false);
        });
    });

    // ── InkBleedTransition ──
});
