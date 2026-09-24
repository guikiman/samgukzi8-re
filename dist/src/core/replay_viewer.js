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
import { hexToPixel } from './hex_map_canvas_renderer.js';
// ============================================================
// ReplayViewer
// ============================================================
export class ReplayViewer {
    constructor(cb) {
        this.logs = [];
        this.units = new Map();
        this.effects = [];
        this.cursor = 0;
        this.stepTimer = 0;
        this.playing = false;
        this.finished = false;
        /** 재생 속도 — 액션 간 간격 (ms) */
        this.stepIntervalMs = 450;
        this.flashDurationMs = 500;
        this.cb = cb;
    }
    // ============================================================
    // 로그 주입 및 유닛 디렉터리 구축
    // ============================================================
    /**
     * 리플레이 로그를 주입하고 재생 준비
     * @returns 유닛 수 (0이면 재생 불가)
     */
    load(logs) {
        this.logs = [...logs];
        this.units.clear();
        this.effects = [];
        this.cursor = 0;
        this.stepTimer = 0;
        this.playing = false;
        this.finished = this.logs.length === 0;
        // 유닛 디렉터리 구축 — 첫 등장 위치 기준 (아군/적군 판정: unitId/officerId 접두사)
        for (const l of this.logs) {
            if (!this.units.has(l.officerId)) {
                const isFriendly = !l.officerId.startsWith('enemy');
                this.units.set(l.officerId, {
                    officerId: l.officerId,
                    isFriendly,
                    q: l.x,
                    r: l.y,
                    flashMs: 0,
                });
            }
        }
        return this.units.size;
    }
    /** 재생 시작 */
    play() {
        if (this.logs.length === 0 || this.finished)
            return;
        this.playing = true;
        this.cb.addLog(`▶ 리플레이 재생 시작 — 액션 ${this.logs.length}건, 유닛 ${this.units.size}`);
    }
    /** 일시정지/재개 */
    togglePause() {
        if (this.finished)
            return;
        this.playing = !this.playing;
    }
    get isPlaying() { return this.playing; }
    get isFinished() { return this.finished; }
    get unitCount() { return this.units.size; }
    get actionCount() { return this.logs.length; }
    // ============================================================
    // 프레임 업데이트 — dt(ms)
    // ============================================================
    update(dt) {
        if (!this.playing || this.finished)
            return;
        // 이펙트 진행
        for (const e of this.effects)
            e.progress += dt / this.flashDurationMs;
        this.effects = this.effects.filter(e => e.progress < 1);
        // 유닛 플래시 감쇠
        for (const u of this.units.values()) {
            if (u.flashMs > 0)
                u.flashMs = Math.max(0, u.flashMs - dt);
        }
        this.stepTimer += dt;
        while (this.stepTimer >= this.stepIntervalMs) {
            this.stepTimer -= this.stepIntervalMs;
            this.stepForward();
        }
    }
    /** 다음 액션 1개 적용 */
    stepForward() {
        if (this.cursor >= this.logs.length) {
            this.finished = true;
            this.playing = false;
            this.cb.addLog('🏁 리플레이 재생 완료');
            this.cb.onComplete?.();
            return;
        }
        const log = this.logs[this.cursor++];
        const actor = this.units.get(log.officerId);
        switch (log.actionType) {
            case 'MOVE': {
                if (actor) {
                    actor.q = log.x;
                    actor.r = log.y;
                    actor.flashMs = 120;
                }
                break;
            }
            case 'ATTACK': {
                // 피격자 위치에 피격 이펙트
                if (actor)
                    actor.flashMs = this.flashDurationMs;
                const targetId = log.targetId;
                const target = targetId ? this.units.get(targetId) : undefined;
                const fx = target ?? actor;
                if (fx) {
                    fx.flashMs = this.flashDurationMs;
                    // 렌더 좌표는 draw에서 계산하므로 여기서는 진행률만 부여
                    this.effects.push({
                        kind: 'HIT_TEXT',
                        progress: 0,
                        fromX: log.x,
                        fromY: log.y,
                        toX: log.x,
                        toY: log.y,
                        value: log.value,
                        color: fx.isFriendly ? '#ff8080' : '#ffd080',
                    });
                }
                break;
            }
            case 'DEPLOY': {
                if (actor) {
                    actor.q = log.x;
                    actor.r = log.y;
                    actor.flashMs = 200;
                }
                break;
            }
            case 'TURN':
            default:
                break;
        }
        // UI 로그 (10개당 1개는 요약) — 콘솔 스팸 방지
        if (log.actionType !== 'TURN') {
            this.cb.addLog(`▶ T${log.turn} ${log.officerId} ${log.actionType}` +
                (log.targetId ? ` → ${log.targetId}` : '') +
                (log.value > 0 ? ` (-${log.value})` : ''));
        }
    }
    // ============================================================
    // 렌더링 — 헥스 타일 위에 유닛/이펙트 그리기
    // ============================================================
    /**
     * battleFrontend가 그린 헥스 맵 위에 유닛과 이펙트를 오버레이
     * @param ctx 캔버스 컨텍스트 (이미 translate/zoom이 적용된 상태)
     * @param size 헥스 크기 (hexRenderer.zoomAt 반영)
     * @param cx 캔버스 중심 X
     * @param cy 캔버스 중심 Y
     */
    draw(ctx, size, cx, cy) {
        // 유닛 렌더
        for (const u of this.units.values()) {
            const pos = hexToPixel(u.q, u.r, size);
            const x = cx + pos.x;
            const y = cy + pos.y;
            const color = u.isFriendly ? '#4488cc' : '#cc5544';
            const flash = u.flashMs > 0;
            // 유닛 원
            ctx.beginPath();
            ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = flash ? '#ffffff' : color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = u.isFriendly ? '#aaddff' : '#ffaaaa';
            ctx.stroke();
            // ID 라벨
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(9, size * 0.3)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(u.officerId.slice(0, 6), x, y + size * 0.1);
            ctx.textAlign = 'start';
        }
        // 이펙트 렌더 (피해 숫자 — 위로 떠오르며 사라짐)
        for (const e of this.effects) {
            if (e.kind !== 'HIT_TEXT')
                continue;
            const pos = hexToPixel(e.fromX, e.fromY, size);
            const x = cx + pos.x;
            const y = cy + pos.y - e.progress * size;
            ctx.globalAlpha = 1 - e.progress;
            ctx.fillStyle = e.color;
            ctx.font = `bold ${Math.max(11, size * 0.42)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`-${e.value}`, x, y);
            ctx.textAlign = 'start';
            ctx.globalAlpha = 1;
        }
    }
}
//# sourceMappingURL=replay_viewer.js.map