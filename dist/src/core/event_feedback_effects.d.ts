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
/** 연출 종류 */
export type FeedbackKind = 'VENGEANCE_SUCCESS' | 'VENGEANCE_FAIL' | 'RESCUE' | 'FACTION_DESTROYED' | 'CAPTIVE_RECRUIT_PENALTY';
export declare class EventFeedbackEffects {
    private shake;
    private audioCtx;
    private shakeEnabled;
    private soundEnabled;
    /** 흔들림 시작 — 종류별 진폭 차등 */
    trigger(kind: FeedbackKind): void;
    /** 매 프레임 호출 — 경과 시간 반영 후 흔들림 오프셋 반환 */
    update(dt: number): {
        x: number;
        y: number;
    };
    /** 현재 흔들림 중인지 */
    isShaking(): boolean;
    /** 이벤트 사운드 — Web Audio 합성음 (파일 없음) */
    playSound(kind: FeedbackKind): void;
    /** 연출 트리거 + 사운드 동시 실행 (일반 진입점) */
    fire(kind: FeedbackKind): void;
    /** 접근성 — 모션 최소화 설정 시 흔들림 비활성 */
    disableShake(): void;
    enableShake(): void;
    disableSound(): void;
    enableSound(): void;
}
//# sourceMappingURL=event_feedback_effects.d.ts.map