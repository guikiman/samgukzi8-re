/**
 * 이벤트 연출 시스템 [191-200: 연출/사운드 디테일]
 *
 * 게임 로그성 이벤트(복수/구출/멸망/등용 원수화)에 즉각적인 감각 피드백을 제공한다:
 *  - 화면 흔들림: canvas 렌더 전 ctx.translate로 오프셋 적용 (감쇠 진동)
 *  - 사운드: Web Audio API 기반 합성음 — 외부 파일 불필요 (오프라인 지원 [X])
 *
 * 순수 상태 머신으로 UI(main.ts)와 완전 분리. update(dt) → getShakeOffset(),
 * play(kind) → 사운드 1회 재생. prefers-reduced-motion 대응은 UI 측에서 disableShake().
 */
export class EventFeedbackEffects {
    constructor() {
        this.shake = { intensity: 0, decay: 6, time: 0, freq: 28 };
        this.audioCtx = null;
        this.shakeEnabled = true;
        this.soundEnabled = true;
    }
    /** 흔들림 시작 — 종류별 진폭 차등 */
    trigger(kind) {
        const intensityByKind = {
            VENGEANCE_SUCCESS: 9,
            VENGEANCE_FAIL: 5,
            RESCUE: 6,
            FACTION_DESTROYED: 14,
            CAPTIVE_RECRUIT_PENALTY: 7,
        };
        if (!this.shakeEnabled)
            return;
        // 이미 흔들림 중이면 더 강한 것만 채택
        this.shake.intensity = Math.max(this.shake.intensity, intensityByKind[kind]);
        this.shake.time = 0;
    }
    /** 매 프레임 호출 — 경과 시간 반영 후 흔들림 오프셋 반환 */
    update(dt) {
        const s = this.shake;
        if (s.intensity <= 0.1 || !this.shakeEnabled)
            return { x: 0, y: 0 };
        s.time += dt;
        s.intensity *= Math.max(0, 1 - s.decay * dt);
        const x = Math.sin(s.time * s.freq * Math.PI) * s.intensity;
        const y = Math.cos(s.time * s.freq * Math.PI * 1.3) * s.intensity * 0.6;
        return { x, y };
    }
    /** 현재 흔들림 중인지 */
    isShaking() {
        return this.shakeEnabled && this.shake.intensity > 0.1;
    }
    /** 이벤트 사운드 — Web Audio 합성음 (파일 없음) */
    playSound(kind) {
        if (!this.soundEnabled)
            return;
        try {
            this.audioCtx ?? (this.audioCtx = new AudioContext());
            const ctx = this.audioCtx;
            if (ctx.state === 'suspended')
                void ctx.resume();
            const now = ctx.currentTime;
            const gain = ctx.createGain();
            gain.connect(ctx.destination);
            switch (kind) {
                case 'VENGEANCE_SUCCESS': {
                    // 상승 3음 아르페지오 — 쾌감
                    [523, 659, 784].forEach((f, i) => {
                        const osc = ctx.createOscillator();
                        const g = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = f;
                        g.gain.setValueAtTime(0.12, now + i * 0.09);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
                        osc.connect(g).connect(ctx.destination);
                        osc.start(now + i * 0.09);
                        osc.stop(now + i * 0.09 + 0.3);
                    });
                    break;
                }
                case 'VENGEANCE_FAIL': {
                    // 하강 2음 — 좌절
                    [330, 220].forEach((f, i) => {
                        const osc = ctx.createOscillator();
                        const g = ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.value = f;
                        g.gain.setValueAtTime(0.08, now + i * 0.12);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                        osc.connect(g).connect(ctx.destination);
                        osc.start(now + i * 0.12);
                        osc.stop(now + i * 0.12 + 0.35);
                    });
                    break;
                }
                case 'RESCUE': {
                    // 밝은 2음 — 희망
                    [440, 587].forEach((f, i) => {
                        const osc = ctx.createOscillator();
                        const g = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = f;
                        g.gain.setValueAtTime(0.1, now + i * 0.1);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.28);
                        osc.connect(g).connect(ctx.destination);
                        osc.start(now + i * 0.1);
                        osc.stop(now + i * 0.1 + 0.3);
                    });
                    break;
                }
                case 'FACTION_DESTROYED': {
                    // 저음 붕괴음 — 장중함
                    const osc = ctx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(110, now);
                    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
                    osc.connect(gain);
                    osc.start(now);
                    osc.stop(now + 1.0);
                    break;
                }
                case 'CAPTIVE_RECRUIT_PENALTY': {
                    // 경고음 2회 — 긴장
                    [0, 0.18].forEach(delay => {
                        const osc = ctx.createOscillator();
                        const g = ctx.createGain();
                        osc.type = 'square';
                        osc.frequency.value = 660;
                        g.gain.setValueAtTime(0.06, now + delay);
                        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
                        osc.connect(g).connect(ctx.destination);
                        osc.start(now + delay);
                        osc.stop(now + delay + 0.15);
                    });
                    break;
                }
            }
        }
        catch {
            // Web Audio 미지원 환경 무음 처리
        }
    }
    /** 연출 트리거 + 사운드 동시 실행 (일반 진입점) */
    fire(kind) {
        this.trigger(kind);
        this.playSound(kind);
    }
    /** 접근성 — 모션 최소화 설정 시 흔들림 비활성 */
    disableShake() { this.shakeEnabled = false; }
    enableShake() { this.shakeEnabled = true; }
    disableSound() { this.soundEnabled = false; }
    enableSound() { this.soundEnabled = true; }
}
//# sourceMappingURL=event_feedback_effects.js.map