/**
 * 복수 이벤트 시스템 [32][33][C-인간관계]
 *
 * 원수(NEMESIS) 관계인 두 무장이 전투에서 조우하면:
 *  - 무력이 높은 쪽이 복수를 노려 단기접전(일기토)을 제안
 *  - 지력이 높은 쪽이 복수를 노려 설전(논쟁)으로 도발
 *  - 승리: 우호도 대폭 상승 + 상대 사기 감소 / 복수 성사
 *  - 패배/무승부: 원한이 더 깊어짐 (우호도 추가 하락)
 *
 * 미니게임 엔진(duel/debate)과 완전히 분리된 트리거 판정 계층으로,
 * 본 게임 흐름(전투 시작/월간 처리)에서 호출만으로 동작한다.
 * 카드 선택은 executeInteraction과 동일한 자동 플레이 방식.
 */

import type { GameStore } from './game_store.js';
import type { Officer } from './types.js';
import { DuelMinigame, type DuelState, type DuelCardType } from './duel_minigame.js';
import { DebateMinigame, type DebateState, type DebateCardType } from './debate_minigame.js';

/** 복수 이벤트 종류 */
export type VengeanceKind = 'DUEL' | 'DEBATE';

/** 복수 이벤트 발동 확률 (조우 1회당) */
export const VENGEANCE_CHANCE = 0.45;

/** 복수 성사 시 우호도 상승량 (원한 해소) */
export const VENGEANCE_SUCCESS_AFFINITY = +40;

/** 복수 실패 시 우호도 추가 하락량 (원한 심화) */
export const VENGEANCE_FAIL_AFFINITY = -15;

/** 복수 성공 시 상대 유닛 사기 감소량 */
export const VENGEANCE_MORALE_HIT = 15;

/** 복수 이벤트 판정 결과 */
export interface VengeanceOutcome {
    /** 이벤트 발동 여부 */
    readonly triggered: boolean;
    readonly kind: VengeanceKind | null;
    /** 복수를 시도한 무장 (발동 시에만) */
    readonly actorId: string | null;
    /** 복수의 대상 무장 */
    readonly targetId: string | null;
    /** 복수 성공 여부 (발동 시에만) */
    readonly success: boolean | null;
    /** 적용된 우호도 변화 */
    readonly affinityDelta: number;
    /** 상대 유닛 사기 감소 (전투 UI 반영용) */
    readonly targetMoraleHit: number;
    /** 게임 로그용 메시지 */
    readonly message: string;
}

/** NEMESIS 이벤트 없음 결과 (공용 인스턴스) */
const NO_VENGEANCE: VengeanceOutcome = {
    triggered: false, kind: null, actorId: null, targetId: null,
    success: null, affinityDelta: 0, targetMoraleHit: 0,
    message: '',
};

/**
 * 두 무장이 원수 관계인지 확인 (양방향 엣지 조회)
 */
export function areNemesis(store: GameStore, aId: string, bId: string): boolean {
    if (aId === bId) return false;
    const forward = store.getRelationships(aId).find(e => e.target === bId);
    const reverse = store.getRelationships(bId).find(e => e.target === aId);
    return (forward?.type === 'NEMESIS') || (reverse?.type === 'NEMESIS');
}

/**
 * 복수 이벤트 발동 판정 (순수 함수 — 사이드 이펙트 없음)
 * NEMESIS 관계 + 확률을 통과해야 발동.
 * 종류는 무력/지력 우위로 결정: 무력 우위 → 단기접전, 지력 우위 → 설전.
 */
export function judgeVengeance(
    store: GameStore,
    aId: string,
    bId: string,
    roll: number,
    chance: number = VENGEANCE_CHANCE,
): { triggered: boolean; kind: VengeanceKind | null; actorId: string | null; targetId: string | null } {
    if (!areNemesis(store, aId, bId)) {
        return { triggered: false, kind: null, actorId: null, targetId: null };
    }
    if (roll >= chance) {
        return { triggered: false, kind: null, actorId: null, targetId: null };
    }
    const a = store.getOfficer(aId);
    const b = store.getOfficer(bId);
    if (!a || !b) return { triggered: false, kind: null, actorId: null, targetId: null };

    // 무력 우위 쪽이 복수 주도권을 잡고, 종류를 결정
    const aAggressive = a.stats.might >= b.stats.might;
    const actor = aAggressive ? a : b;
    const target = aAggressive ? b : a;
    // 무력이 지력보다 크면 단기접전, 아니면 설전
    const kind: VengeanceKind = actor.stats.might >= actor.stats.intelligence ? 'DUEL' : 'DEBATE';
    return { triggered: true, kind, actorId: actor.id, targetId: target.id };
}

/**
 * 복수 이벤트 실행 — 미니게임 자동 플레이 + 우호도/사기 적용.
 * judgeVengeance가 triggered일 때 호출한다. (전투 시작 시/월간 처리 시)
 */
export function executeVengeance(
    store: GameStore,
    actorId: string,
    targetId: string,
    kind: VengeanceKind,
): VengeanceOutcome {
    const actor = store.getOfficer(actorId);
    const target = store.getOfficer(targetId);
    if (!actor || !target) return NO_VENGEANCE;
    const { year, month } = store.getGlobalState().time;

    let success = false;
    let message = '';

    if (kind === 'DUEL') {
        // 단기접전 — 자동 플레이
        const duel = new DuelMinigame();
        duel.startDuel(actor.id, target.id, actor.stats, target.stats);
        let state: DuelState = duel.getState();
        while (!duel.isDuelOver()) {
            const cards = duel.getAvailableCards(state.playerSpirit);
            const pick = cards[Math.floor(Math.random() * cards.length)]?.type ?? 'SLASH';
            state = duel.playCard(pick as DuelCardType);
        }
        success = duel.getWinner() === actor.id;
        message = success
            ? `⚔️ 복수 성사! ${actor.name}이(가) 원수 ${target.name}과(와)의 단기접전에서 승리했습니다`
            : `⚔️ ${actor.name}의 복수 시도 실패 — ${target.name}이(가) 단기접전에서 버텨냈습니다`;
    } else {
        // 설전 — 자동 플레이
        const debate = new DebateMinigame();
        debate.startDebate(actor.id, target.id, actor.stats, target.stats, '원한의 논쟁');
        let state: DebateState = debate.getState();
        while (!debate.isDebateOver()) {
            const cards = debate.getAvailableCards(state.playerSpirit, state.playerMood);
            const pick = cards[Math.floor(Math.random() * cards.length)]?.type ?? 'LOGIC';
            state = debate.playCard(pick as DebateCardType);
        }
        const result = debate.getDebateResult();
        success = result.winner === actor.id;
        message = success
            ? `🎙️ 복수 성사! ${actor.name}이(가) 원수 ${target.name}을(를) 설전으로 굴복시켰습니다`
            : `🎙️ ${actor.name}의 설전 도발 실패 — ${target.name}이(가) 논박했습니다`;
    }

    // 우호도 양방향 동기화 (applyAffinity와 동일 패턴)
    const delta = success ? VENGEANCE_SUCCESS_AFFINITY : VENGEANCE_FAIL_AFFINITY;
    const forward = store.getRelationships(actorId).find(e => e.target === targetId);
    const reverse = store.getRelationships(targetId).find(e => e.target === actorId);
    for (const edge of [forward, reverse]) {
        if (!edge) continue;
        edge.affinity = Math.max(-100, Math.min(100, edge.affinity + delta));
        edge.history.push({ year, month, event: 'VENGEANCE', delta });
    }

    return {
        triggered: true,
        kind,
        actorId,
        targetId,
        success,
        affinityDelta: delta,
        // 복수 성공 시 대상 측 사기 감소 (전투 중이면 유닛에 반영 가능)
        targetMoraleHit: success ? VENGEANCE_MORALE_HIT : 0,
        message,
    };
}

/**
 * 전투 조우 복수 판정 — 두 무장 ID를 받아 복수 이벤트를 처리한다.
 * 전투 시작 시 아군/적군 유닛쌍마다 호출하고, 첫 발동만 채택한다.
 */
export function tryVengeanceOnEncounter(
    store: GameStore,
    aId: string,
    bId: string,
    roll: number = Math.random(),
): VengeanceOutcome {
    const judged = judgeVengeance(store, aId, bId, roll);
    if (!judged.triggered || !judged.kind || !judged.actorId || !judged.targetId) {
        return NO_VENGEANCE;
    }
    return executeVengeance(store, judged.actorId, judged.targetId, judged.kind);
}

/** 복수 판정 결과 — UI에서 플레이어 관여 여부를 결정할 때 사용 */
export interface VengeanceJudgement {
    triggered: boolean;
    kind: VengeanceKind | null;
    actorId: string | null;
    targetId: string | null;
}

/** 판정만 수행 (실행 없음) — UI가 플레이어 관여 여부를 판단한 뒤 실행 방식을 선택 */
export function judgeVengeanceOnly(
    store: GameStore,
    aId: string,
    bId: string,
    roll: number = Math.random(),
): VengeanceJudgement {
    return judgeVengeance(store, aId, bId, roll);
}

/**
 * 복수 이벤트를 새 미니게임 인스턴스로 시작한다 — 인터랙티브 UI용.
 * 반환된 게임 인스턴스를 UI가 카드 선택을 받아 진행하고,
 * 종료 후 finishVengeanceWithGame으로 후처리(우호도/명성)를 적용한다.
 */
export function startVengeanceGame(
    store: GameStore,
    actorId: string,
    targetId: string,
    kind: VengeanceKind,
): DuelMinigame | DebateMinigame {
    const actor = store.getOfficer(actorId);
    const target = store.getOfficer(targetId);
    if (!actor || !target) throw new Error('복수 이벤트 무장을 찾을 수 없습니다');
    if (kind === 'DUEL') {
        const duel = new DuelMinigame();
        duel.startDuel(actor.id, target.id, actor.stats, target.stats);
        return duel;
    }
    const debate = new DebateMinigame();
    debate.startDebate(actor.id, target.id, actor.stats, target.stats, '원한의 논쟁');
    return debate;
}

/**
 * 인터랙티브/자동 미니게임 종료 후 공통 후처리 — 우호도 동기화 + 명성 변동 [C-인간관계][11]
 * success는 actor 기준 승패. message는 UI에서 이미 표시했을 수 있다.
 */
export function finishVengeance(
    store: GameStore,
    actorId: string,
    targetId: string,
    success: boolean,
): VengeanceOutcome {
    const actor = store.getOfficer(actorId);
    if (!actor) return NO_VENGEANCE;
    const { year, month } = store.getGlobalState().time;

    // 우호도 양방향 동기화
    const delta = success ? VENGEANCE_SUCCESS_AFFINITY : VENGEANCE_FAIL_AFFINITY;
    const forward = store.getRelationships(actorId).find(e => e.target === targetId);
    const reverse = store.getRelationships(targetId).find(e => e.target === actorId);
    for (const edge of [forward, reverse]) {
        if (!edge) continue;
        edge.affinity = Math.max(-100, Math.min(100, edge.affinity + delta));
        edge.history.push({ year, month, event: 'VENGEANCE', delta });
    }

    // 명성/악명 변동 [11]: 복수 성공은 명성, 실패는 굴욕 (양쪽 모두 악명은 변동 없음)
    store.updateOfficer(actorId, {
        fame: Math.min(9999, actor.fame + (success ? 20 : -10)),
    });

    return {
        triggered: true,
        kind: null,
        actorId,
        targetId,
        success,
        affinityDelta: delta,
        targetMoraleHit: success ? VENGEANCE_MORALE_HIT : 0,
        message: success
            ? `복수 성사 — ${actor.name}의 명성이 높아졌습니다`
            : `복수 실패 — ${actor.name}은(는) 굴욕을 삼켰습니다`,
    };
}

/**
 * 월간 자유 복수 — 도시가 같은(또는 인접한) 원수 무장 간 월 1회 판정.
 * 엔진 월간 주기에서 호출. [C-인간관계]
 */
export function processMonthlyVengeance(store: GameStore): VengeanceOutcome[] {
    const outcomes: VengeanceOutcome[] = [];
    const officers: Officer[] = store.getAllOfficers().filter(o =>
        o.factionId !== null && o.status !== 'FREE' && o.runtime.isAlive);

    const processed = new Set<string>();
    for (let i = 0; i < officers.length; i++) {
        for (let j = i + 1; j < officers.length; j++) {
            const a = officers[i];
            const b = officers[j];
            const key = [a.id, b.id].sort().join('|');
            if (processed.has(key)) continue;
            if (!areNemesis(store, a.id, b.id)) continue;
            processed.add(key);
            const outcome = tryVengeanceOnEncounter(store, a.id, b.id);
            if (outcome.triggered) outcomes.push(outcome);
        }
    }
    return outcomes;
}
