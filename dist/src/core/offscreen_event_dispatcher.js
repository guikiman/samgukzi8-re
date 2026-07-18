/**
 * [Task 60] 오프스크린 이벤트 디스패처 — OffscreenEventDispatcher
 *
 * 목적: OffscreenCanvas 환경에서 마우스/터치 이벤트를
 *       헥사곤 좌표로 변환하여 디스패치.
 *
 * 핵심 로직:
 *   1. 화면 좌표 → 헥사곤 좌표 변환 (flat-top)
 *   2. 마우스/터치 이벤트 리스너 관리
 *   3. 카메라 상태 기반 월드 좌표 계산
 */
export class OffscreenEventDispatcher {
    constructor() {
        this.canvas = null;
        this.handlers = new Map();
        this.camera = { x: 0, y: 0, zoom: 1, rotation: 0 };
        this.isDragging = false;
        this.lastPointerX = 0;
        this.lastPointerY = 0;
        this.boundHandlers = {};
    }
    /**
     * 캔버스에 이벤트 리스너 연결
     */
    attach(canvas) {
        this.detach();
        this.canvas = canvas;
        this.boundHandlers = {
            click: (e) => this.handleClick(e),
            mousemove: (e) => this.handleMouseMove(e),
            mousedown: (e) => this.handleMouseDown(e),
            mouseup: (e) => this.handleMouseUp(e),
            contextmenu: (e) => this.handleContextMenu(e),
            touchstart: (e) => this.handleTouchStart(e),
            touchmove: (e) => this.handleTouchMove(e),
            touchend: (e) => this.handleTouchEnd(e),
        };
        for (const [type, handler] of Object.entries(this.boundHandlers)) {
            canvas.addEventListener(type, handler);
        }
    }
    /**
     * 이벤트 리스너 분리
     */
    detach() {
        if (!this.canvas)
            return;
        for (const [type, handler] of Object.entries(this.boundHandlers)) {
            this.canvas.removeEventListener(type, handler);
        }
        this.boundHandlers = {};
        this.canvas = null;
    }
    /**
     * 이벤트 핸들러 등록
     */
    on(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type).add(handler);
    }
    /**
     * 이벤트 핸들러 제거
     */
    off(type, handler) {
        this.handlers.get(type)?.delete(handler);
    }
    /**
     * 카메라 상태 업데이트
     */
    updateCamera(camera) {
        this.camera = camera;
    }
    /**
     * 화면 좌표 → 헥스 좌표 (flat-top)
     */
    getHexCoord(clientX, clientY, camera) {
        if (!this.canvas)
            return null;
        const rect = this.canvas.getBoundingClientRect();
        const px = (clientX - rect.left) / camera.zoom - camera.x;
        const py = (clientY - rect.top) / camera.zoom - camera.y;
        // Flat-top hex math
        const size = 32;
        const q = (2 / 3 * px) / size;
        const r = (-1 / 3 * px + Math.sqrt(3) / 3 * py) / size;
        return { q: Math.round(q), r: Math.round(r) };
    }
    /**
     * 화면 좌표 → 월드 좌표
     */
    getWorldCoord(clientX, clientY, camera) {
        if (!this.canvas)
            return null;
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / camera.zoom - camera.x,
            y: (clientY - rect.top) / camera.zoom - camera.y,
        };
    }
    emit(type, clientX, clientY, button = 0, ctrl = false, shift = false) {
        const hex = this.getHexCoord(clientX, clientY, this.camera);
        if (!hex)
            return;
        const event = {
            type,
            hexQ: hex.q,
            hexR: hex.r,
            screenX: clientX,
            screenY: clientY,
            button,
            ctrlKey: ctrl,
            shiftKey: shift,
        };
        this.handlers.get(type)?.forEach((h) => h(event));
    }
    handleClick(e) {
        if (e.button === 2)
            return;
        this.emit("hexClick", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
    }
    handleMouseMove(e) {
        if (this.isDragging) {
            this.emit("pan", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
        }
        else {
            this.emit("hexHover", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
        }
    }
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.emit("hexDragStart", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
    }
    handleMouseUp(e) {
        this.isDragging = false;
        this.emit("hexDragEnd", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
    }
    handleContextMenu(e) {
        e.preventDefault();
        this.emit("rightClick", e.clientX, e.clientY, 2, e.ctrlKey, e.shiftKey);
    }
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            this.emit("pinch", e.touches[0].clientX, e.touches[0].clientY, 0, false, false);
        }
    }
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.emit("hexHover", e.touches[0].clientX, e.touches[0].clientY, 0, false, false);
        }
    }
    handleTouchEnd(_e) {
        // no-op
    }
}
//# sourceMappingURL=offscreen_event_dispatcher.js.map