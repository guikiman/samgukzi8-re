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

export type OffscreenEventType =
  | "hexClick"
  | "hexHover"
  | "hexDragStart"
  | "hexDragEnd"
  | "rightClick"
  | "pinch"
  | "pan";

export interface CameraState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
  readonly rotation: number;
}

export interface OffscreenGameEvent {
  readonly type: OffscreenEventType;
  readonly hexQ: number;
  readonly hexR: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly button: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

export type OffscreenEventHandler = (event: OffscreenGameEvent) => void;

export class OffscreenEventDispatcher {
  private canvas: HTMLCanvasElement | null = null;
  private handlers = new Map<OffscreenEventType, Set<OffscreenEventHandler>>();
  private camera: CameraState = { x: 0, y: 0, zoom: 1, rotation: 0 };
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private boundHandlers: Record<string, EventListener> = {};

  /**
   * 캔버스에 이벤트 리스너 연결
   */
  attach(canvas: HTMLCanvasElement): void {
    this.detach();
    this.canvas = canvas;

    this.boundHandlers = {
      click: (e: Event) => this.handleClick(e as PointerEvent),
      mousemove: (e: Event) => this.handleMouseMove(e as PointerEvent),
      mousedown: (e: Event) => this.handleMouseDown(e as PointerEvent),
      mouseup: (e: Event) => this.handleMouseUp(e as PointerEvent),
      contextmenu: (e: Event) => this.handleContextMenu(e as PointerEvent),
      touchstart: (e: Event) => this.handleTouchStart(e as TouchEvent),
      touchmove: (e: Event) => this.handleTouchMove(e as TouchEvent),
      touchend: (e: Event) => this.handleTouchEnd(e as TouchEvent),
    };

    for (const [type, handler] of Object.entries(this.boundHandlers)) {
      canvas.addEventListener(type, handler);
    }
  }

  /**
   * 이벤트 리스너 분리
   */
  detach(): void {
    if (!this.canvas) return;
    for (const [type, handler] of Object.entries(this.boundHandlers)) {
      this.canvas.removeEventListener(type, handler);
    }
    this.boundHandlers = {};
    this.canvas = null;
  }

  /**
   * 이벤트 핸들러 등록
   */
  on(type: OffscreenEventType, handler: OffscreenEventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  /**
   * 이벤트 핸들러 제거
   */
  off(type: OffscreenEventType, handler: OffscreenEventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  /**
   * 카메라 상태 업데이트
   */
  updateCamera(camera: CameraState): void {
    this.camera = camera;
  }

  /**
   * 화면 좌표 → 헥스 좌표 (flat-top)
   */
  getHexCoord(clientX: number, clientY: number, camera: CameraState): { q: number; r: number } | null {
    if (!this.canvas) return null;
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
  getWorldCoord(clientX: number, clientY: number, camera: CameraState): { x: number; y: number } | null {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / camera.zoom - camera.x,
      y: (clientY - rect.top) / camera.zoom - camera.y,
    };
  }

  private emit(type: OffscreenEventType, clientX: number, clientY: number, button = 0, ctrl = false, shift = false): void {
    const hex = this.getHexCoord(clientX, clientY, this.camera);
    if (!hex) return;

    const event: OffscreenGameEvent = {
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

  private handleClick(e: PointerEvent): void {
    if (e.button === 2) return;
    this.emit("hexClick", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
  }

  private handleMouseMove(e: PointerEvent): void {
    if (this.isDragging) {
      this.emit("pan", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
    } else {
      this.emit("hexHover", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
    }
  }

  private handleMouseDown(e: PointerEvent): void {
    this.isDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.emit("hexDragStart", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
  }

  private handleMouseUp(e: PointerEvent): void {
    this.isDragging = false;
    this.emit("hexDragEnd", e.clientX, e.clientY, e.button, e.ctrlKey, e.shiftKey);
  }

  private handleContextMenu(e: PointerEvent): void {
    e.preventDefault();
    this.emit("rightClick", e.clientX, e.clientY, 2, e.ctrlKey, e.shiftKey);
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      this.emit("pinch", e.touches[0].clientX, e.touches[0].clientY, 0, false, false);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.emit("hexHover", e.touches[0].clientX, e.touches[0].clientY, 0, false, false);
    }
  }

  private handleTouchEnd(_e: TouchEvent): void {
    // no-op
  }
}
