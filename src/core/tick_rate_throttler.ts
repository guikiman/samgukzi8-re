/**
 * [Task 19] 동적 틱 레이트(Tick Rate) 스로틀러
 *
 * 게임 실행 속도 배속 설정(1x, 2x, 3x)에 따라
 * gameLoop 비동기 딜레이를 실시간 조율.
 */

export type SpeedMultiplier = 1 | 2 | 3;

const BASE_TICK_MS = 100;

export class TickRateThrottler {
  private speed: SpeedMultiplier = 1;

  setSpeed(s: SpeedMultiplier): void {
    this.speed = s;
  }

  getDelayMs(): number {
    return Math.max(BASE_TICK_MS / this.speed, 1);
  }

  get multiplier(): SpeedMultiplier {
    return this.speed;
  }

  delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.getDelayMs()));
  }
}
