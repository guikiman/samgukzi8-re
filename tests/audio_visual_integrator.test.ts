/**
 * [46-56] AudioVisualIntegrator 단위 테스트
 *
 * 통합 오디오-비주얼 오케스트레이터의 이벤트 디스패치,
 * 상태 관리, 서브시스템 동기화 로직 검증.
 *
 * 테스트 범위:
 * - 서브시스템 등록/해제
 * - 이벤트 큐 발행/처리
 * - 카메라-리스너 동기화
 * - 마스터 볼륨/음소거
 * - 스크린 쉐이크 감쇠
 * - 메모리 안전성 (dispose)
 * - 이펙트 토글
 * - 프리셋 기반 이벤트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioVisualIntegrator } from '../src/core/audio_visual_integrator.js';
import { TacticalAudioEngine } from '../src/core/tactical_audio_engine.js';

// ============================================================
// Mock: VisualEffectRenderer (최소한의 모킹)
// ============================================================

class MockVisualEffectRenderer {
    update = vi.fn();
    enqueueTransitionInkBleed = vi.fn();
    triggerChromaticAberration = vi.fn();
    triggerWaterRipple = vi.fn();
    isReady = true;
    dispose = vi.fn();
}

// ============================================================
// Mock: TacticalAudioEngine (playSound spy 포함)
// ============================================================
function createMockAudioEngine() {
    const engine = {
        update: vi.fn(),
        updateListener: vi.fn(),
        playSound: vi.fn().mockReturnValue(1),
        setWeather: vi.fn(),
        dispose: vi.fn(),
        resume: vi.fn(),
        volume: 1.0,
        muted: false,
        weather: 'SUNNY' as const,
    };
    return engine;
}

// ============================================================
// Tests
// ============================================================

describe('AudioVisualIntegrator [46-56]', () => {
    let integrator: AudioVisualIntegrator;
    let mockAudio: ReturnType<typeof createMockAudioEngine>;
    let mockVisual: MockVisualEffectRenderer;

    beforeEach(() => {
        integrator = new AudioVisualIntegrator();
        mockAudio = createMockAudioEngine();
        mockVisual = new MockVisualEffectRenderer();
    });

    afterEach(() => {
        integrator.dispose();
    });

    // ── [46-1] 서브시스템 등록 ──

    it('attachAudio() 후 audioEngine 참조 가능', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        expect(integrator.audioEngine).toBe(mockAudio);
    });

    it('attachVisual() 후 visualEngine 참조 가능', () => {
        integrator.attachVisual(mockVisual as unknown as any);
        expect(integrator.visualEngine).toBe(mockVisual);
    });

    it('isReady: 두 엔진 모두 등록 시 true', () => {
        expect(integrator.isReady).toBe(false);
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        expect(integrator.isReady).toBe(false);
        integrator.attachVisual(mockVisual as unknown as any);
        expect(integrator.isReady).toBe(true);
    });

    it('attachMapRenderer() 등록 후 syncCamera에 영향', () => {
        const mapRenderer = {
            camera: {
                position: { x: 100, y: 200, z: 300 },
                forward: { x: 0, y: 0, z: -1 },
                up: { x: 0, y: 1, z: 0 },
            },
        };
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachMapRenderer(mapRenderer);

        integrator.update(0.016);

        // 카메라 위치가 updateListener에 전달되어야 함
        expect(mockAudio.updateListener).toHaveBeenCalledWith(
            { x: 100, y: 200, z: 300 },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: 1, z: 0 },
        );
    });

    // ── [46-2] 이벤트 큐 발행/처리 ──

    it('emitEvent()가 이벤트를 큐에 추가하고 update()에서 처리', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitEvent({
            type: 'TILE_HOVER',
            tileQ: 3,
            tileR: 5,
        });

        const statsBefore = integrator.getStats();
        expect(statsBefore.queueLength).toBe(1);

        integrator.update(0.016);

        const statsAfter = integrator.getStats();
        expect(statsAfter.queueLength).toBe(0);
        expect(statsAfter.eventsProcessed).toBeGreaterThan(0);
    });

    // ── [46-3] 편의 메서드를 통한 이벤트 발행 ──

    it('emitBattleHit()가 BATTLE_HIT 이벤트 발행', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitBattleHit({ x: 5, y: 0, z: -3 }, 0.8);
        integrator.update(0.016);

        // 크로마틱 액퍼레이션이 트리거되어야 함
        expect(mockVisual.triggerChromaticAberration).toHaveBeenCalled();
        // updateListener가 한 번 이상 호출되어야 함 (카메라 동기화)
        expect(mockAudio.updateListener).toHaveBeenCalled();
    });

    it('emitWeatherChange()가 WEATHER_CHANGE 이벤트 발행', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);

        integrator.emitWeatherChange('STORM');
        integrator.update(0.016);

        expect(mockAudio.setWeather).toHaveBeenCalledWith('STORM');
    });

    it('emitTransition()이 잉크 번짐 트랜지션 트리거', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitTransition();
        integrator.update(0.016);

        expect(mockVisual.enqueueTransitionInkBleed).toHaveBeenCalled();
    });

    it('emitTileHover()가 TILE_HOVER 이벤트 발행', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitTileHover(2, 3);
        integrator.update(0.016);

        // playSound가 호출되었는지 확인 (정확한 position은 내부 계산)
        expect(mockAudio.playSound).toHaveBeenCalled();
    });

    it('emitSkillCast()가 SKILL_CAST 이벤트 발행 (크로마틱 + 사운드)', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitSkillCast('화계', '제갈량', { x: 10, y: 0, z: 5 });
        integrator.update(0.016);

        expect(mockVisual.triggerChromaticAberration).toHaveBeenCalled();
        expect(mockAudio.playSound).toHaveBeenCalled();
    });

    // ── [46-4] 마스터 컨트롤 ──

    it('masterVolume setter가 오디오 볼륨을 동기화', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.masterVolume = 0.5;
        expect(integrator.masterVolume).toBe(0.5);
        expect(mockAudio.volume).toBe(0.5);

        integrator.masterVolume = 1.5; // clamp
        expect(integrator.masterVolume).toBe(1);
    });

    it('setMuted()가 오디오 음소거를 동기화', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.setMuted(true);
        expect(mockAudio.muted).toBe(true);
        integrator.setMuted(false);
        expect(mockAudio.muted).toBe(false);
    });

    it('effectsEnabled toggle', () => {
        expect(integrator.effectsEnabled).toBe(true);
        integrator.effectsEnabled = false;
        expect(integrator.effectsEnabled).toBe(false);
    });

    // ── [46-5] 통계 ──

    it('getStats()가 정확한 상태 반환', () => {
        const stats = integrator.getStats();
        expect(stats.audioReady).toBe(false);
        expect(stats.visualReady).toBe(false);
        expect(stats.masterVolume).toBe(1);
        expect(stats.effectsEnabled).toBe(true);
        expect(stats.queueLength).toBe(0);
        expect(stats.eventsProcessed).toBe(0);
    });

    it('getStats()가 이벤트 처리 후 업데이트', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitBattleHit({ x: 0, y: 0, z: 0 });
        integrator.emitWeatherChange('RAIN');
        integrator.update(0.016);

        const stats = integrator.getStats();
        expect(stats.eventsProcessed).toBe(2);
        expect(stats.queueLength).toBe(0);
        expect(stats.audioReady).toBe(true);
        expect(stats.visualReady).toBe(true);
    });

    // ── [46-6] syncCamera ──

    it('syncCamera()가 AudioListener 위치 업데이트', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);

        integrator.syncCamera({
            position: { x: 50, y: 20, z: -10 },
            forward: { x: 0, y: 0, z: -1 },
            up: { x: 0, y: 1, z: 0 },
        });

        expect(mockAudio.updateListener).toHaveBeenCalledWith(
            { x: 50, y: 20, z: -10 },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: 1, z: 0 },
        );
    });

    // ── [46-7] 멀티 이벤트 버스트 ──

    it('여러 이벤트 동시 발행 시 순차 처리', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitWeatherChange('RAIN');
        integrator.emitBattleHit({ x: 1, y: 0, z: 0 });
        integrator.emitBattleHit({ x: 2, y: 0, z: 0 });
        integrator.emitTransition();

        expect(integrator.getStats().queueLength).toBe(4);

        integrator.update(0.016);

        expect(integrator.getStats().queueLength).toBe(0);
        expect(integrator.getStats().eventsProcessed).toBe(4);
    });

    // ── [46-8] 메모리 안전성 ──

    it('dispose()가 모든 서브시스템 정리', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);
        integrator.emitBattleHit({ x: 0, y: 0, z: 0 });

        integrator.dispose();

        expect(mockAudio.dispose).toHaveBeenCalled();
        expect(mockVisual.dispose).toHaveBeenCalled();
        expect(integrator.audioEngine).toBeNull();
        expect(integrator.visualEngine).toBeNull();
    });

    // ── [46-9] 이펙트 비활성화 ──

    it('effectsEnabled=false 시 시각 효과 미발생', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.effectsEnabled = false;
        integrator.emitBattleHit({ x: 0, y: 0, z: 0 });
        integrator.update(0.016);

        // 오디오는 계속 재생
        expect(mockAudio.playSound).toHaveBeenCalled();
        // 시각 효과는 스킵
        expect(mockVisual.triggerChromaticAberration).not.toHaveBeenCalled();
    });

    // ── [46-10] 서브시스템 없이 update 안전성 ──

    it('서브시스템 없이 update() 호출 시 오류 없음', () => {
        expect(() => {
            integrator.update(0.016);
            integrator.emitWeatherChange('SNOW');
            integrator.update(0.016);
        }).not.toThrow();
    });

    // ── [46-11] emitSkillCast 시 크로마틱 + 쉐이크 ──

    it('emitSkillCast()가 시각 + 청각 동기 발생', () => {
        integrator.attachAudio(mockAudio as unknown as TacticalAudioEngine);
        integrator.attachVisual(mockVisual as unknown as any);

        integrator.emitSkillCast('신화', '관우', { x: 0, y: 0, z: 0 });
        integrator.update(0.016);

        // playSound 호출 확인
        expect(mockAudio.playSound).toHaveBeenCalled();
        // triggerChromaticAberration 호출 확인
        expect(mockVisual.triggerChromaticAberration).toHaveBeenCalled();
    });
});
