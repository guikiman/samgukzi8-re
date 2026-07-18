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
import { TacticalAudioEngine, AudioVec3, AudioWeather, SoundPlayOptions } from './tactical_audio_engine.js';
import { VisualEffectRenderer, EffectCommand } from './visual_effect_renderer.js';
/** 3D 카메라 상태 (HexMap3DRenderer 카메라 동기화용) */
export interface CameraState3D {
    readonly position: AudioVec3;
    readonly forward: AudioVec3;
    readonly up: AudioVec3;
}
/** 통합 이벤트 타입 */
export type IntegratorEventType = 'BATTLE_HIT' | 'WEATHER_CHANGE' | 'TRANSITION' | 'TILE_HOVER' | 'SKILL_CAST' | 'SEASON_CHANGE' | 'EXPLOSION' | 'UNIT_MOVE' | 'DIPLOMACY_ACT' | 'VICTORY' | 'DEFEAT';
/** 통합 이벤트 */
export interface IntegratorEvent {
    readonly type: IntegratorEventType;
    readonly position?: AudioVec3;
    readonly intensity?: number;
    readonly weather?: AudioWeather;
    readonly tileQ?: number;
    readonly tileR?: number;
    readonly skillName?: string;
    readonly officerName?: string;
    readonly duration?: number;
    readonly season?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
}
/** 이펙트 프리셋 (재사용 가능한 이벤트 템플릿) */
export interface EffectPreset {
    readonly audio?: Partial<SoundPlayOptions>;
    readonly visualType?: EffectCommand['type'];
    readonly visualIntensity?: number;
    readonly screenShakeIntensity?: number;
    readonly durationMs: number;
}
/** 실행 통계 */
export interface IntegratorStats {
    readonly eventsProcessed: number;
    readonly queueLength: number;
    readonly audioReady: boolean;
    readonly visualReady: boolean;
    readonly masterVolume: number;
    readonly effectsEnabled: boolean;
}
export declare class AudioVisualIntegrator {
    private audio;
    private visual;
    private mapRenderer;
    private eventQueue;
    private eventsProcessed;
    private _masterVolume;
    private _effectsEnabled;
    private cameraState;
    private currentWeather;
    private shakeIntensity;
    private shakeDuration;
    private shakeElapsed;
    /** TacticalAudioEngine 등록 */
    attachAudio(audio: TacticalAudioEngine): void;
    /** VisualEffectRenderer 등록 */
    attachVisual(visual: VisualEffectRenderer): void;
    /** 3D 맵 렌더러 등록 (CameraState3D 제공) */
    attachMapRenderer(renderer: {
        camera?: CameraState3D;
    }): void;
    /** 모든 서브시스템 등록 여부 */
    get isReady(): boolean;
    /** 오디오 엔진 참조 */
    get audioEngine(): TacticalAudioEngine | null;
    /** 비주얼 엔진 참조 */
    get visualEngine(): VisualEffectRenderer | null;
    /** 마스터 볼륨 (0.0 ~ 1.0) */
    set masterVolume(v: number);
    get masterVolume(): number;
    /** 모든 시각 효과 활성/비활성 */
    set effectsEnabled(enabled: boolean);
    get effectsEnabled(): boolean;
    /**
     * [55] 통합 이벤트 발행
     * 이벤트를 큐에 추가하여 다음 update()에서 일괄 처리
     */
    emitEvent(event: IntegratorEvent): void;
    /**
     * [48] 전투 타격 이벤트 (사운드 + 색수차 + 스크린 쉐이크)
     */
    emitBattleHit(position: AudioVec3, intensity?: number): void;
    /**
     * [49] 날씨 전환 이벤트
     */
    emitWeatherChange(weather: AudioWeather): void;
    /**
     * [50] 화면 전환 이벤트
     */
    emitTransition(): void;
    /**
     * [51] 타일 호버 이벤트
     */
    emitTileHover(q: number, r: number): void;
    /**
     * [52] 전법 발동 이벤트
     */
    emitSkillCast(skillName: string, officerName: string, position?: AudioVec3): void;
    /**
     * 매 프레임 호출:
     * 1. 카메라-리스너 동기화
     * 2. 이벤트 큐 처리
     * 3. 서브시스템 update() 호출
     * 4. 스크린 쉐이크 감쇠
     */
    update(dt: number, cameraOverride?: CameraState3D): void;
    /**
     * 3D 카메라 위치를 AudioListener에 실시간 동기화
     * HexMap3DRenderer의 OrbitControls 카메라와 TacticalAudioEngine의
     * AudioListener가 동일한 공간 좌표를 공유하도록 함
     */
    syncCamera(cam: CameraState3D): void;
    /** 전체 음소거 토글 */
    setMuted(muted: boolean): void;
    getStats(): IntegratorStats;
    /** 모든 리소스 해제 */
    dispose(): void;
    private processEventQueue;
    private dispatchEvent;
    private handleBattleHit;
    private handleWeatherChange;
    private handleTransition;
    private handleTileHover;
    private handleSkillCast;
    private handleSeasonChange;
    private handleUnitMove;
    private handleOutcome;
    /**
     * 헥사 좌표 (q, r) → 3D 월드 좌표 변환 (편의용)
     * 정확한 변환은 HexMap3DRenderer.hexToWorld() 참조
     */
    private tileToWorld;
    /** 프리셋 기반 사운드 재생 */
    private playPresetSound;
    /** 스크린 쉐이크 트리거 */
    private triggerScreenShake;
}
//# sourceMappingURL=audio_visual_integrator.d.ts.map