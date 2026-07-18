/**
 * [33-40][44][47][48] 게임 FSM 상태 클래스들
 *
 * 포함 상태:
 *   33. DomesticState - 평정 상태
 *   34. StrategyState - 전략/외교 상태
 *   35. BattleState - 전투 상태
 *   36. EventPlayingState - 이벤트 연출 상태
 *   37. MiniGameBridgeState - 미니게임 상태
 *   38. FiscalSettlementState - 경제 결산 상태
 *   39. MoraleSettlementState - 치안/군량 정산 상태
 *   40. SaveLoadState - 직렬화 상태
 *   44. WorldMapState - 월드맵 상태
 *   47. DebriefingState - 전투 사후 평가 상태
 *   48. GameOverState - 게임 오버 상태
 */

import { FSMState } from './fsm_state.js';

export class DomesticState extends FSMState {
    constructor() { super('DOMESTIC'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[DomesticState] 평정 단계 시작');
        const factionId = context.factionId as string | undefined;
        if (factionId) console.log(`[DomesticState] 세력 ${factionId} 내정 안건 평가`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[DomesticState] 평정 단계 종료'); }
}

export class StrategyState extends FSMState {
    constructor() { super('STRATEGY'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[StrategyState] 전략/외교 단계 시작');
        const aiPending = context.aiPending as boolean | undefined;
        if (aiPending) {
            console.log('[StrategyState] AI 세력 외교 연산 대기');
        }
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[StrategyState] 전략 단계 종료'); }
}

export class BattleState extends FSMState {
    private battleComplete = false;

    constructor() { super('BATTLE'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[BattleState] 전투 씬 진입');
        this.battleComplete = false;
        const battleId = context.battleId as string ?? 'unknown';
        console.log(`[BattleState] 전투 ID: ${battleId}`);
    }

    onUpdate(dt: number): void {
        if (this.battleComplete) return;
    }

    onExit(): void { console.log('[BattleState] 전투 씬 종료'); }

    setBattleComplete(): void { this.battleComplete = true; }
}

export class EventPlayingState extends FSMState {
    constructor() { super('EVENT_PLAYING'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[EventState] 이벤트 연출 시작');
        const eventId = context.eventId as string ?? 'unknown';
        console.log(`[EventState] 이벤트 ID: ${eventId}, 사용자 입력 차단`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[EventState] 이벤트 연출 종료'); }
}

export class MiniGameBridgeState extends FSMState {
    constructor() { super('MINIGAME'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[MiniGameState] 미니게임 실행');
        const gameType = context.gameType as string ?? 'unknown';
        console.log(`[MiniGameState] 타입: ${gameType}`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[MiniGameState] 미니게임 종료'); }
}

export class FiscalSettlementState extends FSMState {
    constructor() { super('FISCAL'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[FiscalState] 경제 결산 시작');
        const season = context.season as string ?? 'unknown';
        console.log(`[FiscalState] 계절: ${season} - 세금/녹봉/시세 정산`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[FiscalState] 경제 결산 완료'); }
}

export class MoraleSettlementState extends FSMState {
    constructor() { super('MORALE'); }

    async onEnter(): Promise<void> {
        console.log('[MoraleState] 치안/군량 정산');
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[MoraleState] 정산 완료'); }
}

export class SaveLoadState extends FSMState {
    constructor() { super('SAVE_LOAD'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        const mode = context.mode as string ?? 'save';
        console.log(`[SaveLoadState] ${mode} 모드 시작 - 게임 루프 동결`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[SaveLoadState] I/O 완료 - 게임 루프 재개'); }
}

export class WorldMapState extends FSMState {
    constructor() { super('WORLD_MAP'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[WorldMapState] 월드맵 진입');
        const factionId = context.factionId as string | undefined;
        if (factionId) console.log(`[WorldMapState] 세력 ${factionId} 영역 표시`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[WorldMapState] 월드맵 종료'); }
}

export class DebriefingState extends FSMState {
    constructor() { super('DEBRIEFING'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[DebriefingState] 전투 평가');
        const victory = context.victory as boolean | undefined;
        console.log(`[DebriefingState] 결과: ${victory ? '승리' : '패배'}`);
    }

    onUpdate(dt: number): void {}
    onExit(): void { console.log('[DebriefingState] 평가 완료'); }
}

export class GameOverState extends FSMState {
    constructor() { super('GAME_OVER'); }

    async onEnter(context: Record<string, unknown>): Promise<void> {
        console.log('[GameOverState] 게임 종료');
        const reason = context.reason as string ?? 'unknown';
        console.log(`[GameOverState] 사유: ${reason}`);
    }

    onUpdate(dt: number): void {}
    onExit(): void {}
}
