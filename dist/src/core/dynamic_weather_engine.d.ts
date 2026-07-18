/**
 * [B6] 날씨 변화 및 상태 전법 제약 — Dynamic Weather Engine
 *
 * DynamicWeatherEngine:
 *   1. 매 전투 턴 첫 단계에서 세션 기후 상태 갱신 (Markov Chain)
 *   2. 계절(Season) + 지역(Region) 가중치에 따라 다음 날씨 결정
 *   3. RAIN(비): 화계 전법 사용 불가, 불타일 자가 소화 +40%
 *   4. SNOW(눈): 모든 부대 기동력 -2, 기병 돌격 피해량 -30%
 *   5. FOG(안개): 시야 극도 제한, 원거리 궁병 사거리 1칸 고정
 */
import type { RegionType } from './hex_naval_state_resolver';
import type { Season, Weather } from './types';
export interface WeatherConstraints {
    readonly canUseFire: boolean;
    readonly mobilityPenalty: number;
    readonly cavalryChargeReduction: number;
    readonly rangeCap: number | null;
    readonly fireSelfExtinguishBonus: number;
}
export declare class DynamicWeatherEngine {
    /**
     * 확률 분포 매트릭스에 기반하여 턴 시작 시 날씨를 변화시킵니다.
     */
    rollNextWeather(season: Season, region: RegionType): Weather;
    /**
     * 현재 날씨에 따른 전투 제약 조건을 반환합니다.
     */
    getWeatherConstraints(weather: Weather): WeatherConstraints;
}
//# sourceMappingURL=dynamic_weather_engine.d.ts.map