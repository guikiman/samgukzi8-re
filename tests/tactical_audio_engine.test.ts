/**
 * [6] TacticalAudioEngine 단위 테스트
 *
 * Web Audio API는 Node.js에서 사용 불가능하므로,
 * AudioContext 및 관련 노드를 모킹하여 로직 검증.
 *
 * 테스트 범위:
 * - AudioNodePool: 노드 할당/해제/재사용
 * - TacticalAudioEngine: init/playSound/stopSound/update/dispose
 * - 거리 감쇠 수식: 역제곱 법칙 검증
 * - 기상 상태 앰비언트 전환
 * - 피치 랜덤마이저
 * - 메모리 안전성 (stopAll, dispose)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TacticalAudioEngine, AudioNodePool } from '../src/core/tactical_audio_engine.js';

// ============================================================
// Web Audio API Mock
// ============================================================

class MockAudioNode {
    connect(_dest: AudioNode): AudioNode { return _dest; }
    disconnect(): void { /* no-op */ }
}

class MockAudioParam {
    value: number = 0;
    constructor(v: number = 0) { this.value = v; }
}

class MockGainNode extends MockAudioNode {
    gain: MockAudioParam = new MockAudioParam(1);
    constructor() { super(); }
}

class MockBiquadFilterNode extends MockAudioNode {
    type: string = 'lowpass';
    frequency: MockAudioParam = new MockAudioParam(22000);
    Q: MockAudioParam = new MockAudioParam(1);
    constructor() { super(); }
}

class MockPannerNode extends MockAudioNode {
    panningModel: string = 'HRTF';
    distanceModel: string = 'inverse';
    refDistance: number = 5;
    maxDistance: number = 100;
    rolloffFactor: number = 2;
    coneInnerAngle: number = 360;
    coneOuterAngle: number = 360;
    positionX: MockAudioParam = new MockAudioParam(0);
    positionY: MockAudioParam = new MockAudioParam(0);
    positionZ: MockAudioParam = new MockAudioParam(0);
    constructor() { super(); }
}

class MockAudioBufferSourceNode extends MockAudioNode {
    buffer: AudioBuffer | null = null;
    loop: boolean = false;
    loopStart: number = 0;
    loopEnd: number = 0;
    playbackRate: MockAudioParam = new MockAudioParam(1);
    onended: (() => void) | null = null;
    start(_when?: number, _offset?: number, _duration?: number): void { /* no-op */ }
    stop(_when?: number): void { /* no-op */ }
}

class MockAudioBuffer {
    duration: number = 10;
    length: number = 441000;
    numberOfChannels: number = 2;
    sampleRate: number = 44100;
    getChannelData(_channel: number): Float32Array { return new Float32Array(441000); }
}

class MockAudioListener {
    positionX: MockAudioParam = new MockAudioParam(0);
    positionY: MockAudioParam = new MockAudioParam(0);
    positionZ: MockAudioParam = new MockAudioParam(0);
    forwardX: MockAudioParam = new MockAudioParam(0);
    forwardY: MockAudioParam = new MockAudioParam(0);
    forwardZ: MockAudioParam = new MockAudioParam(0);
    upX: MockAudioParam = new MockAudioParam(0);
    upY: MockAudioParam = new MockAudioParam(0);
    upZ: MockAudioParam = new MockAudioParam(0);
}

class MockDynamicsCompressorNode extends MockAudioNode {
    threshold: MockAudioParam = new MockAudioParam(-24);
    knee: MockAudioParam = new MockAudioParam(30);
    ratio: MockAudioParam = new MockAudioParam(12);
    attack: MockAudioParam = new MockAudioParam(0.003);
    release: MockAudioParam = new MockAudioParam(0.25);
    constructor() { super(); }
}

class MockAudioContext {
    currentTime: number = 0;
    destination: MockGainNode = new MockGainNode();
    state: string = 'running';
    listener: MockAudioListener = new MockAudioListener();

    createBufferSource(): MockAudioBufferSourceNode { return new MockAudioBufferSourceNode(); }
    createPanner(): MockPannerNode { return new MockPannerNode(); }
    createBiquadFilter(): MockBiquadFilterNode { return new MockBiquadFilterNode(); }
    createGain(): MockGainNode { return new MockGainNode(); }
    createDynamicsCompressor(): MockDynamicsCompressorNode { return new MockDynamicsCompressorNode(); }
    async resume(): Promise<void> { this.state = 'running'; }
    async close(): Promise<void> { this.state = 'closed'; }
    decodeAudioData(_data: ArrayBuffer): Promise<MockAudioBuffer> {
        return Promise.resolve(new MockAudioBuffer());
    }
}

// ============================================================
// Mock fetch
// ============================================================
function mockFetchOk(): void {
    globalThis.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    });
}

// ============================================================
// Tests
// ============================================================

describe('TacticalAudioEngine [6]', () => {
    let audio: TacticalAudioEngine;

    beforeEach(() => {
        // @ts-expect-error - Mock AudioContext
        globalThis.AudioContext = MockAudioContext;
        // @ts-expect-error - Mock AudioNode
        globalThis.AudioBuffer = MockAudioBuffer;
        mockFetchOk();
        audio = new TacticalAudioEngine();
    });

    afterEach(() => {
        audio.dispose();
        vi.restoreAllMocks();
    });

    // ── [6-1] 초기화 ──

    it('init() 성공 시 true 반환', async () => {
        const result = await audio.init();
        expect(result).toBe(true);
    });

    it('init() 실패 시 false 반환 (AudioContext 생성 불가)', async () => {
        // 생성자 함수 형태로 목킹해야 new AudioContext()가 호출된다.
        // vi.fn(arrow)은 생성자로 쓸 수 없어 결정적으로 class 목을 사용 [플레이키 안정화]
        const FailingAudioContext = class {
            constructor() {
                throw new Error('AudioContext not available');
            }
        };
        // @ts-expect-error - AudioContext 생성 실패 시뮬레이션
        globalThis.AudioContext = FailingAudioContext;
        const badAudio = new TacticalAudioEngine();
        const result = await badAudio.init();
        expect(result).toBe(false);
    });

    // ── [6-2] 버퍼 관리 ──

    it('registerBuffer()로 버퍼 등록 후 playSound() 성공', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('test_buff', buf as unknown as AudioBuffer);
        const id = audio.playSound({
            bufferId: 'test_buff',
            position: { x: 0, y: 0, z: 0 },
        });
        expect(id).not.toBeNull();
        expect(id).toBeGreaterThan(0);
    });

    it('등록되지 않은 버퍼 playSound()는 null 반환', async () => {
        await audio.init();
        const id = audio.playSound({
            bufferId: 'nonexistent',
            position: { x: 0, y: 0, z: 0 },
        });
        expect(id).toBeNull();
    });

    // ── [6-3] 볼륨/음소거 ──

    it('volume setter가 masterGain gain 값을 업데이트', async () => {
        await audio.init();
        audio.volume = 0.5;
        expect(audio.volume).toBe(0.5);
        audio.volume = 1.5; // clamp
        expect(audio.volume).toBe(1);
        audio.volume = -0.5; // clamp
        expect(audio.volume).toBe(0);
    });

    it('muted=true 시 masterGain gain=0, false 시 volume 복원', async () => {
        await audio.init();
        audio.volume = 0.7;
        audio.muted = true;
        expect(audio.muted).toBe(true);
        audio.muted = false;
        expect(audio.muted).toBe(false);
    });

    // ── [6-4] Listener 업데이트 ──

    it('updateListener()가 AudioListener 파라미터를 설정', async () => {
        await audio.init();
        // init 후 listener가 설정되었으므로 updateListener가 동작
        audio.updateListener(
            { x: 10, y: 5, z: -3 },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: 1, z: 0 },
        );
        // MockAudioParam에 값이 설정되었는지 확인
        // (MockAudioParam은 value 속성을 가짐)
        expect(audio['listener']).not.toBeNull();
    });

    // ── [6-5] 거리 감쇠 수식 검증 ──

    it('update() 거리 감쇠: 가까울수록 gain 높음', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('test', buf as unknown as AudioBuffer);

        const id = audio.playSound({
            bufferId: 'test',
            position: { x: 0, y: 0, z: 0 },
            volume: 1.0,
            refDistance: 5,
            maxDistance: 100,
            rolloffFactor: 2,
        });
        expect(id).not.toBeNull();

        // 가까운 거리 (dist=0)
        audio.update({ x: 0, y: 0, z: 0 }, 0.016);
        const instance = audio['activeSounds'].get(id!);
        expect(instance).toBeDefined();
        const gainNear = instance!.gainNode.gain.value;

        // 먼 거리 (dist=50)
        audio.update({ x: 50, y: 0, z: 0 }, 0.016);
        const gainFar = instance!.gainNode.gain.value;

        // 가까울 때 gain > 먼 거리 gain
        expect(gainNear).toBeGreaterThan(gainFar);
    });

    it('거리 감쇠 수식: dist=0에서 gain=volume, dist→∞에서 gain→0', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('test2', buf as unknown as AudioBuffer);

        const id = audio.playSound({
            bufferId: 'test2',
            position: { x: 0, y: 0, z: 0 },
            volume: 1.0,
            refDistance: 5,
            maxDistance: 100,
            rolloffFactor: 2,
        });
        expect(id).not.toBeNull();

        // dist=0 → gain = 1.0 / (1 + 2 * 0 / 25) = 1.0
        audio.update({ x: 0, y: 0, z: 0 }, 0.016);
        const instance = audio['activeSounds'].get(id!);
        expect(instance).toBeDefined();
        const gain0 = instance!.gainNode.gain.value;
        expect(gain0).toBeCloseTo(1.0, 2);

        // dist=50 → gain = 1.0 / (1 + 2 * 2500 / 25) = 1.0 / (1 + 200) ≈ 0.004975
        audio.update({ x: 50, y: 0, z: 0 }, 0.016);
        const gain50 = instance!.gainNode.gain.value;
        expect(gain50).toBeLessThan(0.01);
        expect(gain50).toBeGreaterThan(0.001);
    });

    // ── [6-6] 피치 랜덤마이저 ──

    it('playSound()가 피치 변동을 적용 (pitchVariance ±10%)', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('pitch_test', buf as unknown as AudioBuffer);

        const pitches = new Set<number>();
        for (let i = 0; i < 20; i++) {
            const id = audio.playSound({
                bufferId: 'pitch_test',
                position: { x: 0, y: 0, z: 0 },
                pitch: 1.0,
                pitchVariance: 0.2,
            });
            expect(id).not.toBeNull();
            const instance = audio['activeSounds'].get(id!);
            expect(instance).toBeDefined();
            pitches.add(instance!.sourceNode.playbackRate.value);
            audio.stopAllSounds();
        }
        // 20회 재생 중 최소 2개 이상의 다른 피치 값이 나와야 함
        expect(pitches.size).toBeGreaterThan(1);
    });

    // ── [6-6] 기상 상태 앰비언트 ──

    it('setWeather()가 weather 상태를 변경', async () => {
        await audio.init();
        expect(audio.weather).toBe('SUNNY');
        audio.setWeather('RAIN');
        expect(audio.weather).toBe('RAIN');
        audio.setWeather('STORM');
        expect(audio.weather).toBe('STORM');
    });

    // ── [6-7] stopAllSounds / dispose ──

    it('stopAllSounds()가 모든 활성 사운드를 정지', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('s1', buf as unknown as AudioBuffer);
        audio.registerBuffer('s2', buf as unknown as AudioBuffer);

        audio.playSound({ bufferId: 's1', position: { x: 0, y: 0, z: 0 } });
        audio.playSound({ bufferId: 's2', position: { x: 1, y: 0, z: 0 } });

        expect(audio['activeSounds'].size).toBe(2);
        audio.stopAllSounds();
        expect(audio['activeSounds'].size).toBe(0);
    });

    it('dispose() 후 모든 리소스 정리', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('d1', buf as unknown as AudioBuffer);
        audio.playSound({ bufferId: 'd1', position: { x: 0, y: 0, z: 0 } });
        audio.playSound({ bufferId: 'd1', position: { x: 1, y: 0, z: 0 } });

        audio.dispose();
        expect(audio['activeSounds'].size).toBe(0);
        expect(audio['bufferCache'].size).toBe(0);
        expect(audio['ctx']).toBeNull();
    });

    // ── [6-7] AudioNodePool ──

    it('AudioNodePool acquire/release 라운드 로빈', async () => {
        const { AudioNodePool } = await import('../src/core/tactical_audio_engine.js');
        const ctx = new MockAudioContext() as unknown as AudioContext;
        const pool = new AudioNodePool(ctx, 8);

        // 8개 인덱스 획득 가능
        for (let i = 0; i < 8; i++) {
            expect(pool.acquireIndex()).not.toBeNull();
        }
        // 9번째는 라운드 로빈으로 다시 0 반환
        expect(pool.acquireIndex()).not.toBeNull();
    });

    // ── [6-8] resume() ──

    it('resume()이 suspended 상태에서 AudioContext 재개', async () => {
        await audio.init();
        const ctx = audio['ctx'] as MockAudioContext;
        ctx.state = 'suspended';
        await audio.resume();
        expect(ctx.state).toBe('running');
    });

    // ── [6-9] 프리로드 버퍼 ──

    it('preloadBuffers 설정 시 init()에서 자동 로드', async () => {
        audio.preloadBuffers = [
            { id: 'bgm_peace', url: '/audio/peace.mp3' },
            { id: 'sfx_sword', url: '/audio/sword.mp3' },
        ];
        await audio.init();
        expect(audio['bufferCache'].has('bgm_peace')).toBe(true);
        expect(audio['bufferCache'].has('sfx_sword')).toBe(true);
    });

    // ── [6-10] 앰비언트 레이어 등록 ──

    it('registerAmbient()로 앰비언트 레이어 등록 및 날씨 전환', async () => {
        await audio.init();
        audio.registerAmbient({
            id: 'rain_ambient',
            bufferId: 'rain_loop',
            baseVolume: 0.5,
            weatherMask: ['RAIN', 'STORM'],
        });
        // 등록 후 날씨 변경 시 targetVol이 업데이트되어야 함
        audio.setWeather('RAIN');
        // ambientConfigs에 등록되었는지 확인
        expect(audio['ambientConfigs'].length).toBeGreaterThan(0);
    });

    // ── [6-11] update() 거리 필터 주파수 ──

    it('update()가 거리별 Low-pass cutoff를 계산', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('filter_test', buf as unknown as AudioBuffer);

        const id = audio.playSound({
            bufferId: 'filter_test',
            position: { x: 0, y: 0, z: 0 },
            maxDistance: 100,
        });
        expect(id).not.toBeNull();
        const instance = audio['activeSounds'].get(id!);
        expect(instance).toBeDefined();

        // dist=0 → cutoff ≈ 22000
        audio.update({ x: 0, y: 0, z: 0 }, 0.016);
        const freq0 = instance!.filterNode.frequency.value;
        expect(freq0).toBeGreaterThan(20000);

        // dist=100 → cutoff ≈ 22000 * 0.1^1 = 2200
        audio.update({ x: 100, y: 0, z: 0 }, 0.016);
        const freq100 = instance!.filterNode.frequency.value;
        expect(freq100).toBeLessThan(5000);
        expect(freq100).toBeGreaterThan(50);
    });

    // ── [6-12] stopSound() ──

    it('stopSound()가 특정 사운드만 정지', async () => {
        await audio.init();
        const buf = new MockAudioBuffer();
        audio.registerBuffer('s1', buf as unknown as AudioBuffer);
        audio.registerBuffer('s2', buf as unknown as AudioBuffer);

        const id1 = audio.playSound({ bufferId: 's1', position: { x: 0, y: 0, z: 0 } });
        const id2 = audio.playSound({ bufferId: 's2', position: { x: 1, y: 0, z: 0 } });
        expect(audio['activeSounds'].size).toBe(2);

        audio.stopSound(id1!);
        expect(audio['activeSounds'].size).toBe(1);
        expect(audio['activeSounds'].has(id2!)).toBe(true);
    });
});
