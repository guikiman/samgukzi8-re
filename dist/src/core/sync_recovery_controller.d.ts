/**
 * [Task 38] WebGL 프레임 드랍 감지 보정기 (Sync Recovery)
 *
 * WebGL 렌더러의 렌더링 프레임율이 급격히 저하되어
 * 시뮬레이션 연산보다 느려질 때 오케스트레이터 루프를 조율.
 */
export declare class SyncRecoveryController {
    private renderTimeHistory;
    private readonly maxHistory;
    private readonly frameBudget;
    recordRenderTime(elapsedMs: number): void;
    getAverageRenderTime(): number;
    isFallingBehind(): boolean;
    getSuggestedDelay(): number;
}
//# sourceMappingURL=sync_recovery_controller.d.ts.map