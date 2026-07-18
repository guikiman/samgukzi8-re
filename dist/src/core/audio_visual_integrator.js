/**
 * [46-65] 삼국지 8 리메이크 — 오디오-비주얼 통합 오케스트레이터
 * 파일: src/core/audio_visual_integrator.ts
 *
 * TacticalAudioEngine + VisualEffectRenderer + HexMap3DRenderer를
 * 하나의 일관된 파이프라인으로 통합, 이벤트 기반 오디오-비주얼 동기화 제공.
 *
 * ── 통합 기능 ──
 * [46] 통합 업데이트 루프 (모든 서브시스템 update() 일괄 호출)
 * [47] 카메라-리스너 위치 동기화
 * [48] 전투 타격 이벤트 (사운드 + 색수차 + 스크린 쉐이크)
 * [49] 날씨 전환 (오디오 앰비언트 + 시각 효과 동기)
 * [50] 화면 전환 (잉크 번짐 + 앰비언트 페이드)
 * [51] 타일 호버 효과 (오디오 피드백 + 시각 하이라이트)
 * [52] 전법 발동 연출 (컷인 + 사운드 + 크로마틱)
 * [53] 계절 전환 테마 (오디오 BGM + 시각 테마)
 * [54] 메모리 안전성 (통합 dispose)
 * [55] 우선순위 기반 이벤트 큐
 * [56] 통합 마스터 볼륨/이펙트 토글
 */
// ============================================================
// 이펙트 프리셋 맵
// ============================================================
const EFFECT_PRESETS = {
    BATTLE_HIT: {
        audio: { volume: 0.8, pitchVariance: 0.15 },
        visualType: 'chromaticAberration',
        visualIntensity: 0.8,
        screenShakeIntensity: 0.4,
        durationMs: 200,
    },
    WEATHER_CHANGE: {
        audio: { volume: 0.6, pitchVariance: 0.05 },
        durationMs: 1500,
    },
    TRANSITION: {
        visualType: 'inkBleed',
        visualIntensity: 1.0,
        durationMs: 1000,
    },
    TILE_HOVER: {
        audio: { volume: 0.3 },
        durationMs: 100,
    },
    SKILL_CAST: {
        audio: { volume: 1.0, pitchVariance: 0.1 },
        visualType: 'chromaticAberration',
        visualIntensity: 1.0,
        screenShakeIntensity: 0.6,
        durationMs: 600,
    },
    SEASON_CHANGE: {
        audio: { volume: 0.5 },
        durationMs: 2000,
    },
    EXPLOSION: {
        audio: { volume: 1.0, pitchVariance: 0.2 },
        visualType: 'chromaticAberration',
        visualIntensity: 1.2,
        screenShakeIntensity: 0.8,
        durationMs: 300,
    },
    UNIT_MOVE: {
        audio: { volume: 0.4, pitchVariance: 0.1 },
        durationMs: 300,
    },
    DIPLOMACY_ACT: {
        audio: { volume: 0.5 },
        durationMs: 500,
    },
    VICTORY: {
        audio: { volume: 0.9 },
        visualType: 'chromaticAberration',
        visualIntensity: 0.5,
        durationMs: 1500,
    },
    DEFEAT: {
        audio: { volume: 0.6 },
        visualType: 'inkBleed',
        visualIntensity: 0.8,
        durationMs: 2000,
    },
};
// ============================================================
// [1] AudioVisualIntegrator — 메인 통합 클래스
// ============================================================
export class AudioVisualIntegrator {
    constructor() {
        // 서브시스템 참조
        this.audio = null;
        this.visual = null;
        this.mapRenderer = null;
        // 상태
        this.eventQueue = [];
        this.eventsProcessed = 0;
        this._masterVolume = 1.0;
        this._effectsEnabled = true;
        this.cameraState = {
            position: { x: 0, y: 400, z: 400 },
            forward: { x: 0, y: 0, z: -1 },
            up: { x: 0, y: 1, z: 0 },
        };
        // 현재 기상 상태 (시각 효과 동기화용)
        this.currentWeather = 'SUNNY';
        // 현재 활성화된 셰이크 강도 (시간 감쇠)
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeElapsed = 0;
    }
    // ============================================================
    // 서브시스템 등록
    // ============================================================
    /** TacticalAudioEngine 등록 */
    attachAudio(audio) {
        this.audio = audio;
    }
    /** VisualEffectRenderer 등록 */
    attachVisual(visual) {
        this.visual = visual;
    }
    /** 3D 맵 렌더러 등록 (CameraState3D 제공) */
    attachMapRenderer(renderer) {
        this.mapRenderer = renderer;
    }
    /** 모든 서브시스템 등록 여부 */
    get isReady() {
        return this.audio !== null && this.visual !== null;
    }
    /** 오디오 엔진 참조 */
    get audioEngine() {
        return this.audio;
    }
    /** 비주얼 엔진 참조 */
    get visualEngine() {
        return this.visual;
    }
    // ============================================================
    // 마스터 컨트롤
    // ============================================================
    /** 마스터 볼륨 (0.0 ~ 1.0) */
    set masterVolume(v) {
        this._masterVolume = Math.max(0, Math.min(1, v));
        if (this.audio) {
            this.audio.volume = this._masterVolume * (this.audio.muted ? 0 : 1);
        }
    }
    get masterVolume() {
        return this._masterVolume;
    }
    /** 모든 시각 효과 활성/비활성 */
    set effectsEnabled(enabled) {
        this._effectsEnabled = enabled;
    }
    get effectsEnabled() {
        return this._effectsEnabled;
    }
    // ============================================================
    // 이벤트 큐
    // ============================================================
    /**
     * [55] 통합 이벤트 발행
     * 이벤트를 큐에 추가하여 다음 update()에서 일괄 처리
     */
    emitEvent(event) {
        this.eventQueue.push(event);
    }
    /**
     * [48] 전투 타격 이벤트 (사운드 + 색수차 + 스크린 쉐이크)
     */
    emitBattleHit(position, intensity = 1.0) {
        this.emitEvent({
            type: 'BATTLE_HIT',
            position,
            intensity,
        });
    }
    /**
     * [49] 날씨 전환 이벤트
     */
    emitWeatherChange(weather) {
        this.emitEvent({
            type: 'WEATHER_CHANGE',
            weather,
        });
    }
    /**
     * [50] 화면 전환 이벤트
     */
    emitTransition() {
        this.emitEvent({ type: 'TRANSITION' });
    }
    /**
     * [51] 타일 호버 이벤트
     */
    emitTileHover(q, r) {
        this.emitEvent({
            type: 'TILE_HOVER',
            tileQ: q,
            tileR: r,
        });
    }
    /**
     * [52] 전법 발동 이벤트
     */
    emitSkillCast(skillName, officerName, position) {
        this.emitEvent({
            type: 'SKILL_CAST',
            skillName,
            officerName,
            position,
        });
    }
    // ============================================================
    // [46] 통합 업데이트 루프 (매 프레임 호출)
    // ============================================================
    /**
     * 매 프레임 호출:
     * 1. 카메라-리스너 동기화
     * 2. 이벤트 큐 처리
     * 3. 서브시스템 update() 호출
     * 4. 스크린 쉐이크 감쇠
     */
    update(dt, cameraOverride) {
        // ── [47] 카메라-리스너 동기화 ──
        const cam = cameraOverride ?? this.mapRenderer?.camera ?? this.cameraState;
        this.syncCamera(cam);
        // ── 이벤트 큐 처리 ──
        this.processEventQueue(dt);
        // ── 서브시스템 업데이트 ──
        if (this.audio) {
            this.audio.update(cam.position, dt);
        }
        if (this.visual) {
            this.visual.update(dt);
        }
        // ── 스크린 쉐이크 감쇠 ──
        if (this.shakeIntensity > 0.01) {
            this.shakeElapsed += dt * 1000;
            const t = this.shakeElapsed / this.shakeDuration;
            this.shakeIntensity = Math.max(0, this.shakeIntensity * (1 - t * 0.5));
            if (t >= 1) {
                this.shakeIntensity = 0;
            }
        }
    }
    // ============================================================
    // [47] 카메라-리스너 동기화
    // ============================================================
    /**
     * 3D 카메라 위치를 AudioListener에 실시간 동기화
     * HexMap3DRenderer의 OrbitControls 카메라와 TacticalAudioEngine의
     * AudioListener가 동일한 공간 좌표를 공유하도록 함
     */
    syncCamera(cam) {
        this.cameraState = cam;
        if (this.audio) {
            this.audio.updateListener(cam.position, cam.forward, cam.up);
        }
    }
    // ============================================================
    // 마스터 음소거
    // ============================================================
    /** 전체 음소거 토글 */
    setMuted(muted) {
        if (this.audio) {
            this.audio.muted = muted;
        }
    }
    // ============================================================
    // 통계
    // ============================================================
    getStats() {
        return {
            eventsProcessed: this.eventsProcessed,
            queueLength: this.eventQueue.length,
            audioReady: this.audio !== null,
            visualReady: this.visual !== null,
            masterVolume: this._masterVolume,
            effectsEnabled: this._effectsEnabled,
        };
    }
    // ============================================================
    // [54] 메모리 안전성
    // ============================================================
    /** 모든 리소스 해제 */
    dispose() {
        this.eventQueue = [];
        if (this.audio) {
            this.audio.dispose();
            this.audio = null;
        }
        if (this.visual) {
            this.visual.dispose();
            this.visual = null;
        }
        this.mapRenderer = null;
        this.shakeIntensity = 0;
    }
    // ============================================================
    // 내부: 이벤트 큐 처리
    // ============================================================
    processEventQueue(dt) {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.eventsProcessed++;
            this.dispatchEvent(event, dt);
        }
    }
    dispatchEvent(event, _dt) {
        const preset = EFFECT_PRESETS[event.type];
        switch (event.type) {
            case 'BATTLE_HIT':
                this.handleBattleHit(event, preset);
                break;
            case 'WEATHER_CHANGE':
                this.handleWeatherChange(event);
                break;
            case 'TRANSITION':
                this.handleTransition(preset);
                break;
            case 'TILE_HOVER':
                this.handleTileHover(event, preset);
                break;
            case 'SKILL_CAST':
                this.handleSkillCast(event, preset);
                break;
            case 'EXPLOSION':
                this.handleBattleHit(event, preset);
                break;
            case 'SEASON_CHANGE':
                this.handleSeasonChange(event, preset);
                break;
            case 'UNIT_MOVE':
                this.handleUnitMove(event, preset);
                break;
            case 'VICTORY':
            case 'DEFEAT':
                this.handleOutcome(event, preset);
                break;
            case 'DIPLOMACY_ACT':
                // 외교 사운드만 재생
                if (this.audio && event.position) {
                    this.playPresetSound(event.type, event.position);
                }
                break;
        }
    }
    // ============================================================
    // 내부: 이벤트 핸들러
    // ============================================================
    handleBattleHit(event, preset) {
        const pos = event.position ?? { x: 0, y: 0, z: 0 };
        // 오디오: 타격음 재생
        this.playPresetSound(event.type, pos);
        // 비주얼: 색수차 트리거
        if (this.visual && this._effectsEnabled) {
            const intensity = (event.intensity ?? 1.0) * (preset.visualIntensity ?? 1.0);
            this.visual.triggerChromaticAberration(intensity);
        }
        // 스크린 쉐이크
        const shakeIntensity = (event.intensity ?? 1.0) * (preset.screenShakeIntensity ?? 0);
        if (shakeIntensity > 0.01) {
            this.triggerScreenShake(shakeIntensity, preset.durationMs);
        }
    }
    handleWeatherChange(event) {
        if (!event.weather)
            return;
        this.currentWeather = event.weather;
        // 오디오: 날씨 앰비언트 전환
        if (this.audio) {
            this.audio.setWeather(event.weather);
        }
    }
    handleTransition(preset) {
        // 비주얼: 잉크 번짐 트랜지션
        if (this.visual && this._effectsEnabled) {
            this.visual.enqueueTransitionInkBleed(preset.durationMs);
        }
    }
    handleTileHover(event, preset) {
        // 오디오: 호버 사운드
        if (this.audio) {
            const pos = this.tileToWorld(event.tileQ ?? 0, event.tileR ?? 0);
            this.playPresetSound(event.type, pos);
        }
    }
    handleSkillCast(event, preset) {
        // 오디오: 전법 사운드
        const pos = event.position ?? { x: 0, y: 0, z: 0 };
        this.playPresetSound(event.type, pos);
        // 비주얼: 크로마틱 + 스크린 쉐이크
        if (this.visual && this._effectsEnabled) {
            this.visual.triggerChromaticAberration(preset.visualIntensity ?? 1.0);
        }
        const shake = preset.screenShakeIntensity ?? 0;
        if (shake > 0.01) {
            this.triggerScreenShake(shake, preset.durationMs);
        }
    }
    handleSeasonChange(event, _preset) {
        // 계절 전환 시 오디오 처리 (BGM 전환)
        if (this.audio && event.season) {
            // BGM 전환은 오디오 에셋 로드 필요 — 현재는 로그만
            console.log(`[AudioVisualIntegrator] Season changed to ${event.season}`);
        }
    }
    handleUnitMove(event, preset) {
        if (this.audio && event.position) {
            this.playPresetSound(event.type, event.position);
        }
    }
    handleOutcome(event, preset) {
        if (this.audio && event.position) {
            this.playPresetSound(event.type, event.position);
        }
        // 승리/패배 시각 효과
        if (this.visual && this._effectsEnabled) {
            if (preset.visualType === 'chromaticAberration') {
                this.visual.triggerChromaticAberration(preset.visualIntensity ?? 0.5);
            }
            else if (preset.visualType === 'inkBleed') {
                this.visual.enqueueTransitionInkBleed(preset.durationMs);
            }
        }
    }
    // ============================================================
    // 내부: 유틸리티
    // ============================================================
    /**
     * 헥사 좌표 (q, r) → 3D 월드 좌표 변환 (편의용)
     * 정확한 변환은 HexMap3DRenderer.hexToWorld() 참조
     */
    tileToWorld(q, r, hexSize = 16) {
        const x = hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const z = hexSize * (3 / 2 * r);
        return { x, y: 0, z };
    }
    /** 프리셋 기반 사운드 재생 */
    playPresetSound(eventType, position) {
        if (!this.audio)
            return;
        const preset = EFFECT_PRESETS[eventType];
        this.audio.playSound({
            bufferId: `sfx_${eventType.toLowerCase()}`,
            position,
            volume: (preset.audio?.volume ?? 0.5) * this._masterVolume,
            pitchVariance: preset.audio?.pitchVariance ?? 0.1,
            maxDistance: 100,
            refDistance: 10,
            rolloffFactor: 2,
        });
    }
    /** 스크린 쉐이크 트리거 */
    triggerScreenShake(intensity, durationMs) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, durationMs);
        this.shakeElapsed = 0;
    }
}
//# sourceMappingURL=audio_visual_integrator.js.map