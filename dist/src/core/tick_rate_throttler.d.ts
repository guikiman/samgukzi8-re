/**
 * [Task 19] 동적 틱 레이트(Tick Rate) 스로틀러
 *
 * 게임 실행 속도 배속 설정(1x, 2x, 3x)에 따라
 * gameLoop 비동기 딜레이를 실시간 조율.
 */
export type SpeedMultiplier = 1 | 2 | 3;
export declare class TickRateThrottler {
    private speed;
    setSpeed(s: SpeedMultiplier): void;
    getDelayMs(): number;
    get multiplier(): SpeedMultiplier;
    delay(): Promise<void>;
}
//# sourceMappingURL=tick_rate_throttler.d.ts.map