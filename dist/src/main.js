/**
 * 삼국지 8 리메이크 — 브라우저 엔트리 포인트
 *
 * GameEngine + BootstrapContext 초기화,
 * Canvas 렌더링 루프, UI 바인딩.
 */
import { getGameEngine } from './core/game_engine.js';
import { getBootstrap } from './core/bootstrap.js';
import { OfficerBuilder } from './core/officer_factory.js';
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
// Logging
// ============================================================
function addLog(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
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
function renderFrame(_dt) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw grid if engine has state
    const state = engine?.getCurrentPhase();
    if (state) {
        ctx.fillStyle = '#3a3a5e';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Phase: ${state}`, 12, 24);
    }
    // Draw centered title when not started
    if (!isRunning) {
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 36px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('삼국지 8 리메이크', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#8080a0';
        ctx.font = '16px sans-serif';
        ctx.fillText('게임 시작을 눌러주세요', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'start';
    }
}
// ============================================================
// UI Update
// ============================================================
let uiTick = 0;
function updateUI() {
    uiTick++;
    if (uiTick % 10 !== 0)
        return; // every ~10 frames
    try {
        const gs = engine['store'].getGlobalState();
        turnDisplay.textContent = `턴 ${gs.turnCount}`;
        dateDisplay.textContent = `${gs.time.year}년 ${gs.time.month}월`;
        phaseDisplay.textContent = engine.getCurrentPhase();
    }
    catch {
        // engine not fully initialized
    }
}
// ============================================================
// Button Handlers
// ============================================================
btnStart.addEventListener('click', async () => {
    if (isRunning)
        return;
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
        engine.initWorld(officers, [{ id: 'fac_shu', name: '촉', gold: 1000, food: 5000, officerIds: ['off_1', 'off_2', 'off_3'], cities: [], armies: [], color: '#e94560', diplomacy: {}, isHuman: true, aiPersonality: 'BALANCED', capitalCityId: null, lords: ['off_1'], factionGoal: 'UNIFICATION' }], [{ id: 'city_cd', name: '성도', factionId: 'fac_shu', population: 50000, gold: 500, food: 2000, garrison: 10000, loyalty: 80, development: 50, publicOrder: 60, taxRate: 30, goldIncome: 100, foodIncome: 300, facilities: [], ownerId: 'off_1', governorId: 'off_1', hexQ: 0, hexR: 0, terrain: 'PLAINS' }], []);
        addLog('월드 생성 완료 — 3무장, 1세력, 1도시');
    }
    catch (err) {
        addLog(`월드 초기화 실패: ${err}`);
        statusText.textContent = '초기화 실패';
        return;
    }
    isRunning = true;
    isPaused = false;
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnSave.disabled = false;
    statusText.textContent = '게임 실행 중';
    lastFrameTime = 0;
    addLog('게임 루프 시작');
    animFrameId = requestAnimationFrame(gameLoop);
});
btnPause.addEventListener('click', () => {
    if (!isRunning)
        return;
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? '재개' : '일시정지';
    statusText.textContent = isPaused ? '일시정지' : '게임 실행 중';
    if (!isPaused) {
        lastFrameTime = 0;
        animFrameId = requestAnimationFrame(gameLoop);
    }
});
btnSave.addEventListener('click', () => {
    try {
        const compressed = engine.saveCompressed();
        localStorage.setItem('sik_re_save', compressed);
        addLog('게임 저장 완료');
    }
    catch (err) {
        addLog(`저장 실패: ${err}`);
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
    bootstrap = getBootstrap();
    // Subscribe to engine events
    engine.subscribe('PHASE_CHANGE', (event) => {
        addLog(`페이즈 전환: ${event.payload.from} → ${event.payload.to}`);
    });
    engine.subscribe('OFFICER_DEATH', (event) => {
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
//# sourceMappingURL=main.js.map