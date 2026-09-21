/**
 * 삼국지 8 리메이크 — 브라우저 엔트리 포인트
 *
 * GameEngine + BootstrapContext 초기화,
 * Canvas 렌더링 루프, UI 바인딩.
 */
declare global {
    interface Window {
        __game?: Record<string, unknown>;
    }
}
export {};
//# sourceMappingURL=main.d.ts.map