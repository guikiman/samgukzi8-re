/**
 * 삼국지 8 리메이크 — Web Audio 기반 3D 바이노럴 전술 사운드 엔진
 * 파일: src/core/tactical_audio_engine.ts
 *
 * [492] PannerNode HRTF 3D 입체 음향
 * [494] 거리 역제곱 감쇠 + BiquadFilterNode 공기 흡수
 * [495] 기상 상태 앰비언트 믹서
 * [497] 크리티컬/타격 피치 랜덤마이저
 *
 * ── 오디오 그래프 ──
 *
 * BufferSource
 *   → BiquadFilterNode (lowpass: 거리별 고주파 감쇠)
 *     → PannerNode (HRTF: 3D 위치 + 방향)
 *       → GainNode (거리 볼륨 감쇠)
 *         → AudioContext.destination
 *
 * ── 메모리 안전성 ──
 *   - AudioNodePool: 32개 노드 선할당, 재사용
 *   - SoundInstance: stop() 시 풀 반납 + 그래프 해체
 *   - dispose(): 모든 노드 연결 끊기 + 컨텍스트 종료
 */
/** 3D 공간 좌표 */
export interface AudioVec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}
/** 카메라 상태 (Listener 동기화용) */
export interface AudioCameraState {
    readonly position: AudioVec3;
    readonly forward: AudioVec3;
    readonly up: AudioVec3;
}
/** 기상 상태 */
export type AudioWeather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'FOG';
/** 사운드 버퍼 식별자 (URL 또는 버퍼 이름) */
export type SoundBufferId = string;
/** 사운드 재생 옵션 */
export interface SoundPlayOptions {
    readonly bufferId: SoundBufferId;
    readonly position: AudioVec3;
    readonly volume?: number;
    readonly pitch?: number;
    readonly pitchVariance?: number;
    readonly loop?: boolean;
    readonly priority?: SoundPriority;
    readonly maxDistance?: number;
    readonly refDistance?: number;
    readonly rolloffFactor?: number;
    readonly playbackTime?: number;
}
/** 사운드 우선순위 (pool 부족 시 낮은 우선순위부터 폐기) */
export type SoundPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
/** 앰비언트 레이어 */
export interface AmbientLayer {
    readonly bufferId: SoundBufferId;
    readonly volume: number;
    readonly fadeInDuration: number;
    readonly fadeOutDuration: number;
    readonly weatherMask: AudioWeather[];
}
/** 활성 사운드 인스턴스 */
export interface SoundInstance {
    readonly id: number;
    readonly options: SoundPlayOptions;
    readonly startTime: number;
    readonly sourceNode: AudioBufferSourceNode;
    readonly pannerNode: PannerNode;
    readonly filterNode: BiquadFilterNode;
    readonly gainNode: GainNode;
    isStopped: boolean;
}
/**
 * AudioNodePool — BufferSource + Panner + Filter + Gain 노드 선할당 풀
 *
 * 풀링이 필요한 이유:
 *   BufferSourceNode는 한 번 start()하면 stop() 후 재사용 불가.
 *   PannerNode/BiquadFilterNode/GainNode는 재연결 가능.
 *   매번 new 생성 + GC는 프레임 드랍 유발.
 *
 * 전략:
 *   - BufferSourceNode: pre-create N개 (기본 32)
 *   - Panner/Filter/Gain: pre-create N개, disconnect 후 재연결
 *   - 사용 가능한 노드가 없으면 가장 오래된 LOW 우선순위 인스턴스 폐기
 */
export declare class AudioNodePool {
    private readonly poolSize;
    private readonly ctx;
    private sourceNodes;
    private pannerNodes;
    private filterNodes;
    private gainNodes;
    private nextFreeIndex;
    constructor(ctx: AudioContext, poolSize?: number);
    private allocate;
    /** 다음 사용 가능한 인덱스 획득 (라운드 로빈) */
    acquireIndex(): number | null;
    /** BufferSourceNode 재할당 (기존 노드는 stop() 후 새 노드로 교체) */
    acquireSourceNode(): AudioBufferSourceNode;
    /** PannerNode 획득 (연결 해제된 상태로 반환) */
    acquirePanner(idx: number): PannerNode;
    /** BiquadFilterNode 획득 */
    acquireFilter(idx: number): BiquadFilterNode;
    /** GainNode 획득 */
    acquireGain(idx: number): GainNode;
    /** 풀의 PannerNode dispose */
    disposePanner(idx: number): void;
    /** 풀의 FilterNode dispose */
    disposeFilter(idx: number): void;
    /** 풀의 GainNode dispose */
    disposeGain(idx: number): void;
    /** 모든 노드 정리 */
    disposeAll(): void;
}
/**
 * TacticalAudioEngine — 3D 바이노럴 전술 사운드 엔진
 *
 * 사용 예:
 * ```typescript
 * const audio = new TacticalAudioEngine();
 * await audio.init();
 *
 * // 프레임 루프에서:
 * audio.updateListener(camera.position, camera.forward, camera.up);
 *
 * // 사운드 재생:
 * audio.playSound({
 *     bufferId: 'cavalry_charge',
 *     position: { x: 10, y: 0, z: -5 },
 *     volume: 0.8,
 *     pitchVariance: 0.15,
 * });
 *
 * // 날씨 변경:
 * audio.setWeather('RAIN');
 * ```
 */
export declare class TacticalAudioEngine {
    private ctx;
    private pool;
    private prng;
    private activeSounds;
    private nextId;
    private _weather;
    private ambientNodes;
    private bufferCache;
    private masterGain;
    private compressor;
    private _volume;
    private _muted;
    private listener;
    /** 프리로드할 사운드 버퍼 URL 목록 (init() 전에 설정) */
    preloadBuffers: {
        id: SoundBufferId;
        url: string;
    }[];
    constructor();
    /** AudioContext 초기화 (유저 제스처 필요) */
    init(): Promise<boolean>;
    /** 사운드 버퍼 로드 (URL → AudioBuffer) */
    loadBuffer(id: SoundBufferId, url: string): Promise<AudioBuffer | null>;
    /** AudioBuffer 직접 등록 (이미 디코딩된 버퍼) */
    registerBuffer(id: SoundBufferId, buffer: AudioBuffer): void;
    /**
     * 카메라 상태를 AudioListener에 실시간 전송
     *
     * @param position - 카메라 위치 (meters)
     * @param forward  - 카메라 전방 벡터 (정규화)
     * @param up       - 카메라 상방 벡터 (정규화)
     */
    updateListener(position: AudioVec3, forward: AudioVec3, up: AudioVec3): void;
    /** 편의: Vec3에서 listener 설정 */
    updateListenerVec3(pos: AudioVec3, forward: AudioVec3, up: AudioVec3): void;
    /**
     * 3D 사운드 재생
     *
     * 오디오 그래프:
     *   BufferSource → BiquadFilterNode(lowpass, air absorption)
     *     → PannerNode(HRTF, 3D position)
     *       → GainNode(distance attenuation)
     *         → masterGain → destination
     */
    playSound(options: SoundPlayOptions): number | null;
    /** 특정 사운드 중지 */
    stopSound(id: number): void;
    /** 모든 사운드 중지 */
    stopAllSounds(): void;
    /**
     * 매 프레임 호출하여 활성 사운드의 거리 감쇠 및 필터 업데이트
     *
     * @param listenerPosition - 리스너 위치
     * @param dt - 델타 타임 (초)
     */
    update(listenerPosition: AudioVec3, dt: number): void;
    /**
     * 기상 상태 변경 → 앰비언트 트랙 페이드 전환
     *
     * 전환 곡선:
     *   이전 날씨 앰비언트: 볼륨 → 0 (fadeOutDuration 동안)
     *   새 날씨 앰비언트: 볼륨 → target (fadeInDuration 동안)
     */
    setWeather(weather: AudioWeather): void;
    get weather(): AudioWeather;
    /** 마스터 볼륨 (0.0 ~ 1.0) */
    set volume(v: number);
    get volume(): number;
    /** 음소거 */
    set muted(m: boolean);
    get muted(): boolean;
    /** AudioContext 재개 (브라우저 정책 대응) */
    resume(): Promise<void>;
    /**
     * [20] 순수 코드 화살 발사음 합성
     *
     * OscillatorNode 주파수를 고주파(2000Hz) → 저주파(200Hz)로
     * 0.15초 동안 급속 스윕하여 화살이 공기를 가르는 소리를 생성
     *
     * @param position 3D 공간 좌표 (옵션, 미지정 시 2D)
     * @returns 사운드 인스턴스 ID (실패 시 null)
     */
    playArrowSound(position?: AudioVec3): number | null;
    private bindVisibilityHandler;
    private readonly ambientConfigs;
    /** 앰비언트 레이어 등록 */
    registerAmbient(config: {
        id: string;
        bufferId: SoundBufferId;
        baseVolume: number;
        weatherMask: AudioWeather[];
        fadeIn?: number;
        fadeOut?: number;
    }): void;
    private initAmbientLayers;
    private updateAmbientTargets;
    private startAmbientLoop;
    private stopAmbientLoop;
    private updateAmbientFade;
    private releaseInstance;
    private findPoolIndex;
    /** 모든 리소스 해제 */
    dispose(): void;
}
//# sourceMappingURL=tactical_audio_engine.d.ts.map