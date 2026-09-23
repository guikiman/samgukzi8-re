/**
 * [Phase 3] 중국 전도 월드 렌더러 — ChinaMapRenderer
 *
 * 헥사곤 그리드 대신, 중국 본토 전도 위에 도시를 실제 지리 좌표에
 * 자유 배치하고 클릭으로 선택하는 삼국지8 본가 스타일 전략 맵.
 * 도시: 성 아이콘 + 소속기 색 + 병력 배지. 강/해안은 장식 윤곽으로 연출.
 */
// ============================================================
// 기하 헬퍼
// ============================================================
/**
 * 점이 다각형 내부에 있는지 검사 (짝수 교차법).
 * 영토 보로노이 셀을 대륙 윤곽으로 제한하는 데 사용.
 */
export function pointInPolygon(px, py, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        const intersects = ((yi > py) !== (yj > py))
            && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersects)
            inside = !inside;
    }
    return inside;
}
// ============================================================
// 지형 장식 (강 흐름 — 정규화 좌표 폴리라인)
// ============================================================
const RIVERS = [
    // 황하 (상류 → 하류, 几字 형태 단순화)
    [
        { x: 0.30, y: 0.30 }, { x: 0.33, y: 0.24 }, { x: 0.38, y: 0.20 },
        { x: 0.43, y: 0.22 }, { x: 0.45, y: 0.28 }, { x: 0.50, y: 0.30 },
        { x: 0.55, y: 0.28 }, { x: 0.60, y: 0.26 }, { x: 0.68, y: 0.22 },
        { x: 0.76, y: 0.20 }, { x: 0.85, y: 0.24 },
    ],
    // 장강 (상류 → 하류)
    [
        { x: 0.26, y: 0.52 }, { x: 0.32, y: 0.54 }, { x: 0.40, y: 0.52 },
        { x: 0.48, y: 0.55 }, { x: 0.55, y: 0.58 }, { x: 0.62, y: 0.60 },
        { x: 0.70, y: 0.62 }, { x: 0.78, y: 0.66 }, { x: 0.88, y: 0.70 },
    ],
    // 회수
    [
        { x: 0.55, y: 0.44 }, { x: 0.62, y: 0.48 }, { x: 0.70, y: 0.50 },
    ],
];
/** 대륙 윤곽 (간략화된 중국 본토 폴리곤, 정규화 좌표) */
const CONTINENT_OUTLINE = [
    { x: 0.16, y: 0.20 }, { x: 0.30, y: 0.12 }, { x: 0.50, y: 0.08 },
    { x: 0.70, y: 0.06 }, { x: 0.88, y: 0.12 }, { x: 0.94, y: 0.24 },
    { x: 0.90, y: 0.36 }, { x: 0.94, y: 0.48 }, { x: 0.90, y: 0.62 },
    { x: 0.82, y: 0.72 }, { x: 0.70, y: 0.80 }, { x: 0.58, y: 0.84 },
    { x: 0.48, y: 0.88 }, { x: 0.38, y: 0.86 }, { x: 0.28, y: 0.80 },
    { x: 0.20, y: 0.70 }, { x: 0.14, y: 0.58 }, { x: 0.10, y: 0.44 },
    { x: 0.12, y: 0.32 },
];
// ============================================================
// ChinaMapRenderer
// ============================================================
export class ChinaMapRenderer {
    constructor(canvas) {
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1.0;
        this.hoveredCityId = null;
        this.cities = [];
        /** [321-340] 지도 날씨 오버레이 표시 여부 (기본 on) */
        this.showWeatherOverlay = true;
        /** [1057][321-340] 계절 톤 — 봄/여름/가을/겨울에 따라 대륙 색조 보정 (null=보정 없음) */
        this.seasonTint = null;
        /** 영토 셀 (보로노이 근사 그리드) 캐시 */
        this.territoryCells = [];
        this.territoryCols = 0;
        this.territoryRows = 0;
        this.territoryDirty = true;
        /** 세력 라벨 (영토 무게중심 + 크기) — rebuildTerritory에서 산출 */
        this.factionLabels = [];
        /** 오프스크린 영토/경계 레이어 (확대 보간용) */
        this.territoryLayer = null;
        this.borderLayer = null;
        this.territoryLayerDirty = true;
        this.borderLayerDirty = true;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    setView(view) {
        if (view.offsetX !== undefined)
            this.offsetX = view.offsetX;
        if (view.offsetY !== undefined)
            this.offsetY = view.offsetY;
        if (view.zoom !== undefined)
            this.zoom = view.zoom;
    }
    setCities(cities) {
        this.cities = cities;
        this.territoryDirty = true;
    }
    /**
     * 영토 격자 재계산 — 도시 위치 기반 보로노이 근사.
     * 대륙 윤곽 내부의 셀만 가장 가까운 도시의 소속 색으로 채운다.
     */
    rebuildTerritory() {
        const cols = Math.ceil(1.0 / ChinaMapRenderer.CELL_SIZE);
        const rows = Math.ceil(1.0 / ChinaMapRenderer.CELL_SIZE);
        this.territoryCols = cols;
        this.territoryRows = rows;
        // 소속 있는 도시만 영토 계산에 사용
        const owned = this.cities.filter(c => c.ownerColor);
        const cells = new Array(cols * rows);
        for (let gy = 0; gy < rows; gy++) {
            for (let gx = 0; gx < cols; gx++) {
                const nx = (gx + 0.5) * ChinaMapRenderer.CELL_SIZE;
                const ny = (gy + 0.5) * ChinaMapRenderer.CELL_SIZE;
                // 대륙 내부인지 검사 (짝수 교차법, 정규화 좌표)
                if (!pointInPolygon(nx, ny, CONTINENT_OUTLINE)) {
                    cells[gy * cols + gx] = { ownerColor: null, isPlayer: false };
                    continue;
                }
                // 가장 가까운 소속 도시 탐색 (제곱거리 비교)
                let bestDist = Infinity;
                let bestCity = null;
                for (const city of owned) {
                    const dx = city.x - nx;
                    const dy = city.y - ny;
                    const d = dx * dx + dy * dy;
                    if (d < bestDist) {
                        bestDist = d;
                        bestCity = city;
                    }
                }
                cells[gy * cols + gx] = bestCity
                    ? { ownerColor: bestCity.ownerColor, isPlayer: bestCity.isPlayer }
                    : { ownerColor: null, isPlayer: false };
            }
        }
        this.territoryCells = cells;
        // ---- 세력 라벨 산출: 세력별 셀 무게중심 + 크기 ----
        const acc = new Map();
        for (let gy = 0; gy < rows; gy++) {
            for (let gx = 0; gx < cols; gx++) {
                const cell = cells[gy * cols + gx];
                if (!cell || !cell.ownerColor)
                    continue;
                // 해당 색의 도시에서 세력명/플레이어 여부 조회
                const city = owned.find(c => c.ownerColor === cell.ownerColor);
                if (!city)
                    continue;
                const key = cell.ownerColor + '|' + (city.factionName ?? '');
                let a = acc.get(key);
                if (!a) {
                    a = { name: city.factionName ?? '', color: cell.ownerColor, sumX: 0, sumY: 0, n: 0, isPlayer: city.isPlayer };
                    acc.set(key, a);
                }
                a.sumX += (gx + 0.5) * ChinaMapRenderer.CELL_SIZE;
                a.sumY += (gy + 0.5) * ChinaMapRenderer.CELL_SIZE;
                a.n++;
            }
        }
        this.factionLabels = Array.from(acc.values())
            .filter(a => a.n >= 8) // 너무 작은 영토는 라벨 생략
            .map(a => ({ name: a.name, color: a.color, cx: a.sumX / a.n, cy: a.sumY / a.n, cells: a.n, isPlayer: a.isPlayer }));
        this.territoryDirty = false;
        this.territoryLayerDirty = true;
        this.borderLayerDirty = true;
    }
    setHoveredCity(id) {
        this.hoveredCityId = id;
    }
    /** 맵 패딩을 포함한 정규화 → 픽셀 변환 */
    normToPixel(x, y, width, height) {
        // 세로 우선 스케일: 전체 대륙이 항상 보이도록 contain 방식
        const baseScale = Math.min(width / 1.0, height / 0.92) * 0.96;
        const s = baseScale * this.zoom;
        return {
            px: width / 2 + this.offsetX + (x - 0.5) * s,
            py: height / 2 + this.offsetY + (y - 0.46) * s,
        };
    }
    /** 화면 픽셀 → 정규화 좌표 (역변환) */
    screenToNorm(px, py) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const baseScale = Math.min(width / 1.0, height / 0.92) * 0.96;
        const s = baseScale * this.zoom;
        const nx = (px - width / 2 - this.offsetX) / s + 0.5;
        const ny = (py - height / 2 - this.offsetY) / s + 0.46;
        return { x: nx, y: ny };
    }
    /**
     * 픽셀 좌표 아래의 도시를 찾는다 (없으면 null)
     */
    cityAt(px, py) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const radius = 14 * this.zoom;
        let best = null;
        let bestDist = Infinity;
        for (const city of this.cities) {
            const { px: cx, py: cy } = this.normToPixel(city.x, city.y, width, height);
            const d = Math.hypot(px - cx, py - cy);
            if (d < radius + 6 && d < bestDist) {
                best = city;
                bestDist = d;
            }
        }
        return best;
    }
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        ctx.clearRect(0, 0, width, height);
        // 배경 (심해 톤)
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, '#12142a');
        bg.addColorStop(1, '#0a0b18');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        // ---- 대륙 윤곽 ----
        const outline = CONTINENT_OUTLINE.map(p => {
            const { px, py } = this.normToPixel(p.x, p.y, width, height);
            return [px, py];
        });
        ctx.beginPath();
        ctx.moveTo(outline[0][0], outline[0][1]);
        for (let i = 1; i < outline.length; i++)
            ctx.lineTo(outline[i][0], outline[i][1]);
        ctx.closePath();
        // 육지 그라데이션 (+계절 톤 보정 [1057][321-340])
        const landGrad = ctx.createLinearGradient(0, 0, width, height);
        landGrad.addColorStop(0, '#3a4430');
        landGrad.addColorStop(0.5, '#46523a');
        landGrad.addColorStop(1, '#37402e');
        ctx.fillStyle = this.applySeasonTint(landGrad);
        ctx.fill();
        // 해안선
        ctx.strokeStyle = 'rgba(220, 210, 170, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // ---- 세력 영토 (보로노이 색 채우기) [9] ----
        this.drawTerritory(ctx, width, height);
        // ---- [321-340] 지도 날씨 오버레이 — 도시 위 날씨 아이콘 + 악천후 수확 경고 ----
        this.drawWeatherOverlay(ctx, width, height);
        // ---- 산맥 장식 (서부) ----
        ctx.strokeStyle = 'rgba(150, 140, 110, 0.5)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) {
            const bx = 0.16 + i * 0.035;
            const { px, py } = this.normToPixel(bx, 0.34 + (i % 2) * 0.05, width, height);
            const size = 8 * this.zoom;
            ctx.beginPath();
            ctx.moveTo(px - size, py + size * 0.6);
            ctx.lineTo(px, py - size * 0.7);
            ctx.lineTo(px + size, py + size * 0.6);
            ctx.stroke();
        }
        // ---- 강 ----
        for (const river of RIVERS) {
            ctx.beginPath();
            river.forEach((p, i) => {
                const { px, py } = this.normToPixel(p.x, p.y, width, height);
                if (i === 0)
                    ctx.moveTo(px, py);
                else {
                    // 부드러운 곡선
                    const prev = river[i - 1];
                    const pp = this.normToPixel(prev.x, prev.y, width, height);
                    const cpx = (pp.px + px) / 2;
                    const cpy = (pp.py + py) / 2;
                    ctx.quadraticCurveTo(pp.px, pp.py, cpx, cpy);
                }
            });
            const last = river[river.length - 1];
            const lp = this.normToPixel(last.x, last.y, width, height);
            ctx.lineTo(lp.px, lp.py);
            ctx.strokeStyle = 'rgba(90, 140, 190, 0.75)';
            ctx.lineWidth = Math.max(2, 4 * this.zoom);
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        // ---- 세력 경계선 (영토 셀 경계 중 이웃 색이 다른 곳) ----
        this.drawTerritoryBorders(ctx, width, height);
        // ---- 세력명 라벨 (영토 위 반투명 대형 글씨) [9] ----
        this.drawFactionLabels(ctx, width, height);
        // ---- 도시 ----
        for (const city of this.cities) {
            this.drawCity(ctx, city, width, height);
        }
        // ---- 나침반/장식 ----
        ctx.fillStyle = 'rgba(220, 210, 170, 0.45)';
        ctx.font = `${Math.max(10, 13 * this.zoom)}px "Malgun Gothic", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('中國全圖', 14, height - 14);
    }
    /**
     * 영토 레이어 — 저해상도 오프스크린 캔버스에 셀 색을 칠한 뒤
     * 메인 캔버스로 확대 블릿(imageSmoothing 보간). 셀 계단이
     * 자연스럽게 그라데이션처럼 블렌딩되어 부드러운 경계가 된다.
     */
    drawTerritory(ctx, width, height) {
        if (this.territoryDirty)
            this.rebuildTerritory();
        const cellPx = ChinaMapRenderer.CELL_SIZE * this.baseScale();
        if (cellPx < 4)
            return; // 너무 작으면 생략 (성능 보호)
        const off = this.getTerritoryLayer(width, height);
        if (!off)
            return;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = 1.0;
        // 영역 전체를 확대 그리기 — 저해상도 픽셀이 부드럽게 보간됨
        ctx.drawImage(off.canvas, 0, 0, off.width, off.height, 0, 0, width, height);
        ctx.restore();
    }
    /**
     * 영토 오프스크린 레이어 생성/갱신.
     * 해상도: 대략 셀당 3~4픽셀 (확대 시 보간으로 부드러워짐).
     * 색은 최종 알파(플레이어 0.34 / 일반 0.22)를 미리 곱해 담는다.
     */
    getTerritoryLayer(width, height) {
        const scale = 0.25; // 메인 해상도의 25%
        const lw = Math.max(1, Math.floor(width * scale));
        const lh = Math.max(1, Math.floor(height * scale));
        let off = this.territoryLayer;
        if (!off || off.width !== lw || off.height !== lh) {
            const canvas = document.createElement('canvas');
            canvas.width = lw;
            canvas.height = lh;
            off = { canvas, ctx: canvas.getContext('2d'), width: lw, height: lh };
            this.territoryLayer = off;
            this.territoryLayerDirty = true;
        }
        if (!this.territoryDirty && !this.territoryLayerDirty)
            return off;
        this.rebuildTerritory();
        const octx = off.ctx;
        octx.clearRect(0, 0, lw, lh);
        const cols = this.territoryCols;
        const rows = this.territoryRows;
        // 셀 하나가 오프스크린에서 차지하는 픽셀 크기
        const cellW = lw / cols;
        const cellH = lh / rows;
        for (let gy = 0; gy < rows; gy++) {
            for (let gx = 0; gx < cols; gx++) {
                const cell = this.territoryCells[gy * cols + gx];
                if (!cell || !cell.ownerColor)
                    continue;
                octx.globalAlpha = cell.isPlayer ? 0.34 : 0.22;
                octx.fillStyle = cell.ownerColor;
                octx.fillRect(gx * cellW, gy * cellH, cellW + 0.6, cellH + 0.6);
            }
        }
        octx.globalAlpha = 1.0;
        this.territoryLayerDirty = false;
        return off;
    }
    /**
     * 세력 경계선 — 셀 가장자리 선 대신, 저해상도 경계 마스크를
     * 확대 보간해 부드러운 음영 밴드로 표현.
     * 경계 마스크: 이웃 셀과 소속이 다른 셀에 밝은 픽셀을 찍고,
     * 확대 시 곡선처럼 흐르는 어두운 띠가 된다.
     */
    drawTerritoryBorders(ctx, width, height) {
        if (this.territoryDirty)
            this.rebuildTerritory();
        const cellPx = ChinaMapRenderer.CELL_SIZE * this.baseScale();
        if (cellPx < 4)
            return;
        const off = this.territoryLayer;
        if (!off)
            return;
        const scale = 0.25;
        const lw = off.width;
        const lh = off.height;
        // 경계 마스크 레이어 (캐시)
        let border = this.borderLayer;
        if (!border || border.width !== lw || border.height !== lh) {
            const canvas = document.createElement('canvas');
            canvas.width = lw;
            canvas.height = lh;
            border = { canvas, ctx: canvas.getContext('2d'), width: lw, height: lh };
            this.borderLayer = border;
            this.borderLayerDirty = true;
        }
        if (!this.territoryDirty && !this.borderLayerDirty) {
            // 재사용
        }
        else {
            const bctx = border.ctx;
            bctx.clearRect(0, 0, lw, lh);
            const cols = this.territoryCols;
            const rows = this.territoryRows;
            const cellW = lw / cols;
            const cellH = lh / rows;
            const keyOf = (cell) => cell?.ownerColor ?? '';
            bctx.fillStyle = 'rgba(20, 16, 8, 0.5)';
            const lineW = Math.max(1, cellW * 0.45);
            for (let gy = 0; gy < rows; gy++) {
                for (let gx = 0; gx < cols; gx++) {
                    const cell = this.territoryCells[gy * cols + gx];
                    if (!cell || !cell.ownerColor)
                        continue;
                    const x = gx * cellW;
                    const y = gy * cellH;
                    const right = this.territoryCells[gy * cols + gx + 1];
                    const down = this.territoryCells[(gy + 1) * cols + gx];
                    if (gx + 1 < cols && keyOf(right) !== keyOf(cell)) {
                        bctx.fillRect(x + cellW - lineW / 2, y - cellH * 0.5, lineW, cellH * 2);
                    }
                    if (gy + 1 < rows && keyOf(down) !== keyOf(cell)) {
                        bctx.fillRect(x - cellW * 0.5, y + cellH - lineW / 2, cellW * 2, lineW);
                    }
                }
            }
            this.borderLayerDirty = false;
        }
        // 경계 마스크를 확대 블릿 — 저해상도 픽셀이 보간되며 부드러운 곡선 밴드가 됨
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(border.canvas, 0, 0, lw, lh, 0, 0, width, height);
        ctx.restore();
    }
    /**
     * 세력명 라벨 — 영토 무게중심에 반투명 대형 글씨로 표기.
     * 글자 크기는 영토 셀 수(면적)에 비례. 도시 뒤, 지형 앞에 얹힌다.
     */
    drawFactionLabels(ctx, width, height) {
        for (const label of this.factionLabels) {
            const { px, py } = this.normToPixel(label.cx, label.cy, width, height);
            if (px < -80 || px > width + 80 || py < -60 || py > height + 60)
                continue;
            // 영토 면적 기반 글자 크기 (최소 18px, 최대 64px)
            const fontSize = Math.max(18, Math.min(64, Math.sqrt(label.cells) * 7 * this.zoom));
            if (!label.name)
                continue;
            ctx.save();
            ctx.font = `bold ${fontSize}px "Malgun Gothic", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 자체 세력색보다 밝은 톤으로, 반투명하게
            const alpha = label.isPlayer ? 0.5 : 0.38;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.lightenColor(label.color, 0.55);
            // 외곽 음영 (가독성)
            ctx.globalAlpha = Math.min(0.6, alpha + 0.15);
            ctx.strokeStyle = 'rgba(10, 8, 4, 0.8)';
            ctx.lineWidth = Math.max(2, fontSize * 0.08);
            ctx.strokeText(label.name, px, py);
            ctx.globalAlpha = alpha;
            ctx.fillText(label.name, px, py);
            ctx.restore();
        }
    }
    /** HEX 색을 밝게 섞는 헬퍼 (t: 0~1, 1에 가까울수록 흰색) */
    lightenColor(hex, t) {
        const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (!m)
            return hex;
        const r = Math.round(parseInt(m[1], 16) + (255 - parseInt(m[1], 16)) * t);
        const g = Math.round(parseInt(m[2], 16) + (255 - parseInt(m[2], 16)) * t);
        const b = Math.round(parseInt(m[3], 16) + (255 - parseInt(m[3], 16)) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }
    /**
     * [321-340] 지도 날씨 오버레이 — 각 도시 위치에 날씨 아이콘을 그리고,
     * 수확 보정 0.8 미만 악천후 도시에는 경고 링을 표시한다.
     */
    drawWeatherOverlay(ctx, width, height) {
        if (!this.showWeatherOverlay)
            return;
        const icons = {
            SUNNY: '☀️', CLOUDY: '☁️', RAIN: '🌧️', STORM: '⛈️', SNOW: '❄️', FOG: '🌫️', HEATWAVE: '🔥',
        };
        const s = this.zoom;
        for (const city of this.cities) {
            if (!city.weather)
                continue;
            const { px, py } = this.normToPixel(city.x, city.y, width, height);
            const margin = 60 * s;
            if (px < -margin || px > width + margin || py < -margin || py > height + margin)
                continue;
            // 도시 아이콘 좌상단에 날씨 표시 — 성 아이콘과 겹침 방지
            const wx = px - 16 * s;
            const wy = py - 16 * s;
            ctx.font = `${Math.max(10, 12 * s)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icons[city.weather] ?? '🌤️', wx, wy);
            // 악천후 경고 링 (수확 페널티 도시)
            if (city.harvestModifier !== undefined && city.harvestModifier < 0.8) {
                ctx.strokeStyle = 'rgba(224, 122, 106, 0.85)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(px, py, 15 * s, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }
    /** 지도 날씨 오버레이 표시 토글 [321-340] (기본 on) */
    setShowWeatherOverlay(show) {
        this.showWeatherOverlay = show;
    }
    /**
     * [1057][321-340] 계절 톤 설정 — 대륙/바다 색조를 계절에 맞게 보정.
     * @param season 'spring'|'summer'|'autumn'|'winter' 또는 null(보정 해제)
     */
    setSeasonTint(season) {
        this.seasonTint = season;
    }
    /** 계절별 대륙 색 보정 — 태평성세/설한/황염의 계절감 표현 */
    applySeasonTint(grad) {
        if (!this.seasonTint)
            return grad;
        const tints = {
            spring: [[0, 'rgba(140, 200, 120, 0.18)'], [1, 'rgba(140, 200, 120, 0.10)']],
            summer: [[0, 'rgba(90, 180, 90, 0.22)'], [1, 'rgba(60, 150, 70, 0.12)']],
            autumn: [[0, 'rgba(220, 150, 60, 0.20)'], [1, 'rgba(180, 110, 40, 0.10)']],
            winter: [[0, 'rgba(200, 220, 245, 0.22)'], [1, 'rgba(150, 180, 220, 0.12)']],
        };
        for (const [stop, color] of tints[this.seasonTint]) {
            grad.addColorStop(stop, color);
        }
        return grad;
    }
    drawCity(ctx, city, width, height) {
        const { px, py } = this.normToPixel(city.x, city.y, width, height);
        const s = this.zoom;
        const margin = 60 * s;
        if (px < -margin || px > width + margin || py < -margin || py > height + margin)
            return;
        const hovered = this.hoveredCityId === city.id;
        const selected = city.isSelected;
        // 도시 반경 글로우 (플레이어/호버 강조)
        if (city.isPlayer || selected || hovered) {
            const glowR = (selected ? 22 : hovered ? 18 : 16) * s;
            const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
            glow.addColorStop(0, city.isPlayer ? 'rgba(240, 217, 140, 0.5)' : 'rgba(255,255,255,0.35)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(px, py, glowR, 0, Math.PI * 2);
            ctx.fill();
        }
        // 성(城) 아이콘 — 성벽 3개 돌기
        const w = 22 * s;
        const h = 14 * s;
        ctx.fillStyle = selected || hovered ? '#f0d98c' : '#c8b070';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // 성벽 몸체 + 3개 돌기
        ctx.rect(px - w / 2, py - h / 2 + 3 * s, w, h - 3 * s);
        ctx.fill();
        ctx.stroke();
        const merlons = [-0.35, 0, 0.35];
        for (const m of merlons) {
            ctx.rect(px + m * w - 2.5 * s, py - h / 2 - 2 * s, 5 * s, 5 * s);
            ctx.fill();
            ctx.stroke();
        }
        // 소속기 색 배지 (성 위)
        ctx.fillStyle = city.ownerColor;
        ctx.beginPath();
        ctx.arc(px, py - h / 2 - 6 * s, 4.5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // 병력 배지 (성 아래)
        const garrisonText = `${Math.round(city.garrison / 100) / 10}만`;
        ctx.font = `bold ${Math.max(8, 9 * s)}px "Malgun Gothic", sans-serif`;
        ctx.textAlign = 'center';
        const tw = ctx.measureText(garrisonText).width + 8 * s;
        ctx.fillStyle = 'rgba(10, 12, 24, 0.75)';
        ctx.fillRect(px - tw / 2, py + h / 2 + 2 * s, tw, 12 * s);
        ctx.fillStyle = '#d8d8e8';
        ctx.fillText(garrisonText, px, py + h / 2 + 11 * s);
        // 도시 이름
        ctx.fillStyle = selected ? '#ffff88' : '#f0e8d0';
        ctx.font = `bold ${Math.max(10, 12 * s)}px "Malgun Gothic", sans-serif`;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(city.name, px, py - h / 2 - 14 * s);
        ctx.fillText(city.name, px, py - h / 2 - 14 * s);
    }
    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }
    zoomAt(factor, centerPx, centerPy) {
        // 커서 위치의 정규 좌표를 보존하며 줌
        const before = this.screenToNorm(centerPx, centerPy);
        this.zoom = Math.max(0.6, Math.min(2.5, this.zoom * factor));
        const after = this.screenToNorm(centerPx, centerPy);
        this.offsetX += (after.x - before.x) * this.baseScale();
        this.offsetY += (after.y - before.y) * this.baseScale();
    }
    baseScale() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        return Math.min(width / 1.0, height / 0.92) * 0.96 * this.zoom;
    }
    /** 테스트/디버그용: 현재 영토 셀 통계 */
    getTerritoryStats() {
        if (this.territoryDirty)
            this.rebuildTerritory();
        let colored = 0;
        for (const cell of this.territoryCells) {
            if (cell.ownerColor)
                colored++;
        }
        return { total: this.territoryCells.length, colored };
    }
    getState() {
        return { offsetX: this.offsetX, offsetY: this.offsetY, zoom: this.zoom };
    }
}
ChinaMapRenderer.CELL_SIZE = 14; // 정규화 공간 0.014 간격
//# sourceMappingURL=china_map_renderer.js.map