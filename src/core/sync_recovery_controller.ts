/**
 * [Task 38] WebGL 프레임 드랍 감지 보정기 (Sync Recovery)
 *
 * WebGL 렌더러의 렌더링 프레임율이 급격히 저하되어
 * 시뮬레이션 연산보다 느려질 때 오케스트레이터 루프를 조율.
 */

export class SyncRecoveryController {
  private renderTimeHistory: number[] = [];
  private readonly maxHistory = 10;
  private readonly frameBudget = 16;

  recordRenderTime(elapsedMs: number): void {
    this.renderTimeHistory.push(elapsedMs);
    if (this.renderTimeHistory.length > this.maxHistory) {
      this.renderTimeHistory.shift();
    }
  }

  getAverageRenderTime(): number {
    if (this.renderTimeHistory.length === 0) return 0;
    return this.renderTimeHistory.reduce((a, b) => a + b, 0) / this.renderTimeHistory.length;
  }

  isFallingBehind(): boolean {
    return this.getAverageRenderTime() > this.frameBudget * 1.5;
  }

  getSuggestedDelay(): number {
    if (this.isFallingBehind()) return Math.max(0, this.getAverageRenderTime() - this.frameBudget);
    return 0;
  }
}
