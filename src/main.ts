/**
 * 삼국지 8 리메이크 — 브라우저 엔트리 포인트
 *
 * GameEngine + BootstrapContext 초기화,
 * Canvas 렌더링 루프, UI 바인딩.
 */

import { GameEngine, getGameEngine } from './core/game_engine.js';
import { BootstrapContext, getBootstrap } from './core/bootstrap.js';
import { OfficerBuilder } from './core/officer_factory.js';
import { HexMapCanvasRenderer, HexTile } from './core/hex_map_canvas_renderer.js';
import { BattleFrontend, DeployableUnit, BattlePhase } from './core/battle_frontend.js';

// ============================================================
// DOM References
// ============================================================

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const turnDisplay = document.getElementById('turn-display')!;
const dateDisplay = document.getElementById('date-display')!;
const phaseDisplay = document.getElementById('phase-display')!;
const statusText = document.getElementById('status-text')!;
const fpsDisplay = document.getElementById('fps-display')!;
const logContent = document.getElementById('log-content')!;
const officerDetail = document.getElementById('officer-detail')!;
const factionDetail = document.getElementById('faction-detail')!;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnBattle = document.getElementById('btn-battle') as HTMLButtonElement;

// ============================================================
// Engine State
// ============================================================

let engine: GameEngine;
let bootstrap: BootstrapContext;
let isRunning = false;
let isPaused = false;
let animFrameId: number | null = null;
let lastFrameTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let currentFps = 0;

// ============================================================
// Hex Map State
// ============================================================

let hexRenderer: HexMapCanvasRenderer;
let hexTiles: HexTile[] = [];
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let selectedHex: { q: number; r: number } | null = null;

// ============================================================
// Battle State
// ============================================================

let battleFrontend: BattleFrontend;
let isBattleMode = false;

// ============================================================
// Logging
// ============================================================

function addLog(msg: string): void {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// ============================================================
// Demo Hex Map Data
// ============================================================

function generateDemoHexTiles(): HexTile[] {
    const tiles: HexTile[] = [];
    const radius = 4;

    for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
            const s = -q - r;
            if (Math.abs(s) > radius) continue;

            const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
            let terrain: string;
            let label: string | undefined;
            let ownerColor: string | undefined;

            if (q === 0 && r === 0) {
                terrain = 'city';
                label = '성도';
                ownerColor = '#e94560';
            } else if (q === 2 && r === -1) {
                terrain = 'city';
                label = '장안';
                ownerColor = '#e94560';
            } else if (q === -2 && r === 1) {
                terrain = 'city';
                label = '허창';
                ownerColor = '#e94560';
            } else if (q === 1 && r === 2) {
                terrain = 'city';
                label = '건업';
                ownerColor = '#e94560';
            } else if (q === -1 && r === -2) {
                terrain = 'city';
                label = '낙양';
                ownerColor = '#e94560';
            } else if (q === 3 && r === -2) {
                terrain = 'city';
                label = '업';
                ownerColor = '#e94560';
            } else if (q === -3 && r === 2) {
                terrain = 'city';
                label = '장안';
                ownerColor = '#e94560';
            } else if (q === 0 && r === 3) {
                terrain = 'city';
                label = '건업';
                ownerColor = '#e94560';
            } else if (q === 0 && r === -3) {
                terrain = 'city';
                label = '북평';
                ownerColor = '#e94560';
            } else if (q === 3 && r === 0) {
                terrain = 'city';
                label = '수춘';
                ownerColor = '#e94560';
            } else if (q === -3 && r === 0) {
                terrain = 'city';
                label = '낙양';
                ownerColor = '#e94560';
            } else if (Math.abs(q) <= 1 && Math.abs(r) <= 1) {
                terrain = 'plain';
            } else if (Math.abs(q) === 2 && Math.abs(r) <= 2) {
                terrain = Math.random() > 0.6 ? 'forest' : 'plain';
            } else if (Math.abs(q) === 3 && Math.abs(r) <= 3) {
                terrain = Math.random() > 0.5 ? 'mountain' : 'forest';
            } else if (Math.abs(q) === 4 && Math.abs(r) <= 4) {
                terrain = Math.random() > 0.4 ? 'water' : 'swamp';
            } else {
                terrain = 'water';
            }

            tiles.push({ q, r, terrain, label, ownerColor });
        }
    }
    return tiles;
}

// ============================================================
// Hex Map Mouse Interaction
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
        hexRenderer.pan(dx, dy);
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    } else {
        const hex = hexRenderer.screenToHex(px, py);
        hexRenderer.setHoveredHex(hex);
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    hexRenderer.setHoveredHex(null);
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hex = hexRenderer.screenToHex(px, py);
    selectedHex = hex;
    for (const tile of hexTiles) {
        tile.isSelected = (tile.q === hex.q && tile.r === hex.r);
    }
    const tile = hexTiles.find(t => t.q === hex.q && t.r === hex.r);
    if (tile) {
        officerDetail.textContent = `헥스 (${hex.q}, ${hex.r}) — ${tile.terrain}${tile.label ? ` — ${tile.label}` : ''}`;
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    hexRenderer.zoomAt(factor, px, py);
});

// ============================================================
// Game Loop
// ============================================================

function gameLoop(timestamp: number): void {
    if (!isRunning) return;

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

function resizeCanvas(): void {
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

window.addEventListener('resize', resizeCanvas);

// ============================================================
// Render Frame
// ============================================================

function renderFrame(_dt: number): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    } else {
        hexRenderer.render(hexTiles, canvas.width, canvas.height);
        const state = engine?.getCurrentPhase();
        if (state) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px sans-serif';
            ctx.fillText(`Phase: ${state}`, 12, 24);
        }
    }
}

// ============================================================
// UI Update
// ============================================================

let uiTick = 0;

function updateUI(): void {
    uiTick++;
    if (uiTick % 10 !== 0) return;

    try {
        const gs = engine['store'].getGlobalState();
        turnDisplay.textContent = `턴 ${gs.turnCount}`;
        dateDisplay.textContent = `${gs.time.year}년 ${gs.time.month}월`;
        phaseDisplay.textContent = engine.getCurrentPhase();
    } catch {
        // engine not fully initialized
    }
}

// ============================================================
// Button Handlers
// ============================================================

btnStart.addEventListener('click', async () => {
    if (isRunning) return;

    addLog('게임 월드 초기화 중...');
    statusText.textContent = '월드 생성 중...';

    // Create sample officers
    const officers = [
        OfficerBuilder.create('off_1', '유비')
            .setStats({ leadership: 85, might: 75, intelligence: 70, politics: 65, charisma: 95 })
            .setPersonality('RIGHTEOUS')
            .build(),
        OfficerBuilder.create('off_2', '관우')
            .setStats({ leadership: 90, might: 95, intelligence: 65, politics: 50, charisma: 80 })
            .setPersonality('LOYAL')
            .build(),
        OfficerBuilder.create('off_3', '장비')
            .setStats({ leadership: 80, might: 98, intelligence: 40, politics: 30, charisma: 55 })
            .setPersonality('AGGRESSIVE')
            .build(),
    ];

    // Initialize world via engine
    try {
        engine.initWorld(
            officers,
            [{ id: 'fac_shu', name: '촉', gold: 1000, food: 5000, officerIds: ['off_1', 'off_2', 'off_3'], cities: [], armies: [], color: '#e94560', diplomacy: {}, isHuman: true, aiPersonality: 'BALANCED', capitalCityId: null, lords: ['off_1'], factionGoal: 'UNIFICATION' } as any],
            [{ id: 'city_cd', name: '성도', factionId: 'fac_shu', population: 50000, gold: 500, food: 2000, garrison: 10000, loyalty: 80, development: 50, publicOrder: 60, taxRate: 30, goldIncome: 100, foodIncome: 300, facilities: [], ownerId: 'off_1', governorId: 'off_1', hexQ: 0, hexR: 0, terrain: 'PLAINS' } as any],
            [],
        );
        addLog('월드 생성 완료 — 3무장, 1세력, 1도시');
    } catch (err) {
        addLog(`월드 초기화 실패: ${err}`);
        statusText.textContent = '초기화 실패';
        return;
    }

    isRunning = true;
    isPaused = false;
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnSave.disabled = false;
    btnBattle.disabled = false;
    statusText.textContent = '게임 실행 중';
    lastFrameTime = 0;

    addLog('게임 루프 시작');
    animFrameId = requestAnimationFrame(gameLoop);
});

btnPause.addEventListener('click', () => {
    if (!isRunning) return;
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? '재개' : '일시정지';
    statusText.textContent = isPaused ? '일시정지' : '게임 실행 중';
    if (!isPaused) {
        lastFrameTime = 0;
        animFrameId = requestAnimationFrame(gameLoop);
    }
});

// ============================================================
// Battle UI Event Handlers
// ============================================================

const battlePanel = document.getElementById('battle-panel')!;
const battlePhase = document.getElementById('battle-phase')!;
const battleUnits = document.getElementById('battle-units')!;
const btnBattleStart = document.getElementById('btn-battle-start') as HTMLButtonElement;
const btnEndTurn = document.getElementById('btn-end-turn') as HTMLButtonElement;
const btnBattleRetreat = document.getElementById('btn-battle-retreat') as HTMLButtonElement;

function enterBattleMode(): void {
    if (!engine || !isRunning) return;
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
                  t.terrain === 'desert' ? 'DESERT' : 'PLAINS') as any,
        elevation: 0,
        defense: 1,
        hasForestCover: t.terrain === 'forest',
        isRiverCrossing: false,
    }));

    const deployable: DeployableUnit[] = [
        { unitId: 'friendly_1', officerName: '유비', unitType: 'INFANTRY', soldiers: 5000, morale: 85, deployed: false },
        { unitId: 'friendly_2', officerName: '관우', unitType: 'CAVALRY', soldiers: 3000, morale: 90, deployed: false },
        { unitId: 'friendly_3', officerName: '장비', unitType: 'INFANTRY', soldiers: 4000, morale: 88, deployed: false },
        { unitId: 'friendly_4', officerName: '제갈량', unitType: 'ARCHER', soldiers: 2000, morale: 95, deployed: false },
    ];

    battleFrontend = new BattleFrontend(hexRenderer);
    battleFrontend.setCallbacks({ onPhaseChange: updateBattleUI, onAction: updateBattleUI });
    battleFrontend.initBattle(battleTiles, deployable);

    const enemyUnits = [
        { unitId: 'enemy_1', officerId: 'enemy_1', unitType: 'INFANTRY' as const, soldiers: 4000, morale: 70, training: 60,
          position: { q: 3, r: -1 }, facing: 0, isSupplied: true, baseAttack: 75, baseDefense: 65,
          movementPoints: 4, maxMovementPoints: 4, hasEvasionSkill: false, evasionProbability: 0.1 },
        { unitId: 'enemy_2', officerId: 'enemy_2', unitType: 'CAVALRY' as const, soldiers: 2500, morale: 75, training: 65,
          position: { q: 4, r: -2 }, facing: 0, isSupplied: true, baseAttack: 85, baseDefense: 55,
          movementPoints: 6, maxMovementPoints: 6, hasEvasionSkill: false, evasionProbability: 0.1 },
        { unitId: 'enemy_3', officerId: 'enemy_3', unitType: 'ARCHER' as const, soldiers: 3000, morale: 65, training: 70,
          position: { q: 2, r: 1 }, facing: 0, isSupplied: true, baseAttack: 70, baseDefense: 60,
          movementPoints: 4, maxMovementPoints: 4, hasEvasionSkill: false, evasionProbability: 0.15 },
    ];
    (battleFrontend as any).state.units.push(...enemyUnits);

    btnBattleStart.style.display = 'inline-block';
    btnEndTurn.style.display = 'none';
    btnBattleRetreat.style.display = 'none';

    addLog('⚔️ 전투 모드 진입 — 유닛을 배치하세요');
    updateBattleUI();
}

function updateBattleUI(): void {
    const state = battleFrontend.getState();

    // Phase info
    const phaseNames: Record<string, string> = {
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
    } else {
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

btnSave.addEventListener('click', () => {
    try {
        const compressed = engine.saveCompressed();
        localStorage.setItem('sik_re_save', compressed);
        addLog('게임 저장 완료');
    } catch (err) {
        addLog(`저장 실패: ${err}`);
    }
});

// ============================================================
// Initialize
// ============================================================

function init(): void {
    addLog('엔진 초기화 중...');
    statusText.textContent = '엔진 초기화 중...';

    resizeCanvas();

    // Create engine and bootstrap
    engine = getGameEngine();
    bootstrap = getBootstrap();

    // Create hex renderer and demo data
    hexRenderer = new HexMapCanvasRenderer(canvas);
    hexTiles = generateDemoHexTiles();

    // Subscribe to engine events
    engine.subscribe('PHASE_CHANGE', (event: any) => {
        addLog(`페이즈 전환: ${event.payload.from} → ${event.payload.to}`);
    });

    engine.subscribe('OFFICER_DEATH', (event: any) => {
        addLog(`⚔️ ${event.payload.officerName} 사망 (${event.payload.cause})`);
    });

    addLog('엔진 준비 완료 — 게임 시작을 눌러주세요');
    statusText.textContent = '게임 시작 대기 중';

    // Initial render
    renderFrame(0);
}

// Load save if exists
const savedData = localStorage.getItem('sik_re_save');
if (savedData) {
    addLog('이전 저장 데이터 발견');
}

init();