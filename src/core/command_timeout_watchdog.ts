/**
 * [Task 16] 명령 제출 타임아웃 워치독
 *
 * 플레이어의 미입력 상태가 장시간 유지되거나 AI 서브 쓰레드가
 * 중단될 경우 디폴트 '대기(Wait)' 명령을 강제 주입.
 */

export type CommandSubmission = "player_ready" | "ai_ready" | "wait" | "timeout";

export class CommandTimeoutWatchdog {
  private submitted = new Set<string>();
  private timeoutMs: number;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private onTimeout: (() => void) | null = null;

  constructor(timeoutMs = 30000) {
    this.timeoutMs = timeoutMs;
  }

  registerFaction(factionId: string): void {
    this.submitted.add(factionId);
  }

  markSubmitted(factionId: string): void {
    this.submitted.add(factionId);
  }

  isAllSubmitted(factionIds: string[]): boolean {
    return factionIds.every((id) => this.submitted.has(id));
  }

  reset(factionIds: string[]): void {
    this.submitted.clear();
    for (const id of factionIds) this.submitted.add(id);
  }

  start(callback: () => void): void {
    this.onTimeout = callback;
    this.timerId = setTimeout(() => {
      callback();
    }, this.timeoutMs);
  }

  cancel(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
