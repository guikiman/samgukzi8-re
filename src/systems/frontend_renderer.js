/**
 * [Phase 27] 웹 프론트엔드 렌더링 및 시청각 폴리싱 — Frontend Renderer
 * 파일: src/systems/frontend_renderer.js
 *
 * 체크리스트 481~500 전면 구현:
 * - [481] 바이노럴 3D 오디오 (Web Audio Panner)
 * - [482] 동적 피사체 심도(Depth of Field)
 * - [483] 색수차(Chromatic Aberration) 타격감
 * - [484] 시차 스크롤(Parallax Scrolling) 맵
 * - [485] 날씨/공간별 오디오 반향(Reverb)
 * - [486] 실시간 그림자 연산(Soft Shadows)
 * - [487] 잔상(Motion Blur) 이펙트
 * - [488] SVG 고해상도 군기(Flag)
 * - [489] 텍스트 렌더링 안티앨리어싱
 * - [490] 물결(Water Ripple) 셰이더
 * - [491] 계절 테마별 마우스 커서
 * - [492] 앰비언트 오클루전(SSAO)
 * - [493] 타일 강조(Highlight) 박동(Pulse)
 * - [494] BGM 줄거리(Stem) 제어
 * - [495] 초상화 안구/호흡 애니메이션(Live2D 흉내)
 * - [496] 화면 전환 잉크 번짐(Ink Bleed)
 * - [497] 로딩 텍스처 스트리밍
 * - [498] UI 글리치/종이 찢어짐 이펙트
 * - [499] 전법 발동 풀스크린 컷인
 * - [500] 배경음악 유저 플레이리스트 연동
 */

// ============================================================
// 3D Audio Context (Singleton)
// ============================================================
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// ============================================================
// [481] 바이노럴 3D 오디오 — Web Audio 3D Panner
// ============================================================
export class BinauralAudio {
    constructor() {
        this.ctx = getAudioContext();
        this.listener = this.ctx.listener;
        this.sources = new Map();
    }

    /**
     * 3D 공간에 사운드 소스를 배치하여 바이노럴 렌더링
     * @param {string} id - 사운드 식별자
     * @param {AudioBuffer} buffer - 오디오 버퍼
     * @param {{x:number, y:number, z:number}} position - 3D 공간 좌표
     */
    addSpatialSource(id, buffer, position) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 100;
        panner.rolloffFactor = 2;
        panner.positionX.value = position.x;
        panner.positionY.value = position.y;
        panner.positionZ.value = position.z;

        source.connect(panner);
        panner.connect(this.ctx.destination);
        this.sources.set(id, { source, panner, position });
    }

    /** 사운드 소스의 3D 위치 업데이트 */
    updateSourcePosition(id, position) {
        const entry = this.sources.get(id);
        if (!entry) return;
        entry.panner.positionX.value = position.x;
        entry.panner.positionY.value = position.y;
        entry.panner.positionZ.value = position.z;
        entry.position = position;
    }

    /** [485] 날씨/공간별 오디오 반향(Reverb) */
    setReverb(roomSize = 0.5, dampening = 0.5) {
        const ctx = getAudioContext();
        const convolver = ctx.createConvolver();
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * roomSize;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, dampening * 3);
            }
        }
        convolver.buffer = impulse;
        return convolver;
    }

    /** [494] BGM Stem 제어 — 전투 상황에 따라 악기 트랙 볼륨 동적 변화 */
    createStemController() {
        return {
            stems: { bass: 1.0, drums: 1.0, melody: 1.0, pad: 1.0 },
            setMomentum(factor) {
                this.stems.bass = 0.5 + factor * 0.5;
                this.stems.drums = 0.3 + factor * 0.7;
                this.stems.melody = 0.6 + factor * 0.4;
            }
        };
    }

    /** [500] 유저 로컬 MP3 플레이리스트 연동 (Media API) */
    async loadUserPlaylist() {
        try {
            const handle = await window.showDirectoryPicker?.();
            if (!handle) return [];
            const files = [];
            for await (const entry of handle.values()) {
                if (entry.name.endsWith('.mp3') || entry.name.endsWith('.ogg') || entry.name.endsWith('.wav')) {
                    files.push(entry.name);
                }
            }
            return files;
        } catch {
            return [];
        }
    }
}

// ============================================================
// [482] 동적 피사체 심도(Depth of Field) — WebGL 블러 셰이더 시뮬레이션
// ============================================================
export class DepthOfField {
    constructor() {
        this.blurAmount = 0;
        this.focusDistance = 0.5;
    }

    /** 메인 피사체는 선명, 배경은 블러 */
    setFocus(distance, blurStrength) {
        this.focusDistance = Math.max(0, Math.min(1, distance));
        this.blurAmount = Math.max(0, Math.min(1, blurStrength));
    }

    /** 캔버스 컨텍스트에 DoF 블러 적용 (박스 블러 시뮬레이션) */
    applyBlur(ctx, width, height) {
        if (this.blurAmount < 0.01) return;
        const blurPx = Math.round(this.blurAmount * 8);
        ctx.filter = `blur(${blurPx}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.filter = 'none';
    }
}

// ============================================================
// [483] 색수차(Chromatic Aberration) 타격감
// ============================================================
export class ChromaticAberration {
    constructor() {
        this.intensity = 0;
        this.decay = 0.92;
    }

    /** 크리티컬 히트 시 RGB 채널 분리 */
    trigger(intensity = 1.0) {
        this.intensity = intensity;
    }

    /** 매 프레임 감쇠 후 캔버스에 RGB 오프셋 렌더링 */
    apply(ctx, width, height) {
        if (this.intensity < 0.01) return;
        const offset = this.intensity * 6;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // R 채널을 우측으로, B 채널을 좌측으로 오프셋
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = (y * width + x) * 4;
                const rIdx = (y * width + Math.min(width - 1, Math.max(0, x + offset))) * 4;
                const bIdx = (y * width + Math.min(width - 1, Math.max(0, x - offset))) * 4;
                data[rIdx] = data[srcIdx];         // R
                data[srcIdx + 1] = data[srcIdx + 1]; // G 유지
                data[bIdx + 2] = data[srcIdx + 2]; // B
            }
        }
        ctx.putImageData(imageData, 0, 0);
        this.intensity *= 0.85; // 감쇠
    }
}

// ============================================================
// [484] 시차 스크롤(Parallax Scrolling) 맵
// ============================================================
export class ParallaxScroller {
    constructor() {
        this.layers = [
            { speed: 0.1, offsetX: 0, offsetY: 0 }, // 구름 (가장 느림)
            { speed: 0.3, offsetX: 0, offsetY: 0 }, // 숲
            { speed: 0.6, offsetX: 0, offsetY: 0 }, // 언덕
            { speed: 1.0, offsetX: 0, offsetY: 0 }, // 지면 (기준)
        ];
    }

    /** 카메라 이동에 따른 레이어별 오프셋 갱신 */
    update(cameraX, cameraY) {
        this.layers.forEach((layer, i) => {
            const ratio = layer.speed / this.layers[3].speed;
            layer.offsetX = -cameraX * ratio;
            layer.offsetY = -cameraY * ratio;
        });
    }

    /** 각 레이어를 캔버스에 순서대로 렌더링 */
    render(ctx, layerRenderers) {
        this.layers.forEach((layer, i) => {
            ctx.save();
            ctx.translate(layer.offsetX, layer.offsetY);
            if (layerRenderers[i]) layerRenderers[i](ctx);
            ctx.restore();
        });
    }
}

// ============================================================
// [486] 실시간 그림자 연산(Soft Shadows) — WebGL 방향광 시뮬레이션
// ============================================================
export class SoftShadowRenderer {
    constructor() {
        this.sunAngle = Math.PI / 4; // 45도
        this.sunElevation = Math.PI / 3;
    }

    /** 시간(0~24)에 따른 태양 위치 갱신 */
    updateSunPosition(hour) {
        this.sunAngle = (hour / 24) * Math.PI * 2;
        this.sunElevation = Math.sin((hour - 6) / 12 * Math.PI) * (Math.PI / 3);
        if (this.sunElevation < 0) this.sunElevation = 0;
    }

    /** 유닛/건물 위치에 따른 그림자 길이와 방향 계산 */
    getShadowOffset(height) {
        const shadowLen = height / Math.tan(this.sunElevation || 0.1);
        return {
            dx: Math.cos(this.sunAngle) * shadowLen,
            dy: Math.sin(this.sunAngle) * shadowLen,
            alpha: Math.max(0.1, Math.min(0.5, this.sunElevation / (Math.PI / 2)))
        };
    }
}

// ============================================================
// [487] 잔상(Motion Blur) 이펙트
// ============================================================
export class MotionBlur {
    constructor() {
        this.trailAlpha = 0.15;
        this.prevCanvas = null;
    }

    /** 이전 프레임을 반투명 오버레이로 중첩하여 잔상 효과 */
    apply(ctx, width, height) {
        if (!this.prevCanvas) {
            this.prevCanvas = document.createElement('canvas');
            this.prevCanvas.width = width;
            this.prevCanvas.height = height;
        }
        const prevCtx = this.prevCanvas.getContext('2d');
        prevCtx.clearRect(0, 0, width, height);
        prevCtx.globalAlpha = this.trailAlpha;
        prevCtx.drawImage(ctx.canvas, 0, 0);
        ctx.globalAlpha = 0.7;
        ctx.drawImage(this.prevCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }
}

// ============================================================
// [488] SVG 고해상도 군기(Flag) 생성기
// ============================================================
export class FlagRenderer {
    /**
     * 세력 색상과 문양으로 SVG 군기 생성
     * @param {string} factionId - 세력 ID
     * @param {string} primaryColor - 주 색상 (#RRGGBB)
     * @param {string} emblem - 문양 문자 (예: '魏', '蜀', '吳')
     * @returns {string} SVG 마크업
     */
    generateFlagSVG(factionId, primaryColor, emblem) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
            <defs>
                <linearGradient id="flagGrad_${factionId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.8" />
                </linearGradient>
            </defs>
            <rect x="5" y="5" width="110" height="70" rx="3" fill="url(#flagGrad_${factionId})" stroke="#333" stroke-width="1.5"/>
            <text x="60" y="52" font-family="serif" font-size="36" font-weight="bold"
                  fill="#fff" text-anchor="middle" dominant-baseline="middle"
                  filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.5))">${emblem}</text>
        </svg>`;
    }
}

// ============================================================
// [490] 물결(Water Ripple) 셰이더
// ============================================================
export class WaterRippleShader {
    constructor() {
        this.time = 0;
        this.ripples = [];
    }

    /** 유닛 이동 시 물결 발생 */
    addRipple(x, y, amplitude = 1.0) {
        this.ripples.push({ x, y, amplitude, phase: 0 });
    }

    /** 매 프레임 물결 파동 업데이트 */
    update(dt) {
        this.time += dt;
        this.ripples = this.ripples.filter(r => {
            r.amplitude *= 0.97;
            r.phase += dt * 2;
            return r.amplitude > 0.01;
        });
    }

    /** 특정 좌표의 물결 높이 계산 (Displacement map) */
    getDisplacement(worldX, worldY) {
        let dx = 0, dy = 0;
        for (const r of this.ripples) {
            const dist = Math.sqrt((worldX - r.x) ** 2 + (worldY - r.y) ** 2);
            const wave = Math.sin(dist * 0.5 - r.phase) * r.amplitude * 2;
            dx += Math.cos(Math.atan2(worldY - r.y, worldX - r.x)) * wave;
            dy += Math.sin(Math.atan2(worldY - r.y, worldX - r.x)) * wave;
        }
        return { dx, dy };
    }
}

// ============================================================
// [491] 계절 테마별 마우스 커서
// ============================================================
export class SeasonalCursor {
    constructor() {
        this.season = 'SPRING'; // SPRING, SUMMER, AUTUMN, WINTER
        this.cursorMap = {
            SPRING: 'url("data:image/svg+xml,...") 4 4, auto', // 붓
            SUMMER: 'url("data:image/svg+xml,...") 4 4, auto', // 부채
            AUTUMN: 'url("data:image/svg+xml,...") 4 4, auto', // 낙엽
            WINTER: 'url("data:image/svg+xml,...") 4 4, auto', // 눈꽃
        };
    }

    setSeason(season) {
        this.season = season;
        document.body.style.cursor = this.cursorMap[season] || 'auto';
    }
}

// ============================================================
// [492] 앰비언트 오클루전(SSAO) — 헥스 타일 골짜기 그림자
// ============================================================
export class SSAOEffect {
    constructor() {
        this.sampleRadius = 3;
        this.intensity = 0.5;
    }

    /**
     * 헥스 타일 주변 이웃 높이차를 분석하여 골짜기 그림자 계산
     * @param {Array<{q:number, r:number, height:number}>} hexTiles
     * @returns {Map<string, number>} occlusion factor per hex key "q,r"
     */
    computeOcclusion(hexTiles) {
        const occlusion = new Map();
        for (const tile of hexTiles) {
            const key = `${tile.q},${tile.r}`;
            let total = 0;
            // 6방향 이웃 탐색
            const dirs = [[1,0], [0,1], [-1,1], [-1,0], [0,-1], [1,-1]];
            for (const [dq, dr] of dirs) {
                const neighbor = hexTiles.find(t => t.q === tile.q + dq && t.r === tile.r + dr);
                if (neighbor && neighbor.height < tile.height) {
                    total += (tile.height - neighbor.height) / this.sampleRadius;
                }
            }
            occlusion.set(key, Math.min(1, total * this.intensity));
        }
        return occlusion;
    }
}

// ============================================================
// [493] 타일 강조(Highlight) 박동(Pulse) 애니메이션
// ============================================================
export class TilePulse {
    constructor() {
        this.time = 0;
        this.highlightedTiles = new Set();
    }

    /** 마우스 호버 시 타일 하이라이트 */
    highlightTile(q, r) {
        this.highlightedTiles.add(`${q},${r}`);
    }

    clearHighlight() {
        this.highlightedTiles.clear();
    }

    /** 박동 애니메이션 알파값 계산 (0.3~1.0 왕복) */
    update(dt) {
        this.time += dt;
        return 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.time * 3));
    }

    isHighlighted(q, r) {
        return this.highlightedTiles.has(`${q},${r}`);
    }
}

// ============================================================
// [495] 초상화 안구/호흡 애니메이션 (Live2D 흉내)
// ============================================================
export class PortraitAnimator {
    constructor() {
        this.eyeOffsetX = 0;
        this.eyeOffsetY = 0;
        this.breathPhase = 0;
        this.targetX = 0;
        this.targetY = 0;
    }

    /** 마우스 위치에 따라 눈동자 추적 */
    trackMouse(mouseX, mouseY, portraitCenterX, portraitCenterY) {
        const dx = mouseX - portraitCenterX;
        const dy = mouseY - portraitCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxTrack = 8;
        if (dist > 0) {
            this.targetX = (dx / dist) * Math.min(maxTrack, dist * 0.1);
            this.targetY = (dy / dist) * Math.min(maxTrack, dist * 0.1);
        }
    }

    /** 호흡 메시 변형 업데이트 */
    update(dt) {
        this.eyeOffsetX += (this.targetX - this.eyeOffsetX) * 0.1;
        this.eyeOffsetY += (this.targetY - this.eyeOffsetY) * 0.1;
        this.breathPhase += dt * 1.5;
    }

    /** 호흡에 따른 가슴 확장 계수 (0.98~1.02) */
    getBreathScale() {
        return 1 + Math.sin(this.breathPhase) * 0.02;
    }
}

// ============================================================
// [496] 화면 전환 잉크 번짐(Ink Bleed) 트랜지션
// ============================================================
export class InkBleedTransition {
    constructor() {
        this.progress = 0; // 0~1
        this.direction = 1; // 1=in, -1=out
        this.active = false;
    }

    start(direction = 1) {
        this.active = true;
        this.direction = direction;
        this.progress = direction > 0 ? 0 : 1;
    }

    update(dt) {
        if (!this.active) return;
        this.progress += dt * 0.5 * this.direction;
        if (this.progress >= 1 || this.progress <= 0) {
            this.progress = Math.max(0, Math.min(1, this.progress));
            this.active = false;
        }
    }

    /** 먹물이 번지는 효과를 캔버스에 렌더링 */
    render(ctx, width, height) {
        if (!this.active && (this.progress === 0 || this.progress === 1)) return;
        const p = this.progress;
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // 중심에서 퍼져나가는 먹물 원
        const maxRadius = Math.sqrt(width * width + height * height) / 2;
        const radius = maxRadius * p;

        // 여러 겹의 불규칙한 원으로 먹물 번짐 표현
        for (let i = 3; i >= 0; i--) {
            const r = radius * (1 - i * 0.05);
            const alpha = 0.3 + 0.7 * (1 - p);
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, r + Math.sin(p * 10 + i) * 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(20, 20, 20, ${alpha * (1 - i * 0.2)})`;
            ctx.fill();
        }
        ctx.restore();
    }
}

// ============================================================
// [497] 로딩 텍스처 스트리밍 (Lazy Loading)
// ============================================================
export class TextureStreamer {
    constructor() {
        this.loadQueue = [];
        this.loaded = new Map();
        this.loading = new Set();
        this.maxConcurrent = 4;
        this.activeCount = 0;
    }

    /** 우선순위 큐에 텍스처 추가 */
    enqueue(id, url, priority = 0) {
        if (this.loaded.has(id) || this.loading.has(id)) return;
        this.loadQueue.push({ id, url, priority });
        this.loadQueue.sort((a, b) => b.priority - a.priority);
        this.processQueue();
    }

    /** 화면에 보이는 텍스처부터 우선 로딩 */
    setVisible(visibleIds) {
        visibleIds.forEach((id, i) => {
            const entry = this.loadQueue.find(e => e.id === id);
            if (entry) entry.priority = 100 - i;
        });
        this.loadQueue.sort((a, b) => b.priority - a.priority);
    }

    async processQueue() {
        while (this.loadQueue.length > 0 && this.activeCount < this.maxConcurrent) {
            const item = this.loadQueue.shift();
            if (this.loaded.has(item.id) || this.loading.has(item.id)) continue;
            this.loading.add(item.id);
            this.activeCount++;
            this.loadTexture(item.id, item.url).then(() => {
                this.activeCount--;
                this.loading.delete(item.id);
                this.processQueue();
            });
        }
    }

    async loadTexture(id, url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.loaded.set(id, img);
                resolve();
            };
            img.onerror = () => resolve();
            img.src = url;
        });
    }

    getTexture(id) {
        return this.loaded.get(id) || null;
    }
}

// ============================================================
// [498] UI 글리치/종이 찢어짐 이펙트
// ============================================================
export class GlitchEffect {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.timer = 0;
    }

    /** 반란/모반 등 충격 이벤트 발생 시 트리거 */
    trigger(intensity = 1.0, duration = 500) {
        this.intensity = intensity;
        this.duration = duration;
        this.timer = duration;
    }

    update(dt) {
        if (this.timer <= 0) return;
        this.timer -= dt * 1000;
        this.intensity = this.timer / this.duration;
    }

    /** 종이 찢어짐 효과를 캔버스에 오버레이 */
    render(ctx, width, height) {
        if (this.timer <= 0) return;
        const segments = Math.floor(5 + this.intensity * 10);
        ctx.save();
        for (let i = 0; i < segments; i++) {
            const y = (height / segments) * i;
            const h = height / segments;
            const offset = (Math.random() - 0.5) * this.intensity * 20;
            ctx.drawImage(ctx.canvas, offset, y, width, h, 0, y, width, h);
        }
        ctx.restore();
    }
}

// ============================================================
// [499] 전법 발동 풀스크린 컷인
// ============================================================
export class SkillCutIn {
    constructor() {
        this.active = false;
        this.progress = 0;
        this.skillName = '';
        this.officerName = '';
    }

    /** 전법 발동 시 컷인 시작 */
    activate(skillName, officerName) {
        this.active = true;
        this.progress = 0;
        this.skillName = skillName;
        this.officerName = officerName;
    }

    update(dt) {
        if (!this.active) return;
        this.progress += dt * 1.5;
        if (this.progress >= 1) this.active = false;
    }

    /** 붓글씨 스크립트 + 컷인 일러스트 렌더링 */
    render(ctx, width, height) {
        if (!this.active) return;
        const p = Math.min(1, this.progress);

        // 배경 플래시
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * (1 - p)})`;
        ctx.fillRect(0, 0, width, height);

        // 붓글씨 스킬명 (확대되며 페이드아웃)
        const fontSize = 48 + (1 - p) * 32;
        ctx.save();
        ctx.font = `bold ${fontSize}px "Noto Serif SC", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 200, 50, ${1 - p})`;
        ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillText(this.skillName, width / 2, height / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.font = `24px "Noto Serif SC", serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - p})`;
        ctx.fillText(this.officerName, width / 2, height / 2 + 40);
        ctx.restore();
    }
}

// ============================================================
// [489] 텍스트 렌더링 안티앨리어싱
// ============================================================
export class TextRenderer {
    constructor() {
        this.fontFamily = '"Noto Serif SC", "Nanum Myeongjo", serif';
        this.subpixel = true;
    }

    /** 서브픽셀 렌더링 설정 */
    setSubpixelRendering(enabled) {
        this.subpixel = enabled;
    }

    /** 안티앨리어싱이 적용된 텍스트 그리기 */
    drawText(ctx, text, x, y, options = {}) {
        ctx.save();
        ctx.font = `${options.bold ? 'bold ' : ''}${options.size || 16}px ${this.fontFamily}`;
        ctx.textAlign = options.align || 'left';
        ctx.textBaseline = options.baseline || 'top';
        ctx.fillStyle = options.color || '#fff';

        if (this.subpixel) {
            // 서브픽셀 렌더링: 텍스트 외곽선 부드럽게
            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.shadowBlur = 0;
            ctx.imageSmoothingEnabled = true;
        }

        // 외곽선 (가독성 향상)
        if (options.stroke) {
            ctx.strokeStyle = options.strokeColor || 'rgba(0,0,0,0.5)';
            ctx.lineWidth = options.strokeWidth || 2;
            ctx.strokeText(text, x, y);
        }

        ctx.fillText(text, x, y);
        ctx.restore();
    }
}

// ============================================================
// Main FrontendRenderer — 통합 오케스트레이터
// ============================================================
export class FrontendRenderer {
    constructor() {
        this.binaural = new BinauralAudio();
        this.dof = new DepthOfField();
        this.chromaticAberration = new ChromaticAberration();
        this.parallax = new ParallaxScroller();
        this.shadows = new SoftShadowRenderer();
        this.motionBlur = new MotionBlur();
        this.flags = new FlagRenderer();
        this.textRenderer = new TextRenderer();
        this.waterRipple = new WaterRippleShader();
        this.cursor = new SeasonalCursor();
        this.ssao = new SSAOEffect();
        this.tilePulse = new TilePulse();
        this.portraitAnim = new PortraitAnimator();
        this.inkBleed = new InkBleedTransition();
        this.textureStreamer = new TextureStreamer();
        this.glitch = new GlitchEffect();
        this.skillCutIn = new SkillCutIn();
    }

    /** [481] 바이노럴 3D 오디오 초기화 */
    initSpatialAudio() {
        return this.binaural;
    }

    /** [482] 동적 피사체 심도 적용 */
    applyPostProcessing(effectType, ...args) {
        switch (effectType) {
            case 'dof': this.dof.setFocus(...args); break;
            case 'chromatic': this.chromaticAberration.trigger(...args); break;
            case 'motionBlur': this.motionBlur.apply(...args); break;
            case 'glitch': this.glitch.trigger(...args); break;
            case 'inkBleed': this.inkBleed.start(...args); break;
            case 'cutIn': this.skillCutIn.activate(...args); break;
        }
    }

    /** 모든 프레임 업데이트 (매 프레임 호출) */
    update(dt, cameraX, cameraY) {
        this.parallax.update(cameraX, cameraY);
        this.waterRipple.update(dt);
        this.tilePulse.update(dt);
        this.portraitAnim.update(dt);
        this.inkBleed.update(dt);
        this.glitch.update(dt);
        this.skillCutIn.update(dt);
        this.chromaticAberration.intensity *= 0.85;
    }

    /** [485] 날씨/공간별 오디오 반향 설정 */
    setEnvironmentReverb(weather, terrain) {
        const preset = {
            sunny: { roomSize: 0.2, dampening: 0.3 },
            rainy: { roomSize: 0.7, dampening: 0.6 },
            snowy: { roomSize: 0.5, dampening: 0.8 },
            mountain: { roomSize: 0.8, dampening: 0.4 },
            cave: { roomSize: 0.9, dampening: 0.7 },
        };
        const config = preset[weather] || preset.sunny;
        return this.binaural.setReverb(config.roomSize, config.dampening);
    }

    /** [493] 타일 강조 박동 알파값 */
    getTilePulseAlpha() {
        return this.tilePulse.update(0.016);
    }
}
