/**
 * [312] 전투 리플레이 재생 뷰어 — ReplayViewer
 *
 * 공유된 리플레이 URL 파라미터(?replay=...)의 압축 로그를 복원해
 * 헥스 맵 위에서 유닛 이동/공격을 애니메이션으로 재생한다.
 *
 * 본 게임 흐름과 완전히 격리된 독립 모듈 (AGENTS.md 행동 강령 2):
 *   - main.ts는 checkReplayParam()에서 import해 사용
 *   - Canvas에 직접 접근하지 않고 requestAnimationFrame 콜백으로 그리기 함수만 제공
 *
 * 재생 모델:
 *   로그 (t, o, a, g, v, x, y) → 유닛 디렉터리 구축 → 턴 단위 스냅샷 재생
 *   - MOVE  : 유닛 위치를 (x, y)로 갱신
 *   - ATTACK: 공격자 위치에서 피격자 방향으로 발사체 이펙트 + 피해 숫자 표시
 *   - TURN  : 턴 구분선 (로그만 표시)
 */
import type { ReplayActionLog } from './replay_share_manager.js';
export interface ReplayUnitState {
    readonly officerId: string;
    /** 아군(friendly) 여부 — unitId 접두사로 판정 */
    readonly isFriendly: boolean;
    q: number;
    r: number;
    /** 공격/피격 시 플래시 타이머 (ms, 0 이상이면 이펙트 표시) */
    flashMs: number;
}
export interface ReplayEffect {
    /** 이펙트 종류 */
    kind: 'SHOT' | 'HIT_TEXT';
    /** 진행률 0~1 */
    progress: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    /** HIT_TEXT일 때 표시할 피해 수치 */
    value: number;
    color: string;
}
export interface ReplayViewerCallbacks {
    /** 로그 한 줄을 UI 로그에 출력 */
    addLog: (msg: string) => void;
    /** 재생 완료 콜백 */
    onComplete?: () => void;
}
export declare class ReplayViewer {
    private logs;
    private units;
    private effects;
    private cursor;
    private stepTimer;
    private playing;
    private finished;
    /** 재생 속도 — 액션 간 기본 간격 (ms) */
    private stepIntervalMs;
    /** 재생 속도 배율 [461-480] — 1x 기본, 0.5x~4x */
    private speedMultiplier;
    private readonly flashDurationMs;
    private readonly cb;
    constructor(cb: ReplayViewerCallbacks);
    /**
     * 리플레이 로그를 주입하고 재생 준비
     * @returns 유닛 수 (0이면 재생 불가)
     */
    load(logs: readonly ReplayActionLog[]): number;
    /** 재생 시작 */
    play(): void;
    /** 일시정지/재개 */
    togglePause(): void;
    /** 재생 속도 배율 설정 (0.5x ~ 4x) — 액션 간격을 역수로 조절 */
    setSpeed(multiplier: number): void;
    get speed(): number;
    /** 커서 위치 (진행률 표시용) */
    get progress(): number;
    get isPlaying(): boolean;
    get isFinished(): boolean;
    get unitCount(): number;
    get actionCount(): number;
    update(dt: number): void;
    /** 다음 액션 1개 적용 */
    private stepForward;
    /**
     * battleFrontend가 그린 헥스 맵 위에 유닛과 이펙트를 오버레이
     * @param ctx 캔버스 컨텍스트 (이미 translate/zoom이 적용된 상태)
     * @param size 헥스 크기 (hexRenderer.zoomAt 반영)
     * @param cx 캔버스 중심 X
     * @param cy 캔버스 중심 Y
     */
    draw(ctx: CanvasRenderingContext2D, size: number, cx: number, cy: number): void;
}
//# sourceMappingURL=replay_viewer.d.ts.map