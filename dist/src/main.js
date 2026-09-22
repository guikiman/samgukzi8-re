/**
 * 삼국지 8 리메이크 — 브라우저 엔트리 포인트
 *
 * GameEngine + BootstrapContext 초기화,
 * Canvas 렌더링 루프, UI 바인딩.
 */
import { getGameEngine } from './core/game_engine.js';
import { getBootstrap } from './core/bootstrap.js';
import { HexMapCanvasRenderer } from './core/hex_map_canvas_renderer.js';
import { ChinaMapRenderer } from './core/china_map_renderer.js';
import { BattleFrontend } from './core/battle_frontend.js';
import { TitleScreen } from './core/title_screen.js';
import { loadScenarios, getCachedScenarios, buildWorld, getKnownOfficerName } from './core/scenario_system.js';
import { MonthlyReportSystem } from './core/monthly_report.js';
import { assembleReinforcements } from './core/reinforcement_system.js';
import { SaveSlotManager } from './core/save_slot_manager.js';
import { FactionRelation } from './core/diplomacy_engine.js';
import { processBattleSpoils } from './core/battle_spoils_system.js';
import { checkInteraction, executeInteraction, getAffinityBetween } from './core/officer_interaction_system.js';
import { judgeVengeanceOnly, startVengeanceGame, finishVengeance, tryVengeanceOnEncounter, applyVengeanceToUnits } from './core/vengeance_system.js';
import * as vengeance_system from './core/vengeance_system.js';
import * as free_officer_visit_system from './core/free_officer_visit_system.js';
import * as captive_escape_system from './core/captive_escape_system.js';
import * as roaming_event_system from './core/roaming_event_system.js';
// 로밍 대화 + 재야 방문 시스템 [25][461-480]
import { getRoamingDialogue, resolveRoamingDialogue } from './core/roaming_dialogue_system.js';
import { acceptVisit, declineVisit } from './core/free_officer_visit_system.js';
import { getReputationDiplomacyModifier, describeReputationModifier } from './core/reputation_effect_system.js';
import { getLeaderReputationVisual, getOfficerReputationVisual } from './core/reputation_visuals.js';
import { EventFeedbackEffects } from './core/event_feedback_effects.js';
import { DIFFICULTY_MULTIPLIERS } from './core/difficulty_balance_system.js';
import { computeSettlement, diffSettlement } from './core/settlement_summary_system.js';
// 연대기 인스턴스는 engine 초기화 이후 참조 (hoisting 회피용 래퍼)
const engineRef = { current: null };
import { getCaptivesInCity } from './core/captive_escape_system.js';
// ============================================================
// DOM References
// ============================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const turnDisplay = document.getElementById('turn-display');
const dateDisplay = document.getElementById('date-display');
const phaseDisplay = document.getElementById('phase-display');
const statusText = document.getElementById('status-text');
const fpsDisplay = document.getElementById('fps-display');
const logContent = document.getElementById('log-content');
const officerDetail = document.getElementById('officer-detail');
const factionDetail = document.getElementById('faction-detail');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnSave = document.getElementById('btn-save');
const btnSlots = document.getElementById('btn-slots');
const btnBattle = document.getElementById('btn-battle');
const btnReport = document.getElementById('btn-report');
const btnDiplomacy = document.getElementById('btn-diplomacy');
const btnNextMonth = document.getElementById('btn-next-month');
// ============================================================
// Engine State
// ============================================================
let engine;
let bootstrap;
let isRunning = false;
let isPaused = false;
let animFrameId = null;
let lastFrameTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let currentFps = 0;
// ============================================================
// Hex Map State
// ============================================================
let hexRenderer;
let chinaMap;
let worldCities = [];
let hexTiles = [];
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let selectedHex = null;
// ============================================================
// Battle State
// ============================================================
let battleFrontend;
let isBattleMode = false;
// 이벤트 연출 [191-200] — 흔들림 + 합성 사운드
const feedbackEffects = new EventFeedbackEffects();
let ctxRestorePending = false;
/** 게임 이벤트에 맞는 연출 발화 */
function fireFeedback(kind) {
    feedbackEffects.fire(kind);
}
// ============================================================
// Logging
// ============================================================
function addLog(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}
let vmState = null;
function openVengeanceModal(store, actorId, targetId, kind, deployable, enemyUnits) {
    const game = startVengeanceGame(store, actorId, targetId, kind);
    vmState = { store, actorId, targetId, kind, game, enemyUnits, deployable, done: false };
    const modal = document.getElementById('vengeance-modal');
    const actor = store.getOfficer(actorId);
    const target = store.getOfficer(targetId);
    document.getElementById('vm-title').textContent = kind === 'DUEL' ? '復讐 — 단기접전' : '復讐 — 설전';
    document.getElementById('vm-subtitle').textContent = `${actor.name}의 복수 — 원수 ${target.name} 조우`;
    document.getElementById('vm-player-name').textContent = actor.name;
    document.getElementById('vm-enemy-name').textContent = target.name;
    document.getElementById('vm-close').style.display = 'none';
    modal.style.display = 'flex';
    addLog(`⚔️ 복수의 기회! ${actor.name}이(가) 원수 ${target.name}을(를) 조우했습니다`);
    renderVengeanceModal();
}
function renderVengeanceModal() {
    if (!vmState)
        return;
    const { kind, game } = vmState;
    const logEl = document.getElementById('vm-log');
    const cardsEl = document.getElementById('vm-cards');
    if (kind === 'DUEL') {
        const s = game.getState();
        setVmBar('player', s.playerHp, s.playerMaxHp);
        setVmBar('enemy', s.enemyHp, s.enemyMaxHp);
        document.getElementById('vm-player-num').textContent = `HP ${s.playerHp}/${s.playerMaxHp}`;
        document.getElementById('vm-enemy-num').textContent = `HP ${s.enemyHp}/${s.enemyMaxHp}`;
        document.getElementById('vm-player-spirit').textContent = `氣 ${'◆'.repeat(Math.max(0, s.playerSpirit))}`;
        logEl.innerHTML = s.log.map(l => `<div class="vm-log-line">${l}</div>`).join('');
        logEl.scrollTop = logEl.scrollHeight;
        if (s.phase === 'DONE') {
            finishVengeanceModal(game.getWinner() === vmState.actorId);
            return;
        }
        const cards = game.getAvailableCards(s.playerSpirit);
        cardsEl.innerHTML = cards.map(c => `<button class="vm-card" data-card="${c.type}" ${c.spiritCost > s.playerSpirit ? 'disabled' : ''}>
                <span class="vm-card-label">${c.label}${c.spiritCost > 0 ? ` (氣${c.spiritCost})` : ''}</span>
                <span class="vm-card-desc">${c.description}</span>
            </button>`).join('');
    }
    else {
        const s = game.getState();
        setVmBar('player', Math.max(0, s.playerScore), 100);
        setVmBar('enemy', Math.max(0, s.enemyScore), 100);
        document.getElementById('vm-player-num').textContent = `논점 ${Math.max(0, s.playerScore)}`;
        document.getElementById('vm-enemy-num').textContent = `논점 ${Math.max(0, s.enemyScore)}`;
        document.getElementById('vm-player-spirit').textContent = `氣 ${'◆'.repeat(Math.max(0, s.playerSpirit))}`;
        logEl.innerHTML = s.log.map(l => `<div class="vm-log-line">${l}</div>`).join('');
        logEl.scrollTop = logEl.scrollHeight;
        if (s.phase === 'DONE') {
            const result = game.getDebateResult();
            finishVengeanceModal(result.winner === vmState.actorId);
            return;
        }
        const cards = game.getAvailableCards(s.playerSpirit, s.playerMood);
        cardsEl.innerHTML = cards.map(c => `<button class="vm-card" data-card="${c.type}" ${c.spiritCost > s.playerSpirit ? 'disabled' : ''}>
                <span class="vm-card-label">${c.label}${c.spiritCost > 0 ? ` (氣${c.spiritCost})` : ''}</span>
                <span class="vm-card-desc">${c.description}</span>
            </button>`).join('');
    }
}
function setVmBar(side, value, max) {
    const bar = document.getElementById(`vm-${side}-bar`);
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    bar.style.width = `${pct}%`;
}
function finishVengeanceModal(actorWon) {
    if (!vmState || vmState.done)
        return;
    vmState.done = true;
    const { store, actorId, targetId, kind, enemyUnits } = vmState;
    // 후처리: 우호도 + 명성 [C-인간관계][11]
    const outcome = finishVengeance(store, actorId, targetId, actorWon);
    addLog(outcome.message);
    // 연출 [191-200] — 성패에 따른 흔들림 + 사운드
    fireFeedback(actorWon ? 'VENGEANCE_SUCCESS' : 'VENGEANCE_FAIL');
    // 복수 성공 시 전투 유닛 임팩트 [32][131-145] — 적군 사기 − / 아군 사기 + / 주도자 공격 보정
    if (outcome.targetMoraleHit > 0 || outcome.success) {
        const impact = applyVengeanceToUnits(outcome, vmState.deployable, enemyUnits);
        if (impact.enemyLog)
            addLog('🪫 적군 병력 사기가 크게 흔들립니다!');
        if (impact.allyLog)
            addLog(impact.allyLog);
    }
    // 종료 로그
    const logEl = document.getElementById('vm-log');
    const resultLine = kind === 'DUEL'
        ? (actorWon ? '🏆 단기접전 승리!' : '💀 단기접전 패배...')
        : (actorWon ? '🏆 설전 승리!' : '💀 설전 패배...');
    logEl.innerHTML += `<div class="vm-log-line"><b>${resultLine}</b></div>`;
    document.getElementById('vm-cards').innerHTML = '';
    document.getElementById('vm-close').style.display = 'inline-block';
}
// 카드 클릭 — 플레이어 선택으로 턴 진행
document.getElementById('vm-cards').addEventListener('click', (e) => {
    if (!vmState || vmState.done)
        return;
    const btn = e.target.closest('.vm-card');
    if (!btn || btn.hasAttribute('disabled'))
        return;
    const card = btn.dataset.card;
    if (!card)
        return;
    if (vmState.kind === 'DUEL') {
        vmState.game.playCard(card);
    }
    else {
        vmState.game.playCard(card);
    }
    renderVengeanceModal();
});
document.getElementById('vm-close').addEventListener('click', () => {
    document.getElementById('vengeance-modal').style.display = 'none';
    vmState = null;
});
let rmState = null;
function openRoamingModal(cityId, visitorType, cityName, factionName) {
    rmState = { data: getRoamingDialogue(visitorType, cityName, factionName), cityId, resolved: false };
    const modal = document.getElementById('roaming-modal');
    document.getElementById('rm-title').textContent = rmState.data.title;
    document.getElementById('rm-description').textContent = rmState.data.description;
    renderRoamingOptions();
    document.getElementById('rm-result').style.display = 'none';
    document.getElementById('rm-close').style.display = 'none';
    modal.style.display = 'flex';
}
function renderRoamingOptions() {
    if (!rmState)
        return;
    const optsEl = document.getElementById('rm-options');
    optsEl.innerHTML = rmState.data.options.map(o => `<button class="rm-option" data-option="${o.id}">
            <span class="rm-option-label">${o.label}</span>
            <span class="rm-option-desc">${o.description}</span>
        </button>`).join('');
}
function finishRoamingOption(optionId) {
    if (!rmState || rmState.resolved)
        return;
    rmState.resolved = true;
    const engineNow = engine;
    const storeNow = engineNow['store'];
    const resolution = resolveRoamingDialogue(storeNow, rmState.data.visitorType, rmState.cityId, optionId);
    addLog(resolution.message);
    // 연출 — 산적 진압 실패/약탈 계열은 경고 톤, 나머지는 밝은 톤 [191-200]
    fireFeedback(rmState.data.visitorType === 'BANDIT' && optionId !== 'suppress' ? 'VENGEANCE_FAIL' : 'RESCUE');
    const optsEl = document.getElementById('rm-options');
    optsEl.innerHTML = '';
    const resultEl = document.getElementById('rm-result');
    resultEl.textContent = resolution.message + (resolution.effects.length ? `  (${resolution.effects.join(', ')})` : '');
    resultEl.style.display = 'block';
    document.getElementById('rm-close').style.display = 'inline-block';
}
document.getElementById('rm-options').addEventListener('click', (e) => {
    if (!rmState || rmState.resolved)
        return;
    const btn = e.target.closest('.rm-option');
    if (!btn)
        return;
    finishRoamingOption(btn.dataset.option ?? '');
});
document.getElementById('rm-close').addEventListener('click', () => {
    document.getElementById('roaming-modal').style.display = 'none';
    rmState = null;
    // 대기열의 다음 재야 방문 모달 표시 [461-480]
    if (pendingVisits.length > 0) {
        openVisitModal(pendingVisits[0]);
    }
});
// 재야 무장 출사 타진 — 플레이어 세력 도시 방문 시 선택 모달 [24][421-440]
let pendingVisits = [];
// 연대기 관리자 [Y-메타][441-460] — 엔진 내장 인스턴스 게으른 참조 (세이브에 포함됨)
const chronicle = {
    add(kind, text) {
        engineRef.current?.chronicle.add(kind, text);
    },
    list() { return engineRef.current?.chronicle.list() ?? []; },
};
// 월말 정산 요약 [E1-361][461-480] — 이전 스냅샷 대비 증감 패널
let prevSettlement = null;
let latestSettlement = null;
function updateSettlementPanel() {
    const engine = engineRef.current;
    if (!engine)
        return;
    const report = computeSettlement(engine['store']);
    const gs = engine['store'].getGlobalState();
    const pid = gs.playerFactionId;
    const mine = report.factions.find(f => f.factionId === pid);
    if (mine) {
        const prevMine = prevSettlement?.factions.find(f => f.factionId === pid);
        const d = diffSettlement(prevMine, mine);
        const fmt = (v) => `${v >= 0 ? '+' : ''}${v.toLocaleString()}`;
        addLog(`💰 정산 — 金 ${mine.gold.toLocaleString()} (${fmt(d.gold)}) · 穀 ${mine.food.toLocaleString()} (${fmt(d.food)})` +
            ` · 兵 ${mine.troops.toLocaleString()} (${fmt(d.troops)}) · 무장 ${mine.officerCount} (${fmt(d.officerCount)})` +
            ` · 월수입 金${mine.goldIncome}/穀${mine.foodIncome}`);
    }
    prevSettlement = report;
    latestSettlement = report;
}
/** 정산 패널 렌더 — 세력 비교 표 (수입/국고/병력/증감) [E1-361][461-480] */
function renderSettlementPanel() {
    const el = document.getElementById('settlement-content');
    const engine = engineRef.current;
    if (!el || !engine)
        return;
    if (!latestSettlement) {
        // 첫 턴 전이라도 현재 상태를 즉시 산출해 표시
        latestSettlement = computeSettlement(engine['store']);
    }
    const gs = engine['store'].getGlobalState();
    const pid = gs.playerFactionId;
    const rows = latestSettlement.factions.map(f => {
        const prevF = prevSettlement && prevSettlement !== latestSettlement
            ? prevSettlement.factions.find(x => x.factionId === f.factionId)
            : undefined;
        const d = diffSettlement(prevF, f);
        const isPlayer = f.factionId === pid;
        const delta = (v) => v === 0 ? '<span class="st-delta zero">-</span>'
            : `<span class="st-delta ${v > 0 ? 'up' : 'down'}">${v > 0 ? '▲' : '▼'}${Math.abs(v).toLocaleString()}</span>`;
        return `<tr class="${isPlayer ? 'st-player' : ''}">` +
            `<td class="st-name">${isPlayer ? '👑 ' : ''}${f.factionName}</td>` +
            `<td>${f.cityCount}</td>` +
            `<td>${f.gold.toLocaleString()}${delta(d.gold)}</td>` +
            `<td>${f.food.toLocaleString()}${delta(d.food)}</td>` +
            `<td>${f.goldIncome}</td>` +
            `<td>${f.troops.toLocaleString()}${delta(d.troops)}</td>` +
            `<td>${f.officerCount}${delta(d.officerCount)}</td>` +
            `<td>${f.avgMorale}</td></tr>`;
    }).join('');
    el.innerHTML =
        `<div class="st-title">💰 ${latestSettlement.year}년 ${latestSettlement.month}월 정산 (턴 ${latestSettlement.turn})</div>` +
            `<table class="st-table"><thead><tr>` +
            `<th>세력</th><th>도시</th><th>국고</th><th>병량</th><th>월수입</th><th>병력</th><th>무장</th><th>사기</th>` +
            `</tr></thead><tbody>${rows}</tbody></table>` +
            `<div class="st-note">▲▼ = 지난달 대비 증감 · 턴이 지나야 증감이 집계됩니다</div>`;
}
/** 연대기 탭 렌더 — 최신순으로 아이콘+연도+문구 표시 */
// 연대기 필터 상태 [Y-메타][441-460]
let chronicleKindFilter = null;
let chronicleCollapsedYears = new Set();
const CHRONICLE_FILTERS = [
    { kind: null, label: '전체' },
    { kind: 'VENGEANCE', label: '⚔️ 복수' },
    { kind: 'FREE_VISIT', label: '🚶 출사' },
    { kind: 'PACT', label: '🤝 결의' },
    { kind: 'RESCUE', label: '🛡️ 구출' },
    { kind: 'DESTROYED', label: '💀 멸망' },
];
function renderChronicle() {
    const el = document.getElementById('chronicle-content');
    if (!el)
        return;
    const all = chronicle.list();
    if (all.length === 0) {
        el.innerHTML = '<div class="chronicle-empty">아직 기록된 사건이 없다…</div>';
        return;
    }
    // 종별 필터 적용
    const entries = chronicleKindFilter ? all.filter(e => e.kind === chronicleKindFilter) : all;
    // 연도별 그룹화 (최신 연도가 위)
    const yearGroups = new Map();
    for (const e of entries) {
        if (!yearGroups.has(e.year))
            yearGroups.set(e.year, []);
        yearGroups.get(e.year).push(e);
    }
    const majorKinds = new Set(['DESTROYED', 'ENDING', 'RESCUE', 'PACT']);
    const filterChips = CHRONICLE_FILTERS.map(f => `<button class="ch-filter${chronicleKindFilter === f.kind ? ' active' : ''}" data-kind="${f.kind ?? ''}">${f.label}</button>`).join('');
    const groupsHtml = Array.from(yearGroups.entries()).map(([year, list]) => {
        const collapsed = chronicleCollapsedYears.has(year);
        return `<div class="ch-year-group">` +
            `<button class="ch-year-toggle" data-year="${year}">` +
            `<span class="ch-year-arrow">${collapsed ? '▶' : '▼'}</span> ${year}년 <span class="ch-year-count">(${list.length})</span></button>` +
            (collapsed ? '' : list.map(e => `<div class="chronicle-entry${majorKinds.has(e.kind) ? ' ch-major' : ''}">` +
                `<span class="ch-icon">${e.icon}</span>` +
                `<span class="ch-date">${e.month}월</span>` +
                `<span class="ch-text">${e.text}</span></div>`).join('')) +
            `</div>`;
    }).join('');
    el.innerHTML = `<div class="ch-filters">${filterChips}</div>` +
        (entries.length === 0 ? '<div class="chronicle-empty">해당 종류의 기록이 없다…</div>' : groupsHtml);
}
// 연대기 필터 칩 + 연도 토글 이벤트 위임
document.getElementById('chronicle-content')?.addEventListener('click', (e) => {
    const target = e.target;
    const chip = target.closest('.ch-filter');
    if (chip) {
        const kind = chip.dataset.kind || null;
        chronicleKindFilter = chronicleKindFilter === kind ? null : kind;
        renderChronicle();
        return;
    }
    const yearBtn = target.closest('.ch-year-toggle');
    if (yearBtn) {
        const year = Number(yearBtn.dataset.year);
        if (chronicleCollapsedYears.has(year))
            chronicleCollapsedYears.delete(year);
        else
            chronicleCollapsedYears.add(year);
        renderChronicle();
    }
});
// 기록 탭 전환 (로그 ↔ 연대기)
document.getElementById('tab-log')?.addEventListener('click', () => {
    document.getElementById('tab-log').classList.add('active');
    document.getElementById('tab-chronicle').classList.remove('active');
    document.getElementById('tab-settlement').classList.remove('active');
    document.getElementById('log-content').style.display = '';
    document.getElementById('chronicle-content').style.display = 'none';
    document.getElementById('settlement-content').style.display = 'none';
});
document.getElementById('tab-chronicle')?.addEventListener('click', () => {
    document.getElementById('tab-chronicle').classList.add('active');
    document.getElementById('tab-log').classList.remove('active');
    document.getElementById('tab-settlement').classList.remove('active');
    document.getElementById('log-content').style.display = 'none';
    document.getElementById('settlement-content').style.display = 'none';
    renderChronicle();
    document.getElementById('chronicle-content').style.display = '';
});
document.getElementById('tab-settlement')?.addEventListener('click', () => {
    document.getElementById('tab-settlement').classList.add('active');
    document.getElementById('tab-log').classList.remove('active');
    document.getElementById('tab-chronicle').classList.remove('active');
    document.getElementById('log-content').style.display = 'none';
    document.getElementById('chronicle-content').style.display = 'none';
    renderSettlementPanel();
    document.getElementById('settlement-content').style.display = '';
});
function openVisitModal(visit) {
    rmState = null;
    const modal = document.getElementById('roaming-modal');
    document.getElementById('rm-title').textContent = `🚶 출사 타진 — ${visit.cityName}`;
    // 방문 무장 상세 카드 [461-480] — 입사 판단 근거 제공
    const s = visit.stats;
    const sum = s.leadership + s.might + s.intelligence + s.politics + s.charisma;
    const statBar = (label, v, max = 100) => {
        const pct = Math.min(100, Math.round((v / max) * 100));
        const tier = v >= 90 ? 'excel' : v >= 75 ? 'great' : v >= 60 ? 'good' : 'avg';
        return `<div class="visit-stat"><span class="visit-stat-label">${label}</span><span class="visit-stat-bar"><span class="visit-stat-fill visit-stat-${tier}" style="width:${pct}%"></span></span><span class="visit-stat-val">${v}</span></div>`;
    };
    document.getElementById('rm-description').innerHTML =
        `<div class="visit-card">` +
            `<div class="visit-card-head"><span class="visit-card-name">${visit.officerName}</span>` +
            `<span class="visit-card-tags"><span class="visit-card-tag">${visit.personalityLabel}</span>` +
            `<span class="visit-card-tag">종합 ${sum}</span>` +
            (visit.fame >= 100 ? `<span class="visit-card-tag visit-card-fame">✨ 명성 ${visit.fame}</span>` : '') +
            `</span></div>` +
            `<div class="visit-card-stats">` +
            statBar('統率', s.leadership) + statBar('武力', s.might) + statBar('知力', s.intelligence) + statBar('政治', s.politics) + statBar('魅力', s.charisma) +
            `</div>` +
            `<div class="visit-card-ambition">야망 ${visit.ambition}/100 — ${visit.ambition >= 70 ? '천하에 큰 뜻이 있다' : visit.ambition >= 40 ? '무난한 대장부다' : '조용히 지내기를 바란다'}</div>` +
            `</div>` +
            `"천하가 어지럽으니 명주를 찾아 나서고자 하노라." — 문객의 전언 (수락 시 충성도 ${Math.round(visit.chance * 100)}% 계열 초기화)`;
    const optsEl = document.getElementById('rm-options');
    optsEl.innerHTML = `
        <button class="rm-option" data-visit="accept">
            <span class="rm-option-label">🤝 맞이한다</span>
            <span class="rm-option-desc">${visit.officerName} 입사 (충성도 명성 비례)</span>
        </button>
        <button class="rm-option" data-visit="decline">
            <span class="rm-option-label">🚪 사절한다</span>
            <span class="rm-option-desc">재야 유지 — 다음 달 재타진 가능</span>
        </button>`;
    document.getElementById('rm-result').style.display = 'none';
    document.getElementById('rm-close').style.display = 'none';
    modal.style.display = 'flex';
    window.__pendingVisit = visit;
}
document.getElementById('rm-options').addEventListener('click', (e) => {
    const btn = e.target.closest('.rm-option');
    if (!btn || !btn.dataset.visit)
        return;
    const visit = window.__pendingVisit;
    if (!visit)
        return;
    pendingVisits.shift(); // 대기열에서 제거 — 다음 방문 모달이 열릴 수 있도록
    const engineNow = engine;
    const storeNow = engineNow['store'];
    if (btn.dataset.visit === 'accept') {
        acceptVisit(storeNow, visit);
        addLog(visit.message);
        fireFeedback('RESCUE');
    }
    else {
        declineVisit(visit);
        addLog(visit.message);
    }
    window.__pendingVisit = null;
    const optsEl = document.getElementById('rm-options');
    optsEl.innerHTML = '';
    const resultEl = document.getElementById('rm-result');
    resultEl.textContent = visit.message;
    resultEl.style.display = 'block';
    document.getElementById('rm-close').style.display = 'inline-block';
});
// ============================================================
// Demo Hex Map Data
// ============================================================
function generateDemoHexTiles() {
    const tiles = [];
    const radius = 4;
    for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
            const s = -q - r;
            if (Math.abs(s) > radius)
                continue;
            const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
            let terrain;
            let label;
            let ownerColor;
            if (q === 0 && r === 0) {
                terrain = 'city';
                label = '성도';
                ownerColor = '#e94560';
            }
            else if (q === 2 && r === -1) {
                terrain = 'city';
                label = '장안';
                ownerColor = '#e94560';
            }
            else if (q === -2 && r === 1) {
                terrain = 'city';
                label = '허창';
                ownerColor = '#e94560';
            }
            else if (q === 1 && r === 2) {
                terrain = 'city';
                label = '건업';
                ownerColor = '#e94560';
            }
            else if (q === -1 && r === -2) {
                terrain = 'city';
                label = '낙양';
                ownerColor = '#e94560';
            }
            else if (q === 3 && r === -2) {
                terrain = 'city';
                label = '업';
                ownerColor = '#e94560';
            }
            else if (q === -3 && r === 2) {
                terrain = 'city';
                label = '장안';
                ownerColor = '#e94560';
            }
            else if (q === 0 && r === 3) {
                terrain = 'city';
                label = '건업';
                ownerColor = '#e94560';
            }
            else if (q === 0 && r === -3) {
                terrain = 'city';
                label = '북평';
                ownerColor = '#e94560';
            }
            else if (q === 3 && r === 0) {
                terrain = 'city';
                label = '수춘';
                ownerColor = '#e94560';
            }
            else if (q === -3 && r === 0) {
                terrain = 'city';
                label = '낙양';
                ownerColor = '#e94560';
            }
            else if (Math.abs(q) <= 1 && Math.abs(r) <= 1) {
                terrain = 'plain';
            }
            else if (Math.abs(q) === 2 && Math.abs(r) <= 2) {
                terrain = Math.random() > 0.6 ? 'forest' : 'plain';
            }
            else if (Math.abs(q) === 3 && Math.abs(r) <= 3) {
                terrain = Math.random() > 0.5 ? 'mountain' : 'forest';
            }
            else if (Math.abs(q) === 4 && Math.abs(r) <= 4) {
                terrain = Math.random() > 0.4 ? 'water' : 'swamp';
            }
            else {
                terrain = 'water';
            }
            tiles.push({ q, r, terrain, label, ownerColor });
        }
    }
    return tiles;
}
// ============================================================
// Map Mouse Interaction — 월드: 중국 전도 / 전투: 헥사곤
// ============================================================
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
});
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (isDragging) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (isBattleMode) {
            hexRenderer.pan(dx, dy);
        }
        else {
            chinaMap.pan(dx, dy);
        }
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
    else if (!isBattleMode) {
        const city = chinaMap.cityAt(px, py);
        chinaMap.setHoveredCity(city?.id ?? null);
        canvas.style.cursor = city ? 'pointer' : 'default';
    }
});
canvas.addEventListener('mouseup', () => {
    isDragging = false;
});
canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    chinaMap.setHoveredCity(null);
});
canvas.addEventListener('click', (e) => {
    if (isBattleMode)
        return; // 전투 중 클릭은 battleFrontend가 처리
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // 드래그 종료 직후의 클릭은 무시 (이동 거리 작을 때만 선택)
    if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 4)
        return;
    const city = chinaMap.cityAt(px, py);
    for (const c of worldCities)
        c.isSelected = (c.id === city?.id);
    if (city) {
        showCityInfo(city.id);
    }
});
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    if (isBattleMode) {
        hexRenderer.zoomAt(factor, px, py);
    }
    else {
        chinaMap.zoomAt(factor, px, py);
    }
});
/** 스토어의 도시를 중국 전도 뷰로 동기화 */
function syncChinaMapCities() {
    try {
        const gs = engine['store'].getGlobalState();
        const store = engine['store'];
        worldCities = store.getAllCities().map(c => {
            const fac = c.ownerId ? store.getFaction(c.ownerId) : null;
            const x = c.mapX ?? (c.hexCoord.q + 4) / 8;
            const y = c.mapY ?? (c.hexCoord.r + 4) / 8;
            return {
                id: c.id,
                name: c.name,
                x, y,
                ownerColor: fac?.color ?? '#888898',
                factionName: fac?.name,
                isPlayer: c.ownerId === gs.playerFactionId,
                garrison: c.development * 100,
                isSelected: false,
            };
        });
        chinaMap.setCities(worldCities);
    }
    catch {
        // 엔진 미초기화
    }
}
/** 현재 상세 패널에 열려 있는 도시 ID (전환 애니메이션 판단용) */
let currentPanelCityId = null;
/** 도시 클릭 시 사이드바 + 상세 패널에 정보 표시 [49] */
function showCityInfo(cityId) {
    try {
        const store = engine['store'];
        const city = store.getCity(cityId);
        if (!city)
            return;
        const faction = city.ownerId ? store.getFaction(city.ownerId) : null;
        officerDetail.textContent = `도시: ${city.name} (인구 ${city.population.toLocaleString()})`;
        renderOfficerDetail(null); // 도시 전환 시 무장 상세 초기화
        renderOfficerDetail(null); // 도시 전환 시 무장 상세 초기화
        factionDetail.textContent = faction
            ? `${faction.name} — 병력 ${city.development} · 충성 ${city.loyalty}`
            : '무주공산';
        renderCityDetailPanel(city, faction, cityId !== currentPanelCityId);
        currentPanelCityId = cityId;
        addLog(`도시 선택: ${city.name}${faction ? ` (${faction.name})` : ''}`);
    }
    catch {
        // 엔진 미초기화
    }
}
// ============================================================
// 도시 상세 패널 — 내정치 바 + 무장 목록 [49]
// ============================================================
const cityDetailPanel = document.getElementById('city-detail-panel');
const cdpCityName = document.getElementById('cdp-city-name');
const cdpFactionBadge = document.getElementById('cdp-faction-badge');
const cdpStats = document.getElementById('cdp-stats');
const cdpOfficers = document.getElementById('cdp-officers');
// === 무장 상세 표시 [27][11] ===
/**
 * 무장 상세 정보 렌더링 [27] — 사이드바 officer-detail 패널
 * 능력치 5종 + 충성도/야망 + 관계망 상위 3인 (관계 시스템 [C-인간관계] 연동)
 */
function renderOfficerDetail(officerId) {
    if (!officerId) {
        delete officerDetail.dataset.officerId;
        officerDetail.innerHTML = '<div class="od-empty">무장을 선택하세요</div>';
        return;
    }
    if (!engine)
        return;
    const store = engine['store'];
    const o = store.getOfficer(officerId);
    if (!o) {
        delete officerDetail.dataset.officerId;
        officerDetail.innerHTML = '<div class="od-empty">무장을 찾을 수 없습니다</div>';
        return;
    }
    officerDetail.dataset.officerId = officerId;
    const statBar = (label, val, color) => `<div class="od-stat-row"><span class="od-stat-label">${label}</span>` +
        `<div class="od-stat-bar"><div class="od-stat-fill" style="width:${val}%;background:${color}"></div></div>` +
        `<span class="od-stat-val">${val}</span></div>`;
    // 관계망 [C-인간관계]: 절대 우호도 기준 상위 3인
    const relations = store.getRelationships(officerId)
        .slice()
        .sort((a, b) => Math.abs(b.affinity) - Math.abs(a.affinity))
        .slice(0, 3);
    const relationRows = relations.length > 0
        ? relations.map(e => {
            const other = store.getOfficer(e.target);
            if (!other)
                return '';
            const icon = e.affinity >= 40 ? '💚' : e.affinity <= -40 ? '💢' : '·';
            const label = e.type === 'SWORN_BROTHER' ? '의형제' : e.type === 'NEMESIS' ? '원수' : e.type === 'RIVAL' ? '라이벌' : e.type === 'FAMILY' ? '친족' : '지인';
            return `<div class="od-relation"><span>${icon} ${other.name}</span><span>${label} ${e.affinity >= 0 ? '+' : ''}${e.affinity}</span></div>`;
        }).join('')
        : '<div class="od-relation od-relation-empty">특별한 관계 없음</div>';
    const statusLabel = o.status === 'FREE' ? '재야' : o.factionId ? (store.getFaction(o.factionId)?.name ?? '-') : '-';
    const loyaltyColor = o.loyalty >= 70 ? '#4caf50' : o.loyalty >= 40 ? '#e8c35a' : '#e05a5a';
    // 무장 개인 평판 표시 [11][27]
    const odRep = getOfficerReputationVisual(o);
    const odRepRow = `<div class="od-rep-row" title="${odRep.title}"><span class="rep-badge" style="color:${odRep.color}">${odRep.icon} ${odRep.label}</span></div>`;
    // 상호작용 UI [24][32][33]: 플레이어 세력 소속 무장이 상대와 할 수 있는 행동
    const gs = store.getGlobalState();
    const myFaction = gs.playerFactionId ? store.getFaction(gs.playerFactionId) : null;
    const actingOfficers = myFaction
        ? store.getOfficersByCity(myFaction.capitalCityId ?? store.getOfficer(myFaction.leaderId)?.cityId ?? '')
            .filter(off => off.factionId === gs.playerFactionId)
        : [];
    const actor = actingOfficers.find(off => off.id !== officerId) ?? actingOfficers[0];
    const affinity = actor ? getAffinityBetween(store, actor.id, officerId) : 0;
    const affinityColor = affinity >= 30 ? '#4caf50' : affinity <= -30 ? '#e05a5a' : 'var(--text, #ddd)';
    const interactions = [
        { kind: 'CHAT', label: '💬 대화', enabled: !!actor && checkInteraction(store, actor.id, officerId, 'CHAT').ok },
        { kind: 'GIFT', label: '🎁 증정', enabled: !!actor && checkInteraction(store, actor.id, officerId, 'GIFT').ok },
        { kind: 'DEBATE', label: '🎙️ 설전', enabled: !!actor },
        { kind: 'DUEL', label: '⚔️ 일기토', enabled: !!actor },
    ];
    const actionButtons = interactions.map(i => `<button class="od-action-btn" data-kind="${i.kind}" data-actor="${actor?.id ?? ''}" ${i.enabled ? '' : 'disabled'}>${i.label}</button>`).join('');
    const affinityRow = actor
        ? `<div class="od-affinity-row"><span>${actor.name}과(와)의 우호도</span><b style="color:${affinityColor}">${affinity >= 0 ? '+' : ''}${affinity}</b></div>
           <div class="od-actions">${actionButtons}</div>
           <div class="od-action-msg" id="od-action-msg"></div>`
        : '';
    officerDetail.innerHTML = `
        <div class="od-name-row"><span class="od-name">${o.name}</span><span class="od-faction">${statusLabel}</span></div>
        ${odRepRow}
        ${statBar('統率', o.stats.leadership, '#5a8fd4')}
        ${statBar('武力', o.stats.might, '#d45a5a')}
        ${statBar('智力', o.stats.intelligence, '#5ad48f')}
        ${statBar('政治', o.stats.politics, '#e8c35a')}
        ${statBar('魅力', o.stats.charisma, '#c35ad4')}
        <div class="od-loyalty-row">
            <span>충성도 <b style="color:${loyaltyColor}">${o.loyalty}</b></span>
            <span>야망 <b>${o.ambition}</b></span>
        </div>
        ${affinityRow}
        <div class="od-relations-title">── 인맥 ──</div>
        ${relationRows}
    `;
}
// 무장 목록 클릭 → 상세 정보 표시 [27]
cdpOfficers.addEventListener('click', (e) => {
    const row = e.target.closest('.cdp-officer-clickable');
    if (!row)
        return;
    renderOfficerDetail(row.dataset.officerId ?? null);
});
// 상호작용 버튼 클릭 → 대화/증정/설전/일기토 실행 [24][32][33]
officerDetail.addEventListener('click', (e) => {
    const btn = e.target.closest('.od-action-btn');
    if (!btn || btn.disabled || !engine)
        return;
    const kind = btn.dataset.kind;
    const actorId = btn.dataset.actor;
    const targetId = officerDetail.dataset.officerId;
    if (!actorId || !targetId)
        return;
    const store = engine['store'];
    const result = executeInteraction(store, actorId, targetId, kind);
    renderOfficerDetail(targetId); // 우호도/버튼 상태 갱신 (메시지보다 먼저 — 재렌더가 내용을 지움)
    const msg = officerDetail.querySelector('#od-action-msg');
    if (msg) {
        msg.textContent = result.message;
        msg.classList.toggle('is-err', !result.success);
    }
    if (result.success)
        addLog(result.message);
});
document.getElementById('cdp-close').addEventListener('click', () => {
    cityDetailPanel.style.display = 'none';
});
/** 내정치 바 한 줄 생성 */
function statBar(label, value, max, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `<div class="cdp-stat-row">
        <span class="cdp-stat-label">${label}</span>
        <span class="cdp-stat-bar-track"><span class="cdp-stat-bar-fill" style="width:${pct}%;background:${color}"></span></span>
        <span class="cdp-stat-value">${Math.round(value)}</span>
    </div>`;
}
/** 도시 상세 패널 렌더링 (switched: 다른 도시에서 전환 시 콘텐츠 페이드) */
function renderCityDetailPanel(city, faction, switched) {
    cdpCityName.textContent = city.name;
    // 세력 배지 (세력색 테두리 + 군주 평판 등급 [11][27])
    if (faction) {
        const leader = faction.leaderId ? store_getOfficerSafe(faction.leaderId) : null;
        const repVis = getLeaderReputationVisual(leader);
        cdpFactionBadge.innerHTML = `${faction.name} <span class="rep-badge" style="color:${repVis.color}" title="${repVis.title}">${repVis.icon} ${repVis.label}</span>`;
        cdpFactionBadge.innerHTML = `${faction.name} <span class="rep-badge" style="color:${repVis.color}" title="${repVis.title}">${repVis.icon} ${repVis.label}</span>`;
        cdpFactionBadge.style.display = 'inline-block';
        cdpFactionBadge.style.setProperty('--faction-color', faction.color);
    }
    else {
        cdpFactionBadge.textContent = '무주공산';
        cdpFactionBadge.style.display = 'inline-block';
        cdpFactionBadge.style.setProperty('--faction-color', 'var(--gold-dim)');
    }
    // 내정치 바 (developmentStats 기반)
    const ds = city.developmentStats;
    cdpStats.innerHTML =
        statBar('상업', ds.commerce, ds.maxCommerce, '#d4af37') +
            statBar('농업', ds.farming, ds.maxFarming, '#7cb342') +
            statBar('기술', ds.technology, ds.maxTechnology, '#5fb5e8') +
            statBar('치안', ds.publicOrder, ds.maxPublicOrder, '#e9865a') +
            statBar('충성', city.loyalty, 100, '#b06ae8');
    // 무장 목록 (능력치 합 순)
    const officers = city.officerIds
        .map(id => store_getOfficerSafe(id))
        .filter((o) => o !== null)
        .sort((a, b) => (b.stats.leadership + b.stats.might) - (a.stats.leadership + a.stats.might));
    // 수용 중인 포로 표시 [131-145]
    const captives = getCaptivesInCity(engine['store'], city.id);
    cdpOfficers.innerHTML = officers.map(o => {
        const isLeader = faction?.leaderId === o.id;
        const role = isLeader ? '군주' : (o.rank >= 5 ? '장군' : '무관');
        return `<div class="cdp-officer-row cdp-officer-clickable" data-officer-id="${o.id}" title="클릭하여 상세 정보 보기">
            <div>
                <div class="cdp-officer-name ${isLeader ? 'is-leader' : ''}">${o.name}</div>
                <div class="cdp-officer-stats">統率${o.stats.leadership} 武力${o.stats.might} 智力${o.stats.intelligence}</div>
            </div>
            <span class="cdp-officer-role">${role}</span>
        </div>`;
    }).join('')
        + (captives.length > 0
            ? captives.map(c => `<div class="cdp-officer-row cdp-captive-row" data-officer-id="${c.id}">
            <div>
                <div class="cdp-officer-name">⛓️ ${c.name}</div>
                <div class="cdp-officer-stats">포로 — 이번 달에 탈출할 수 있다 (지력 ${store_getOfficerSafe(c.id)?.stats.intelligence ?? '-'})</div>
            </div>
            <span class="cdp-officer-role">포로</span>
        </div>`).join('')
            : '');
    // 내정 명령 섹션은 플레이어 자기 도시에서만 활성
    const gs = engine['store'].getGlobalState();
    const isPlayerCity = faction !== null && city.ownerId === gs.playerFactionId;
    document.getElementById('cdp-actions-section').style.display = isPlayerCity ? 'block' : 'none';
    if (isPlayerCity) {
        const actionResult = document.getElementById('cdp-action-result');
        actionResult.textContent = '';
        actionResult.dataset.cityId = city.id;
    }
    // 출진 섹션 [32]: 내 도시 + 인접 적 도시가 있을 때 표시
    renderExpeditionSection(city, isPlayerCity);
    // 등용 섹션 [24]: 내 도시 + 도시에 재야 무장이 있을 때
    renderRecruitSection(city, isPlayerCity);
    // 전환 시 콘텐츠 페이드 애니메이션 재생 (같은 도시 재클릭 시 생략)
    if (switched) {
        cityDetailPanel.querySelectorAll('.cdp-section, .cdp-header').forEach(el => {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = '';
        });
    }
    cityDetailPanel.style.display = 'block';
}
/**
 * 출진 섹션 렌더링 [32] — 플레이어 도시에서 인접 적 도시를 대상으로 표시
 * 인접 판정: 전도 정규화 좌표 거리 (대략 1개 지역 거리)
 */
const ADJACENT_DIST = 0.16;
function renderExpeditionSection(city, isPlayerCity) {
    const section = document.getElementById('cdp-expedition-section');
    const info = document.getElementById('cdp-expedition-info');
    const targets = document.getElementById('cdp-expedition-targets');
    if (!isPlayerCity || !engine) {
        section.style.display = 'none';
        return;
    }
    const store = engine['store'];
    const allCities = store.getAllCities();
    const adjacentEnemies = allCities.filter(c => {
        if (!c.ownerId || c.ownerId === city.ownerId)
            return false;
        const dx = (c.mapX ?? 0) - (city.mapX ?? 0);
        const dy = (c.mapY ?? 0) - (city.mapY ?? 0);
        return Math.hypot(dx, dy) <= ADJACENT_DIST;
    });
    if (adjacentEnemies.length === 0) {
        section.style.display = 'block';
        info.textContent = '인접한 적 도시가 없습니다.';
        targets.innerHTML = '';
        return;
    }
    section.style.display = 'block';
    info.textContent = `병력 ${city.development.toLocaleString()}으로 출진합니다 — 대상 도시를 선택하세요`;
    targets.innerHTML = adjacentEnemies.map(t => {
        const tf = t.ownerId ? store.getFaction(t.ownerId) : null;
        return `<button class="cdp-expedition-btn" data-target="${t.id}" style="--faction-color:${tf?.color ?? '#888'}">
            <span class="exp-target-name">${t.name}</span>
            <span class="exp-target-info">${tf?.name ?? '무주'} · 병력 ${t.development} · 방어 ${t.defense}</span>
        </button>`;
    }).join('');
}
// 출진 버튼 클릭 → 전투 진입 (출진 도시/대상 저장)
let expeditionSource = null;
let expeditionTarget = null;
document.getElementById('cdp-expedition-targets').addEventListener('click', (e) => {
    const btn = e.target.closest('.cdp-expedition-btn');
    if (!btn || !currentPanelCityId)
        return;
    expeditionSource = currentPanelCityId;
    expeditionTarget = btn.dataset.target ?? null;
    if (!expeditionTarget)
        return;
    const store = engine['store'];
    const target = store.getCity(expeditionTarget);
    addLog(`出征 ${target?.name}으로 출진을 개시합니다`);
    cityDetailPanel.style.display = 'none';
    enterBattleMode();
});
/**
 * 등용 섹션 [24] — 자기 도시의 재야 무장을 등용
 */
function renderRecruitSection(city, isPlayerCity) {
    const section = document.getElementById('cdp-recruit-section');
    const targets = document.getElementById('cdp-recruit-targets');
    if (!isPlayerCity || !engine) {
        section.style.display = 'none';
        return;
    }
    const store = engine['store'];
    const freeOfficers = store.getAllOfficers().filter(o => o.factionId === null && o.status === 'FREE' && o.cityId === city.id);
    const allFree = store.getAllOfficers().filter(o => o.factionId === null && o.status === 'FREE');
    const pool = freeOfficers.length > 0 ? freeOfficers : allFree.slice(0, 3);
    if (pool.length === 0) {
        section.style.display = 'block';
        targets.innerHTML = '<div class="cdp-expedition-info">등용 가능한 재야 무장이 없습니다.</div>';
        return;
    }
    section.style.display = 'block';
    const loyaltySystem = engine['loyaltySystem'];
    const gsR = store.getGlobalState();
    targets.innerHTML = pool.map(o => {
        // 평판 보정 반영 확률 [11] — 세력 군주 명성/악명 포함
        const chance = Math.round(loyaltySystem.getRecruitChance(o.id, undefined, gsR.playerFactionId ?? undefined) * 100);
        const chanceColor = chance >= 60 ? 'var(--color-success, #4caf50)' : chance >= 30 ? '#e8c35a' : '#e05a5a';
        const repMod = getReputationDiplomacyModifier(store, gsR.playerFactionId ?? null);
        const repLabel = describeReputationModifier(repMod);
        return `<button class="cdp-expedition-btn cdp-recruit-btn" data-officer="${o.id}">
            <span class="exp-target-name">${o.name}</span>
            <span class="exp-target-info">統率${o.stats.leadership} 武力${o.stats.might} 智力${o.stats.intelligence} · <span style="color:${chanceColor};font-weight:bold">등용 확률 ${chance}%</span>${repLabel ? ` <span style="font-size:10px;opacity:.75">(${repLabel})</span>` : ''}</span>
        </button>`;
    }).join('');
}
// 등용 버튼 클릭
document.getElementById('cdp-recruit-targets').addEventListener('click', (e) => {
    const btn = e.target.closest('.cdp-recruit-btn');
    if (!btn || !currentPanelCityId || !engine)
        return;
    const store = engine['store'];
    const gs = store.getGlobalState();
    if (!gs.playerFactionId)
        return;
    const playerCity = store.getCitiesByFaction(gs.playerFactionId)[0];
    if (!playerCity)
        return;
    const loyalty = engine['loyaltySystem'];
    loyalty.penaltyMessages = [];
    const result = loyalty.recruit(btn.dataset.officer, gs.playerFactionId, playerCity.id);
    addLog(result.message);
    // 포로 등용 페널티 메시지 (원소속 세력 원수화) [24][341-360]
    for (const msg of loyalty.penaltyMessages) {
        addLog(msg);
    }
    const target = store.getCity(currentPanelCityId);
    if (target) {
        const fac = target.ownerId ? store.getFaction(target.ownerId) : null;
        renderCityDetailPanel(target, fac, false);
    }
});
/** 전투 종료 시 출진 결과 처리 — 승리 시 도시 점령 [105] */
function resolveExpeditionOutcome(playerWon) {
    if (!engine || !expeditionSource || !expeditionTarget)
        return;
    const store = engine['store'];
    const source = store.getCity(expeditionSource);
    const target = store.getCity(expeditionTarget);
    expeditionSource = null;
    expeditionTarget = null;
    if (!source || !target)
        return;
    if (playerWon) {
        // 도시 점령: 소속 변경 + 방어력 감소 + 병력 일부 이동
        const gs = store.getGlobalState();
        const newDefense = Math.max(5, Math.floor(target.defense * 0.4));
        const garrisonTransfer = Math.floor(source.development * 0.3);
        store.updateCity(target.id, {
            ownerId: gs.playerFactionId,
            defense: newDefense,
            development: Math.max(0, target.development - garrisonTransfer),
        });
        store.updateCity(source.id, { development: Math.max(0, source.development - garrisonTransfer) });
        addLog(`🏳️ ${target.name} 점령! 영토가 확장되었습니다`);
        // 전투 후처리: 포로 포획 + 병력/자금/국고 약탈 [131-145]
        const spoils = processBattleSpoils(store, source.id, target.id);
        for (const msg of spoils.messages) {
            addLog(msg);
        }
        if (spoils.capturedOfficerIds.length > 0) {
            addLog(`⛓️ 포로 ${spoils.capturedOfficerIds.length}명 — 도시 패널에서 등용할 수 있습니다`);
        }
    }
    else {
        store.updateCity(source.id, { development: Math.max(0, Math.floor(source.development * 0.8)) });
        addLog(`⚔️ ${target.name} 공성 실패 — 병력이 20% 감소했습니다`);
    }
    syncChinaMapCities();
    if (currentPanelCityId)
        showCityInfo(currentPanelCityId);
}
/** 내정 명령 실행 — 실행 후 패널/전도 동기 갱신 [49] */
function runCityAction(cityId, action) {
    const store = engine['store'];
    const city = store.getCity(cityId);
    if (!city)
        return;
    const gs = store.getGlobalState();
    const faction = city.ownerId ? store.getFaction(city.ownerId) : null;
    if (!faction || city.ownerId !== gs.playerFactionId)
        return;
    const ds = { ...city.developmentStats };
    let resultMsg = '';
    switch (action) {
        case 'recruit': {
            // 징병: 골드 200 소모 → 병력 +800, 충성 -3
            if (city.funds < 200) {
                resultMsg = '골드가 부족합니다 (200 필요)';
                break;
            }
            const gain = 600 + Math.floor(Math.random() * 400);
            store.updateCity(city.id, { funds: city.funds - 200, development: Math.min(city.maxDefense, city.development + 1) });
            resultMsg = `병사 ${gain}명 모집 완료 (골드 -200)`;
            break;
        }
        case 'train': {
            // 훈련: 골드 150 소모 → 사기 반영용 development +2
            if (city.funds < 150) {
                resultMsg = '골드가 부족합니다 (150 필요)';
                break;
            }
            store.updateCity(city.id, { funds: city.funds - 150, development: Math.min(100, city.development + 2) });
            resultMsg = '훈련 완료 — 병사 사기 상승 (골드 -150)';
            break;
        }
        case 'patrol': {
            // 순찰: 골드 100 소모 → 치안 +5
            if (city.funds < 100) {
                resultMsg = '골드가 부족합니다 (100 필요)';
                break;
            }
            ds.publicOrder = Math.min(ds.maxPublicOrder, ds.publicOrder + 5);
            store.updateCity(city.id, { funds: city.funds - 100, developmentStats: ds });
            resultMsg = `순찰 완료 — 치안 ${ds.publicOrder} (골드 -100)`;
            break;
        }
        case 'develop': {
            // 개발: 골드 250 소모 → 상업+3, 농업+3
            if (city.funds < 250) {
                resultMsg = '골드가 부족합니다 (250 필요)';
                break;
            }
            ds.commerce = Math.min(ds.maxCommerce, ds.commerce + 3);
            ds.farming = Math.min(ds.maxFarming, ds.farming + 3);
            store.updateCity(city.id, { funds: city.funds - 250, developmentStats: ds });
            resultMsg = `개발 완료 — 상업 ${ds.commerce} · 농업 ${ds.farming} (골드 -250)`;
            break;
        }
    }
    const actionResult = document.getElementById('cdp-action-result');
    actionResult.textContent = resultMsg;
    // 패널 + 사이드바 + 전도 갱신
    const refreshed = store.getCity(cityId);
    if (refreshed) {
        const fac2 = refreshed.ownerId ? store.getFaction(refreshed.ownerId) : null;
        renderCityDetailPanel(refreshed, fac2, false);
        actionResult.textContent = resultMsg; // 렌더 후 다시 세팅 (innerHTML 리셋 방지)
        factionDetail.textContent = fac2
            ? `${fac2.name} — 병력 ${refreshed.development} · 충성 ${refreshed.loyalty}`
            : '무주공산';
    }
    syncChinaMapCities();
}
// 내정 명령 버튼 이벤트 위임
document.getElementById('cdp-actions').addEventListener('click', (e) => {
    const btn = e.target.closest('.cdp-action-btn');
    if (!btn)
        return;
    const action = btn.dataset.action;
    if (!action || !currentPanelCityId)
        return;
    runCityAction(currentPanelCityId, action);
});
function store_getOfficerSafe(id) {
    try {
        return engine['store'].getOfficer(id);
    }
    catch {
        return null;
    }
}
// ============================================================
// Game Loop
// ============================================================
function gameLoop(timestamp) {
    if (!isRunning)
        return;
    // FPS counter
    frameCount++;
    if (timestamp - fpsTimer >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        fpsTimer = timestamp;
        fpsDisplay.textContent = `FPS: ${currentFps}`;
    }
    // Delta time
    const dt = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0;
    lastFrameTime = timestamp;
    // Render
    renderFrame(dt);
    // UI updates (throttled)
    updateUI();
    animFrameId = requestAnimationFrame(gameLoop);
}
// ============================================================
// Canvas Resize
// ============================================================
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
// ============================================================
// Render Frame
// ============================================================
function renderFrame(_dt) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 이벤트 연출 흔들림 [191-200] — 감쇠 진동을 렌더에 오프셋으로 적용
    if (feedbackEffects.isShaking()) {
        const { x, y } = feedbackEffects.update(_dt);
        ctx.save();
        ctx.translate(x, y);
        ctxRestorePending = true;
    }
    if (!isRunning) {
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 36px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('삼국지 8 리메이크', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#8080a0';
        ctx.font = '16px sans-serif';
        ctx.fillText('게임 시작을 눌러주세요', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'start';
        return;
    }
    if (isBattleMode && battleFrontend) {
        battleFrontend.render(ctx, canvas.width, canvas.height);
    }
    else {
        // 월드 화면: 중국 전도 [9]
        chinaMap.render();
        const state = engine?.getCurrentPhase();
        if (state) {
            ctx.fillStyle = 'rgba(240, 232, 208, 0.8)';
            ctx.font = '13px "Malgun Gothic", sans-serif';
            ctx.fillText(`Phase: ${state}`, 12, 24);
        }
    }
    // 흔들림 중이었으면 컨텍스트 상태 복원
    if (ctxRestorePending) {
        ctx.restore();
        ctxRestorePending = false;
    }
}
// ============================================================
// UI Update
// ============================================================
let uiTick = 0;
function updateUI() {
    uiTick++;
    if (uiTick % 10 !== 0)
        return;
    try {
        const gs = engine['store'].getGlobalState();
        turnDisplay.textContent = `턴 ${gs.turnCount}`;
        dateDisplay.textContent = `${gs.time.year}년 ${gs.time.month}월`;
        phaseDisplay.textContent = engine.getCurrentPhase();
        const season = monthToSeason(gs.time.month);
        document.body.dataset.season = season;
        titleScreen?.setSeason(season);
    }
    catch {
        // engine not fully initialized
    }
}
// ============================================================
// Button Handlers
// ============================================================
async function startGame(world = null) {
    if (isRunning)
        return;
    if (world) {
        addLog('게임 월드 초기화 중...');
        statusText.textContent = '월드 생성 중...';
        // 시나리오 기반 월드 구성
        try {
            engine.initWorld(world.officers, world.factions, world.cities, []);
            addLog(`월드 생성 완료 — ${world.factions.length}세력, ${world.cities.length}도시, ${world.officers.length}무장`);
            // 플레이어 세력/군주 지정 (개인 행동 페이즈용) + 시나리오 난이도 주입 [X-난이도]
            const difficulty = world.scenario?.difficulty ?? 3;
            engine['store'].setGlobalState({
                ...engine['store'].getGlobalState(),
                playerFactionId: world.playerFactionId,
                selectedOfficerId: world.factions.find(f => f.id === world.playerFactionId)?.leaderId ?? null,
                difficulty,
            });
        }
        catch (err) {
            addLog(`월드 초기화 실패: ${err}`);
            statusText.textContent = '초기화 실패';
            return;
        }
    }
    else {
        // 이어하기(로드) 경로 — 저장된 월드를 전도에 재동기화 [17]
        const loadedCities = engine['store'].getAllCities();
        if (loadedCities.length > 0) {
            addLog(`세이브 복원 — ${Object.keys(engine['store'].getState().factions).length}세력, ${loadedCities.length}도시, ${Object.keys(engine['store'].getState().officers).length}무장`);
        }
    }
    // 신규/이어하기 공통: 중국 전도에 도시 배치 (소속/영토 포함) [9][17]
    syncChinaMapCities();
    isRunning = true;
    isPaused = false;
    btnPause.textContent = '일시정지';
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnSave.disabled = false;
    btnSlots.disabled = false;
    btnReport.disabled = false;
    btnBattle.disabled = false;
    btnDiplomacy.disabled = false;
    btnNextMonth.disabled = false;
    statusText.textContent = '게임 실행 중';
    lastFrameTime = 0;
    addLog('게임 루프 시작');
    animFrameId = requestAnimationFrame(gameLoop);
}
btnStart.addEventListener('click', () => { openScenarioScreen(); });
btnPause.addEventListener('click', () => {
    if (!isRunning)
        return;
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? '재개' : '일시정지';
    statusText.textContent = isPaused ? '일시정지' : '게임 실행 중';
    if (isPaused) {
        // RAF 루프 정지 (재개 시 lastFrameTime 리셋으로 급강 점프 방지)
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }
    else {
        lastFrameTime = 0;
        animFrameId = requestAnimationFrame(gameLoop);
    }
});
// ============================================================
// Battle UI Event Handlers
// ============================================================
const battlePanel = document.getElementById('battle-panel');
const battlePhase = document.getElementById('battle-phase');
const battleUnits = document.getElementById('battle-units');
const btnBattleStart = document.getElementById('btn-battle-start');
const btnEndTurn = document.getElementById('btn-end-turn');
const btnBattleRetreat = document.getElementById('btn-battle-retreat');
function enterBattleMode() {
    if (!engine || !isRunning)
        return;
    isBattleMode = true;
    battlePanel.style.display = 'block';
    const battleTiles = hexTiles.map(t => ({
        q: t.q,
        r: t.r,
        terrain: (t.terrain === 'city' ? 'PLAINS' :
            t.terrain === 'water' ? 'WATER' :
                t.terrain === 'forest' ? 'FOREST' :
                    t.terrain === 'mountain' ? 'MOUNTAIN' :
                        t.terrain === 'swamp' ? 'MARSH' :
                            t.terrain === 'road' ? 'PLAINS' :
                                t.terrain === 'desert' ? 'DESERT' : 'PLAINS'),
        elevation: 0,
        defense: 1,
        hasForestCover: t.terrain === 'forest',
        isRiverCrossing: false,
    }));
    // 출진 중이면 출진 도시의 실제 무장/병력으로 편성, 아니면 기본 데모 편성
    let deployable;
    let enemyUnits;
    if (expeditionSource && expeditionTarget) {
        const store = engine['store'];
        const srcCity = store.getCity(expeditionSource);
        const tgtCity = store.getCity(expeditionTarget);
        const gs = store.getGlobalState();
        // 아군: 출진 도시 주둔 무장 (최대 4명, 통솔 순)
        const srcOfficers = (srcCity?.officerIds ?? [])
            .map(id => store.getOfficer(id))
            .filter((o) => o !== null)
            .sort((a, b) => b.stats.leadership - a.stats.leadership)
            .slice(0, 4);
        const unitTypes = ['INFANTRY', 'CAVALRY', 'ARCHER', 'INFANTRY'];
        const perUnitSoldiers = Math.floor((srcCity?.development ?? 4000) / Math.max(1, srcOfficers.length));
        deployable = srcOfficers.map((o, i) => ({
            unitId: `friendly_${i + 1}`,
            officerName: o.name,
            officerId: o.id,
            unitType: unitTypes[i % unitTypes.length],
            soldiers: perUnitSoldiers,
            morale: 80 + Math.floor(o.stats.charisma / 10),
            deployed: false,
        }));
        // 적군: 방어 도시의 무장/병력 반영
        const tgtOfficers = (tgtCity?.officerIds ?? [])
            .map(id => store.getOfficer(id))
            .filter((o) => o !== null)
            .sort((a, b) => b.stats.leadership - a.stats.leadership)
            .slice(0, 3);
        const enemyPer = Math.floor((tgtCity?.development ?? 3500) / Math.max(1, tgtOfficers.length));
        const enemyTypes = ['INFANTRY', 'CAVALRY', 'ARCHER'];
        enemyUnits = tgtOfficers.map((o, i) => ({
            unitId: `enemy_${i + 1}`, officerId: o.id, unitType: enemyTypes[i],
            soldiers: enemyPer, morale: 70, training: 60,
            position: { q: 3, r: -1 + i }, facing: 0, isSupplied: true,
            baseAttack: 60 + Math.floor(o.stats.might / 3), baseDefense: 55 + Math.floor(o.stats.leadership / 4),
            movementPoints: 4, maxMovementPoints: 4, hasEvasionSkill: false, evasionProbability: 0.1,
        }));
        // 인접 아군 도시 증원 반영 [107] — 방어 도시 소유 세력의 인접 도시가 지원군 파견
        if (tgtCity?.ownerId) {
            const allCities = store.getAllCities();
            const allOfficers = Object.values(store.getState().officers);
            const reinf = assembleReinforcements(tgtCity.id, tgtCity.ownerId, allCities, allOfficers, Object.values(store.getState().armies));
            if (reinf.officerIds.length > 0 && reinf.totalTroops > 0) {
                const reinfTypes = ['CAVALRY', 'ARCHER', 'INFANTRY'];
                reinf.officerIds.slice(0, 2).forEach((oid, i) => {
                    const o = store.getOfficer(oid);
                    if (!o)
                        return;
                    const perUnit = Math.floor(reinf.totalTroops / reinf.officerIds.length);
                    enemyUnits.push({
                        unitId: `enemy_r${i + 1}`, officerId: oid, unitType: reinfTypes[i % reinfTypes.length],
                        soldiers: perUnit, morale: 75, training: 60,
                        position: { q: 4, r: i }, facing: 0, isSupplied: true,
                        baseAttack: 55 + Math.floor(o.stats.might / 3), baseDefense: 50 + Math.floor(o.stats.leadership / 4),
                        movementPoints: 5, maxMovementPoints: 5, hasEvasionSkill: false, evasionProbability: 0.1,
                    });
                });
                const srcNames = reinf.contingents.map(c => store.getCity(c.sourceCityId)?.name ?? c.sourceCityId).join(', ');
                addLog(`🛡️ ${tgtCity.name}에 ${srcNames}에서 증원 ${reinf.totalTroops.toLocaleString()}명 도착!`);
            }
        }
        void gs;
    }
    else {
        deployable = [
            { unitId: 'friendly_1', officerName: '유비', unitType: 'INFANTRY', soldiers: 5000, morale: 85, deployed: false },
            { unitId: 'friendly_2', officerName: '관우', unitType: 'CAVALRY', soldiers: 3000, morale: 90, deployed: false },
            { unitId: 'friendly_3', officerName: '장비', unitType: 'INFANTRY', soldiers: 4000, morale: 88, deployed: false },
            { unitId: 'friendly_4', officerName: '제갈량', unitType: 'ARCHER', soldiers: 2000, morale: 95, deployed: false },
        ];
        enemyUnits = [
            { unitId: 'enemy_1', officerId: 'enemy_1', unitType: 'INFANTRY', soldiers: 4000, morale: 70, training: 60,
                position: { q: 3, r: -1 }, facing: 0, isSupplied: true, baseAttack: 75, baseDefense: 65,
                movementPoints: 4, maxMovementPoints: 4, hasEvasionSkill: false, evasionProbability: 0.1 },
            { unitId: 'enemy_2', officerId: 'enemy_2', unitType: 'CAVALRY', soldiers: 2500, morale: 75, training: 65,
                position: { q: 4, r: -2 }, facing: 0, isSupplied: true, baseAttack: 85, baseDefense: 55,
                movementPoints: 6, maxMovementPoints: 6, hasEvasionSkill: false, evasionProbability: 0.1 },
            { unitId: 'enemy_3', officerId: 'enemy_3', unitType: 'ARCHER', soldiers: 3000, morale: 65, training: 70,
                position: { q: 2, r: 1 }, facing: 0, isSupplied: true, baseAttack: 70, baseDefense: 60,
                movementPoints: 4, maxMovementPoints: 4, hasEvasionSkill: false, evasionProbability: 0.15 },
        ];
    }
    void deployable;
    void enemyUnits;
    // 복수 이벤트 판정 [32][33][C-인간관계] — 출진 편성에 실제 무장 ID가 있는 경우
    // 아군×적군 유닛쌍 중 NEMESIS 관계가 조우하면 복수 이벤트 발동:
    // 플레이어 관여(아군이 주도) → 인터랙티브 미니게임 / AI 주도 → 자동 판정
    if (expeditionSource && expeditionTarget && engine) {
        const storeV = engine['store'];
        const gsV = storeV.getGlobalState();
        const friendlyIds = (storeV.getCity(expeditionSource)?.officerIds ?? []).slice(0, 4);
        // 수비 도시 전체 무장을 복수 판정 대상으로 (전투 유닛은 상위 3명뿐이지만 관계망은 전원)
        const enemyOfficerIds = storeV.getCity(expeditionTarget)?.officerIds ?? [];
        outer: for (const fId of friendlyIds) {
            for (const eId of enemyOfficerIds) {
                const judged = judgeVengeanceOnly(storeV, fId, eId);
                if (!judged.triggered || !judged.kind || !judged.actorId || !judged.targetId)
                    continue;
                // 주도자가 플레이어 세력 소속이면 인터랙티브 모달로 진행
                const actor = storeV.getOfficer(judged.actorId);
                if (actor && actor.factionId === gsV.playerFactionId) {
                    openVengeanceModal(storeV, judged.actorId, judged.targetId, judged.kind, deployable, enemyUnits);
                }
                else {
                    // AI 주도 — 자동 판정 + 전투 유닛 임팩트 [32][131-145]
                    const outcome = tryVengeanceOnEncounter(storeV, fId, eId);
                    if (outcome.triggered) {
                        addLog(outcome.message);
                        const impact = applyVengeanceToUnits(outcome, deployable, enemyUnits);
                        if (impact.allyLog)
                            addLog(impact.allyLog);
                        if (impact.enemyLog)
                            addLog(`🪫 ${storeV.getCity(expeditionTarget)?.name ?? '적군'} 병력 사기가 흔들립니다`);
                    }
                }
                break outer; // 전투당 복수 이벤트 1회
            }
        }
    }
    battleFrontend = new BattleFrontend(hexRenderer);
    battleFrontend.setCallbacks({
        onPhaseChange: (phase) => {
            updateBattleUI();
            // 출진 전투 종료 판정 — 승패에 따라 도시 점령/패배 처리 [105]
            if (phase === 'RESULT' && expeditionSource && expeditionTarget) {
                const remaining = battleFrontend.getState().units.some(u => u.unitId.startsWith('friendly_'));
                const enemyRemaining = battleFrontend.getState().units.some(u => !u.unitId.startsWith('friendly_'));
                resolveExpeditionOutcome(remaining && !enemyRemaining);
            }
        },
        onAction: updateBattleUI,
    });
    battleFrontend.initBattle(battleTiles, deployable);
    battleFrontend.state.units.push(...enemyUnits);
    btnBattleStart.style.display = 'inline-block';
    btnEndTurn.style.display = 'none';
    btnBattleRetreat.style.display = 'none';
    addLog('⚔️ 전투 모드 진입 — 유닛을 배치하세요');
    updateBattleUI();
}
function updateBattleUI() {
    const state = battleFrontend.getState();
    // Phase info
    const phaseNames = {
        DEPLOYMENT: '⚔️ 배치 페이즈',
        PLAYER_TURN: '🎯 아군 턴',
        ENEMY_TURN: '👹 적군 턴',
        RESULT: '🏆 전투 종료',
    };
    battlePhase.textContent = phaseNames[state.phase] || state.phase;
    // Button visibility
    btnBattleStart.style.display = state.phase === 'DEPLOYMENT' ? 'inline-block' : 'none';
    btnEndTurn.style.display = state.phase === 'PLAYER_TURN' ? 'inline-block' : 'none';
    btnBattleRetreat.style.display = state.phase === 'PLAYER_TURN' ? 'inline-block' : 'none';
    // Unit cards
    let html = '';
    if (state.phase === 'DEPLOYMENT') {
        for (const u of battleFrontend.getDeployableUnits()) {
            const deployedClass = u.deployed ? 'deployed' : '';
            html += `<div class="battle-unit-card ${deployedClass}" data-unit="${u.unitId}">
                <div><span class="unit-name">${u.officerName}</span>
                <span class="unit-info"> [${u.unitType}]</span></div>
                <div><span class="unit-soldiers">${u.soldiers}명</span> · <span class="unit-morale">사기 ${u.morale}</span></div>
            </div>`;
        }
    }
    else {
        for (const u of state.units) {
            const isFriendly = u.unitId.startsWith('friendly_');
            const sideClass = isFriendly ? '' : 'enemy';
            const selectedClass = u.unitId === state.selectedUnitId ? 'selected' : '';
            const hpPct = u.soldiers > 0 ? Math.max(1, u.soldiers / 100) : 0;
            const hpColor = hpPct > 60 ? '#44cc88' : hpPct > 30 ? '#ccaa44' : '#cc4444';
            html += `<div class="battle-unit-card ${sideClass} ${selectedClass}" data-unit="${u.unitId}">
                <div>
                    <div><span class="unit-name">${u.unitId.replace('friendly_', '').replace('enemy_', '')}</span>
                    <span class="unit-info"> [${u.unitType}]</span></div>
                    <div class="hp-bar-bg"><div class="hp-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
                </div>
                <div style="text-align:right">
                    <div class="unit-soldiers">${u.soldiers}명</div>
                    <div class="unit-morale">사기 ${Math.round(u.morale)}</div>
                </div>
            </div>`;
        }
    }
    battleUnits.innerHTML = html;
}
// Battle button handlers
btnBattleStart.addEventListener('click', () => {
    battleFrontend.startBattle();
    addLog('전투 시작!');
    updateBattleUI();
});
btnEndTurn.addEventListener('click', () => {
    battleFrontend.endTurn();
    addLog('턴 종료');
    updateBattleUI();
});
btnBattleRetreat.addEventListener('click', () => {
    isBattleMode = false;
    battlePanel.style.display = 'none';
    btnBattleStart.style.display = 'none';
    btnEndTurn.style.display = 'none';
    btnBattleRetreat.style.display = 'none';
    addLog('🏳️ 퇴각 — 전투 모드 종료');
});
btnBattle.addEventListener('click', () => {
    enterBattleMode();
});
btnReport.addEventListener('click', () => {
    showMonthlyReport();
});
// ============================================================
// 세이브 슬롯 관리 [17][212] — 수동 3슬롯 + 자동 저장 1슬롯
// ============================================================
const slotManager = new SaveSlotManager();
const saveSlotsPanel = document.getElementById('save-slots-panel');
const saveSlotList = document.getElementById('ss-slot-list');
/** 현재 상태를 지정 슬롯에 저장 */
function saveToSlot(slot) {
    if (!engine)
        return;
    try {
        const compressed = engine.saveCompressed();
        const gs = engine['store'].getGlobalState();
        const faction = gs.playerFactionId ? engine['store'].getFaction(gs.playerFactionId) : null;
        const ok = slotManager.save(slot, compressed, {
            year: gs.time.year,
            month: gs.time.month,
            turnCount: gs.turnCount,
            factionName: faction?.name ?? '-',
        });
        addLog(ok
            ? `${slot === 'auto' ? '자동' : `슬롯 ${slot}`} 저장 완료 (${gs.time.year}년 ${gs.time.month}월)`
            : '저장 실패: 저장 공간 부족');
        if (ok)
            renderSaveSlots();
    }
    catch (err) {
        addLog(`저장 실패: ${err}`);
    }
}
/** 지정 슬롯에서 불러와 게임 재시작 */
function loadFromSlot(slot) {
    const data = slotManager.load(slot);
    if (!data) {
        addLog(`슬롯 ${slot}이(가) 비어 있습니다.`);
        return;
    }
    const ok = engine.loadCompressed(data);
    if (!ok) {
        addLog('불러오기 실패: 세이브 데이터가 손상되었습니다.');
        return;
    }
    saveSlotsPanel.style.display = 'none';
    addLog(`슬롯 ${slot === 'auto' ? '자동' : slot}에서 불러왔습니다`);
    void startGame(null);
}
const SLOT_DEFS = [
    { id: 1, label: '슬롯 一' },
    { id: 2, label: '슬롯 二' },
    { id: 3, label: '슬롯 三' },
    { id: 'auto', label: '自動' },
];
/** 슬롯 목록 렌더링 — 메타데이터 미리보기 포함 */
function renderSaveSlots() {
    saveSlotList.innerHTML = SLOT_DEFS.map(({ id, label }) => {
        const meta = slotManager.getMeta(id);
        const name = label + (id === 'auto' ? ' (매월 자동)' : '');
        if (!meta) {
            return `<div class="ss-slot" data-slot="${id}">
                <div class="ss-slot-head"><span class="ss-slot-name">${name}</span><span class="ss-slot-tag">빈 슬롯</span></div>
                <div class="ss-slot-empty">클릭하여 현재 상태를 저장</div>
            </div>`;
        }
        const saved = new Date(meta.savedAt);
        const time = `${saved.getMonth() + 1}/${saved.getDate()} ${String(saved.getHours()).padStart(2, '0')}:${String(saved.getMinutes()).padStart(2, '0')}`;
        return `<div class="ss-slot" data-slot="${id}">
            <div class="ss-slot-head"><span class="ss-slot-name">${name}</span><span class="ss-slot-tag">${time}</span></div>
            <div class="ss-slot-info">${meta.factionName} · ${meta.year}년 ${meta.month}월 · 턴 ${meta.turnCount}</div>
            <div class="ss-slot-actions"><button class="ss-load-btn" data-load="${id}">불러오기</button></div>
        </div>`;
    }).join('');
}
btnSlots.addEventListener('click', () => {
    renderSaveSlots();
    saveSlotsPanel.style.display = saveSlotsPanel.style.display === 'none' || !saveSlotsPanel.style.display ? 'block' : 'none';
});
document.getElementById('ss-close').addEventListener('click', () => {
    saveSlotsPanel.style.display = 'none';
});
saveSlotList.addEventListener('click', (e) => {
    const loadBtn = e.target.closest('.ss-load-btn');
    if (loadBtn) {
        e.stopPropagation();
        loadFromSlot(loadBtn.dataset.load);
        return;
    }
    const slotEl = e.target.closest('.ss-slot');
    if (slotEl)
        saveToSlot(slotEl.dataset.slot);
});
// ============================================================
// 外交 패널 [341-360] — 세력 관계도 + 수동 외교 제안
// ============================================================
const diplomacyPanel = document.getElementById('diplomacy-panel');
const dpFactionList = document.getElementById('dp-faction-list');
const dpTreasury = document.getElementById('dp-treasury');
const RELATION_LABEL = {
    alliance: { label: '동맹', cls: 'dp-relation-alliance' },
    war: { label: '전쟁', cls: 'dp-relation-war' },
    neutral: { label: '중립', cls: 'dp-relation-neutral' },
    surrendered: { label: '종속', cls: 'dp-relation-surrendered' },
};
/** 외교 패널 렌더링 — 플레이어 관점의 관계도 + 액션 버튼 */
function renderDiplomacyPanel() {
    if (!engine)
        return;
    const store = engine['store'];
    const gs = store.getGlobalState();
    const playerFactionId = gs.playerFactionId;
    const player = playerFactionId ? store.getFaction(playerFactionId) : null;
    if (!player)
        return;
    dpTreasury.textContent = `國庫 — ${player.gold.toLocaleString()} 金`;
    const diplo = engine.diplomacyEngine;
    const others = store.getAllFactions().filter(f => f.id !== playerFactionId);
    dpFactionList.innerHTML = others.map(f => {
        const rel = diplo.getRelation(playerFactionId, f.id);
        const relInfo = RELATION_LABEL[rel] ?? RELATION_LABEL.neutral;
        const canPeace = rel === FactionRelation.WAR;
        const canAlly = rel === FactionRelation.NEUTRAL;
        const canBreak = rel === FactionRelation.ALLIANCE;
        const canGift = rel !== FactionRelation.WAR;
        const canDeclare = rel !== FactionRelation.WAR;
        return `<div class="dp-faction-row" style="--faction-color:${f.color}">
            <div class="dp-faction-head">
                <span class="dp-faction-name">${f.name}</span>
                <span class="dp-relation-tag ${relInfo.cls}">${relInfo.label}</span>
            </div>
            <div class="dp-actions">
                ${canGift ? `<button class="dp-btn" data-act="gift" data-target="${f.id}">증정 (300金)</button>` : ''}
                ${canAlly ? `<button class="dp-btn" data-act="alliance" data-target="${f.id}">동맹 제안</button>` : ''}
                ${canBreak ? `<button class="dp-btn" data-act="break" data-target="${f.id}">동맹 파기</button>` : ''}
                ${canPeace ? `<button class="dp-btn" data-act="peace" data-target="${f.id}">휴전 제파</button>` : ''}
                ${canDeclare ? `<button class="dp-btn war" data-act="war" data-target="${f.id}">선전포고</button>` : ''}
            </div>
            <div class="dp-result" id="dp-result-${f.id}"></div>
        </div>`;
    }).join('') || '<div class="ss-slot-empty">외교 가능한 타세력이 없습니다.</div>';
}
/** 수동 외교 액션 처리 — 결과를 패널과 로그에 반영 */
function handleDiplomacyAction(action, targetFactionId) {
    if (!engine)
        return;
    const store = engine['store'];
    const gs = store.getGlobalState();
    const playerFactionId = gs.playerFactionId;
    if (!playerFactionId)
        return;
    const diplo = engine.diplomacyEngine;
    const target = store.getFaction(targetFactionId);
    if (!target)
        return;
    let result;
    switch (action) {
        case 'gift': {
            const player = store.getFaction(playerFactionId);
            if (player.gold < 300) {
                result = { success: false, message: '국고가 부족합니다 (300金 필요).' };
                break;
            }
            result = diplo.sendGift(playerFactionId, targetFactionId, 300, 0);
            if (result.success) {
                store.updateFaction(playerFactionId, { gold: player.gold - 300 });
                store.updateFaction(targetFactionId, { gold: target.gold + 300 });
            }
            break;
        }
        case 'alliance':
            // 평판 보정 [11]: 명성 높은 세력의 제안은 받아들여지기 쉬움
            result = diplo.formAlliance(playerFactionId, targetFactionId, getReputationDiplomacyModifier(store, playerFactionId));
            break;
        case 'break':
            result = diplo.breakAlliance(playerFactionId, targetFactionId);
            break;
        case 'peace':
            result = diplo.makePeace(playerFactionId, targetFactionId, getReputationDiplomacyModifier(store, playerFactionId));
            break;
        case 'war':
            result = diplo.declareWar(playerFactionId, targetFactionId);
            break;
        default:
            return;
    }
    addLog(`${result.success ? '🕊️' : '❌'} [외교] ${target.name}: ${result.message}`);
    renderDiplomacyPanel();
}
btnDiplomacy.addEventListener('click', () => {
    renderDiplomacyPanel();
    diplomacyPanel.style.display = diplomacyPanel.style.display === 'none' || !diplomacyPanel.style.display ? 'block' : 'none';
});
document.getElementById('dp-close').addEventListener('click', () => {
    diplomacyPanel.style.display = 'none';
});
dpFactionList.addEventListener('click', (e) => {
    const btn = e.target.closest('.dp-btn');
    if (!btn)
        return;
    handleDiplomacyAction(btn.dataset.act, btn.dataset.target);
});
btnSave.addEventListener('click', () => {
    saveToSlot(1);
});
// ============================================================
// 턴 진행 — '다음 月' 버튼 [201]
// ============================================================
let isAdvancingTurn = false;
btnNextMonth.addEventListener('click', async () => {
    if (!engine || isAdvancingTurn || !isRunning)
        return;
    isAdvancingTurn = true;
    btnNextMonth.disabled = true;
    btnNextMonth.textContent = '⏳ 진행 중...';
    try {
        await engine.executeTurn();
        const gs = engine['store'].getGlobalState();
        addLog(`📅 ${gs.time.year}년 ${gs.time.month}월 — 턴 ${gs.turnCount}`);
        // 월말 정산 요약 갱신 [E1-361][461-480]
        updateSettlementPanel();
        // 지도(소속/영토) + 열려 있는 패널 갱신
        syncChinaMapCities();
        if (currentPanelCityId) {
            const store = engine['store'];
            const city = store.getCity(currentPanelCityId);
            if (city) {
                renderCityDetailPanel(city, city.ownerId ? store.getFaction(city.ownerId) : null, false);
            }
        }
        if (diplomacyPanel.style.display === 'block')
            renderDiplomacyPanel();
    }
    catch (err) {
        addLog(`턴 진행 실패: ${err}`);
    }
    finally {
        isAdvancingTurn = false;
        btnNextMonth.disabled = false;
        btnNextMonth.textContent = '▸ 다음 月';
    }
});
// ============================================================
// Initialize
// ============================================================
function init() {
    addLog('엔진 초기화 중...');
    statusText.textContent = '엔진 초기화 중...';
    resizeCanvas();
    // Create engine and bootstrap
    engine = getGameEngine();
    engineRef.current = engine;
    bootstrap = getBootstrap();
    // Create renderers: 헥사(전투용) + 중국 전도(월드용)
    hexRenderer = new HexMapCanvasRenderer(canvas);
    hexTiles = generateDemoHexTiles();
    chinaMap = new ChinaMapRenderer(canvas);
    // Subscribe to engine events
    engine.subscribe('PHASE_CHANGE', (event) => {
        addLog(`페이즈 전환: ${event.payload.from} → ${event.payload.to}`);
    });
    // AI 세력 월간 외교 이벤트 [341-360]
    engine.subscribe('FACTION_DIPLOMACY', (event) => {
        addLog(`🕊️ [외교] ${event.payload.factionName}: ${event.payload.message}`);
    });
    // AI 세력 월간 행동 후 자동 저장 (auto 슬롯) [212]
    engine.subscribe('FACTION_AI_ACTION', (event) => {
        // AI 행동 로그 표시 [201] — 내정/징병/공성/포로 후처리 메시지를 게임 로그에 반영
        if (event?.payload?.actions) {
            const factionName = event.payload.factionId
                ? engine['store'].getFaction(event.payload.factionId)?.name ?? 'AI'
                : 'AI';
            for (const action of event.payload.actions) {
                addLog(`🤖 [${factionName}] ${action}`);
            }
        }
        if (!engine)
            return;
        try {
            const compressed = engine.saveCompressed();
            const gs = engine['store'].getGlobalState();
            const faction = gs.playerFactionId ? engine['store'].getFaction(gs.playerFactionId) : null;
            slotManager.save('auto', compressed, {
                year: gs.time.year,
                month: gs.time.month,
                turnCount: gs.turnCount,
                factionName: faction?.name ?? '-',
            });
        }
        catch {
            // 자동 저장 실패는 무음 처리 (게임 진행 방해하지 않음)
        }
    });
    engine.subscribe('OFFICER_DEATH', (event) => {
        addLog(`⚔️ ${event.payload.officerName} 사망 (${event.payload.cause})`);
    });
    // 세력 멸망/배신/엔딩 이벤트 [213][24] — 연대기 기록 포함 [441-460]
    engine.subscribe('FACTION_DESTROYED', (event) => {
        addLog(`🔥 세력 멸망: ${event.payload.factionName}`);
        chronicle.add('DESTROYED', `${event.payload.factionName} 세력이 역사에서 사라졌다`);
    });
    engine.subscribe('OFFICER_DEFECTED', (event) => {
        addLog(`🚪 배신: ${event.payload.officerName}이(가) 이탈했습니다`);
        chronicle.add('DEFECTION', `${event.payload.officerName}이(가) 주군을 배신했다`);
    });
    // 포로 탈출 이벤트 [131-145]
    engine.subscribe('CAPTIVE_ESCAPED', (event) => {
        addLog(`🏃 포로 탈출: ${event.payload.officerName}이(가) 수용소에서 탈출했습니다`);
        chronicle.add('CAPTURE', `${event.payload.officerName}이(가) 수용소에서 탈출했다`);
    });
    // 이벤트 연출 [191-200] — 흔들림 + 사운드
    engine.subscribe('VENGEANCE_EVENT', (event) => {
        fireFeedback(event.payload.success ? 'VENGEANCE_SUCCESS' : 'VENGEANCE_FAIL');
    });
    engine.subscribe('SWORN_BROTHER_RESCUED', () => {
        fireFeedback('RESCUE');
    });
    engine.subscribe('FACTION_DESTROYED', () => {
        fireFeedback('FACTION_DESTROYED');
    });
    // 월간 복수 이벤트 [32][33][C-인간관계]
    engine.subscribe('VENGEANCE_EVENT', (event) => {
        addLog(`${event.payload.message}`);
        chronicle.add('VENGEANCE', event.payload.message);
    });
    // 의형제 구출 이벤트 [C-인간관계]
    engine.subscribe('SWORN_BROTHER_RESCUED', (event) => {
        addLog(`🤝 의형제 구출: ${event.payload.rescuerName}이(가) ${event.payload.officerName}을(를) 구했습니다`);
        chronicle.add('RESCUE', `${event.payload.rescuerName}이(가) 의형제 ${event.payload.officerName}을(를) 구출했다`);
    });
    // 의형제 결의 이벤트 [C-인간관계][25]
    engine.subscribe('SWORN_BROTHER_PACT', (event) => {
        addLog(`${event.payload.message}`);
        chronicle.add('PACT', event.payload.message);
        fireFeedback('RESCUE'); // 결의도 밝은 톤으로 연출
    });
    engine.subscribe('GAME_ROAMING_EVENT', (event) => {
        addLog(`${event.payload.message}`);
        chronicle.add('VISIT', event.payload.message);
        if (event.payload.roamingType === 'BANDIT')
            fireFeedback('VENGEANCE_FAIL'); // 산적 약탈 — 경고 톤
        else
            fireFeedback('RESCUE'); // 현자/상인 방문 — 밝은 톤
    });
    // 재야 무장 출사 타진 이벤트 [24][421-440]
    engine.subscribe('FREE_OFFICER_VISIT', (event) => {
        addLog(`${event.payload.message}`);
        chronicle.add('FREE_VISIT', `${event.payload.officerName}이(가) ${event.payload.cityName}을(를) 찾아 출사를 타진했다`);
        fireFeedback('RESCUE');
        // 플레이어 세력 도시 방문 → 선택 모달 (선택지 대기열) [461-480]
        if (event.payload.needsPlayerChoice) {
            pendingVisits.push(event.payload);
            if (pendingVisits.length === 1)
                openVisitModal(pendingVisits[0]);
        }
    });
    engine.subscribe('GAME_ENDING', (event) => {
        showEnding(event.payload.ending, event.payload.winner);
        chronicle.add('ENDING', `${event.payload.winner}이(가) 천하를 통일했다 — ${event.payload.ending}`);
    });
    // 지옥 난이도 제약 이벤트 [X-난이도]
    engine.subscribe('HELL_CONSTRAINT', (event) => {
        addLog(`${event.payload.message}`);
        const kind = event.payload.kind;
        if (kind === 'TAX_LEAK')
            chronicle.add('VISIT', event.payload.message);
        else if (kind === 'DESERTION')
            chronicle.add('DEFECTION', event.payload.message);
        else if (kind === 'REVOLT')
            chronicle.add('DESTROYED', event.payload.message);
        fireFeedback('VENGEANCE_FAIL');
    });
    addLog('엔진 준비 완료 — 게임 시작을 눌러주세요');
    statusText.textContent = '게임 시작 대기 중';
    // Initial render
    renderFrame(0);
}
// ============================================================
// Title Screen — [21] 로비 반응형, [1057] 계절 테마
// ============================================================
/**
 * 엔딩 화면 표시 [213] — 승리(통일) / 패배(세력 멸망 or 타세력 통일)
 */
function showEnding(ending, winnerName) {
    const screen = document.getElementById('ending-screen');
    const title = document.getElementById('ending-title');
    const sub = document.getElementById('ending-sub');
    const body = document.getElementById('ending-body');
    const gs = engine['store'].getGlobalState();
    const playerFaction = gs.playerFactionId ? engine['store'].getFaction(gs.playerFactionId) : null;
    const isVictory = ending === 'PLAYER_UNIFICATION';
    screen.classList.toggle('victory', isVictory);
    screen.classList.toggle('defeat', !isVictory);
    title.textContent = isVictory ? '天下統一' : (ending === 'AI_UNIFICATION' ? '霸業途半' : '勢力減亡');
    sub.textContent = isVictory
        ? `${playerFaction?.name ?? ''} — 천하를 통일했습니다`
        : `${winnerName ?? '타세력'}이(가) 천하를 통일했습니다`;
    body.innerHTML = isVictory
        ? `긴 전란이 끝나고 천하에 평화가 찾아왔습니다.<br>${gs.time.year}년 ${playerFaction?.name ?? ''}의 강토에 태평성세가 열립니다.`
        : `전란의 소용돌이 속에 ${playerFaction?.name ?? '세력'}은(는) 역사 속으로 사라졌습니다.<br>다음 판에서는 누가 천하를 얻을까요.`;
    screen.style.display = 'flex';
    addLog(isVictory ? '🏆 천하통일 — 승리!' : '💀 게임 오버');
}
// 엔딩 → 타이틀 복귀
document.getElementById('btn-ending-title').addEventListener('click', () => {
    document.getElementById('ending-screen').style.display = 'none';
    isRunning = false;
    location.reload();
});
/**
 * 월간 보고서 패널 표시 [E1-361]
 */
function showMonthlyReport() {
    if (!engine || !isRunning)
        return;
    const report = new MonthlyReportSystem(engine['store']).generate();
    const panel = document.getElementById('monthly-report-panel');
    document.getElementById('mr-title').textContent = `月報 — ${report.year}년 ${report.month}월 보고`;
    document.getElementById('mr-finance').innerHTML = `
        <div class="mr-fin-item"><div class="mr-fin-value">${report.playerGold.toLocaleString()}</div><div class="mr-fin-label">국고</div></div>
        <div class="mr-fin-item"><div class="mr-fin-value">+${report.goldIncome}</div><div class="mr-fin-label">월 골드 수입</div></div>
        <div class="mr-fin-item"><div class="mr-fin-value">${report.playerFood.toLocaleString()}</div><div class="mr-fin-label">군량</div></div>
        <div class="mr-fin-item"><div class="mr-fin-value">+${report.foodIncome}</div><div class="mr-fin-label">월 군량 수입</div></div>`;
    document.getElementById('mr-cities').innerHTML = report.cities.map(c => `<div class="mr-row"><span class="mr-name">${c.name}</span><span class="mr-val">자금 ${c.funds} · 병력 ${c.development} · 상${c.commerce}/농${c.farming}</span></div>`).join('')
        || '<div class="mr-row">소속 도시 없음</div>';
    document.getElementById('mr-factions').innerHTML = report.factions.map(f => `<div class="mr-row"><span class="mr-name">${f.name}</span><span class="mr-val">골드 ${f.gold} · 도시 ${f.cities} · 무장 ${f.officers}</span></div>`).join('')
        || '<div class="mr-row">생존 타세력 없음</div>';
    panel.style.display = 'block';
}
document.getElementById('mr-close').addEventListener('click', () => {
    document.getElementById('monthly-report-panel').style.display = 'none';
});
function monthToSeason(month) {
    if (month <= 2 || month === 12)
        return 'winter';
    if (month <= 5)
        return 'spring';
    if (month <= 8)
        return 'summer';
    return 'autumn';
}
// Load save if exists — 슬롯 매니저 기반 (구버전 단일 키 폴백 포함) [17]
const titleSlotManager = new SaveSlotManager();
const hasAnySave = titleSlotManager.hasAnySave();
if (hasAnySave) {
    addLog('이전 저장 데이터 발견');
}
const titleScreen = new TitleScreen({
    onNewGame: () => { openScenarioScreen(); },
    onContinue: () => {
        try {
            // 최근 저장 슬롯(auto 폴백 포함)을 찾아 복원
            const metas = titleSlotManager.getAllMetas();
            const latest = metas.sort((a, b) => b.savedAt - a.savedAt)[0];
            const data = latest ? titleSlotManager.load(latest.slot) : titleSlotManager.load('auto');
            if (!data)
                return;
            const ok = engine.loadCompressed(data);
            if (!ok) {
                addLog('불러오기 실패: 세이브 데이터가 손상되었습니다. 새로운 시작을 이용하세요.');
                statusText.textContent = '불러오기 실패';
                return;
            }
            addLog(latest ? `슬롯 ${latest.slot === 'auto' ? '자동' : latest.slot}에서 불러오기 완료` : '세이브 불러오기 완료');
            void startGame(null);
        }
        catch (err) {
            addLog(`불러오기 실패: ${err}`);
        }
    },
});
titleScreen.setHasSave(hasAnySave);
titleScreen.show();
init();
// ============================================================
// 시나리오 선택 → 세력 선택 → 게임 시작 [9]
// ============================================================
const scenarioScreen = document.getElementById('scenario-screen');
const factionScreen = document.getElementById('faction-screen');
const scenarioList = document.getElementById('scenario-list');
const factionList = document.getElementById('faction-list');
let selectedScenario = null;
async function openScenarioScreen() {
    try {
        const scenarios = await loadScenarios();
        renderScenarioList(scenarios);
        factionScreen.style.display = 'none';
        scenarioScreen.style.display = 'flex';
    }
    catch (err) {
        addLog(`시나리오 로드 실패: ${err}`);
        statusText.textContent = '시나리오 로드 실패';
    }
}
function renderScenarioList(scenarios) {
    scenarioList.innerHTML = scenarios.map(s => {
        const [y, m] = s.start_date.split('-');
        const stars = '★'.repeat(s.difficulty) + `<span class="off">${'★'.repeat(Math.max(0, 5 - s.difficulty))}</span>`;
        // 난이도 배율 요약 [X-난이도] — 사건 빈도/산적 피해를 직관적으로 안내
        const mult = DIFFICULTY_MULTIPLIERS[Math.min(4, Math.max(0, s.difficulty - 1))];
        const freqPct = Math.round((mult.roamingFrequency - 1) * 100);
        const banditPct = Math.round((mult.banditScale - 1) * 100);
        const balText = `${freqPct >= 0 ? '사건 +' + freqPct : '사건 ' + freqPct}% · 산적 ${banditPct >= 0 ? '+' : ''}${banditPct}%`;
        const balClass = s.difficulty <= 2 ? 'bal-easy' : s.difficulty >= 4 ? 'bal-hard' : 'bal-std';
        return `<button class="scenario-card" data-id="${s.id}">
            <span class="scenario-num">${s.id}</span>
            <span class="scenario-body">
                <span class="scenario-name">${s.title_kr}</span>
                <span class="scenario-date">${y}년 ${Number(m)}월 — ${s.title_en}</span>
                <span class="scenario-desc">${s.description}</span>
            </span>
            <span class="scenario-side">
                <span class="difficulty">${stars}</span>
                <span class="difficulty-balance ${balClass}">${balText}</span>
                <span class="faction-count">세력 ${s.factions.length}</span>
            </span>
        </button>`;
    }).join('');
}
scenarioList.addEventListener('click', (e) => {
    const card = e.target.closest('.scenario-card');
    if (!card)
        return;
    const id = card.dataset.id;
    const s = getCachedScenarios().find(x => x.id === id);
    if (!s)
        return;
    selectedScenario = s;
    renderFactionList(s);
    scenarioScreen.style.display = 'none';
    factionScreen.style.display = 'flex';
});
function renderFactionList(s) {
    document.getElementById('faction-screen-sub').textContent =
        `${s.title_kr} — ${s.start_date.replace('-', '년 ')}월 · 세력을 선택하세요`;
    factionList.innerHTML = s.factions.map((f, i) => `<button class="faction-card" data-idx="${i}" style="--faction-color:${f.color}">
            <span class="faction-name">${f.name}</span>
            <span class="faction-leader">군주: ${getKnownOfficerName(f.leader_id)}</span>
            <span class="faction-cap">수도: ${f.capital}</span>
        </button>`).join('');
}
factionList.addEventListener('click', (e) => {
    const card = e.target.closest('.faction-card');
    if (!card || !selectedScenario)
        return;
    const idx = Number(card.dataset.idx);
    factionScreen.style.display = 'none';
    const world = buildWorld(selectedScenario, idx);
    void startGame(world);
});
document.getElementById('btn-scenario-back').addEventListener('click', () => {
    scenarioScreen.style.display = 'none';
    titleScreen.show();
});
document.getElementById('btn-faction-back').addEventListener('click', () => {
    factionScreen.style.display = 'none';
    scenarioScreen.style.display = 'flex';
});
window.__game = {
    getChinaMap: () => chinaMap,
    getWorldCities: () => worldCities,
    getEngine: () => engine,
    getStore: () => engine?.['store'] ?? null,
    /** E2E/테스트용: 코어 시스템 모듈 접근자 (동적 import 실패 우회) */
    systems: {
        freeOfficerVisit: () => free_officer_visit_system,
        roamingEvent: () => roaming_event_system,
        vengeance: () => vengeance_system,
        captiveEscape: () => captive_escape_system,
    },
    /** E2E 테스트용: 시나리오 지정 시작 (예: startScenario('05', 2)) */
    startScenario: (id, factionIndex) => {
        void loadScenarios().then(() => {
            const loaded = getCachedScenarios().find(s => s.id === id);
            if (!loaded)
                return false;
            const world = buildWorld(loaded, factionIndex);
            void startGame(world);
            return true;
        });
        return true;
    },
    /** E2E 테스트용: 세이브 수행 */
    saveGame: () => {
        if (!engine)
            return false;
        const compressed = engine.saveCompressed();
        try {
            localStorage.setItem('sik_re_save', compressed);
            return true;
        }
        catch {
            return false;
        }
    },
};
//# sourceMappingURL=main.js.map