/**
 * [Task 87] 헥스 날씨 렌더러 — HexWeatherRenderer
 *
 * 목적: 헥스 맵 위에 날씨 효과(비, 눈, 안개)를
 *       오버레이로 렌더링.
 *
 * 핵심 로직:
 *   1. 날씨 타입별 파티클 효과
 *   2. 날씨에 따른 화면 색조 변화
 */

export type WeatherType = "clear" | "rain" | "snow" | "fog" | "storm";

export interface WeatherOverlay {
  readonly color: [number, number, number, number];
  readonly particleCount: number;
  readonly windDirection: number;
}

const WEATHER_OVERLAYS: Record<WeatherType, WeatherOverlay> = {
  clear: { color: [1, 1, 1, 0], particleCount: 0, windDirection: 0 },
  rain: { color: [0.6, 0.6, 0.8, 0.15], particleCount: 200, windDirection: 0.3 },
  snow: { color: [0.9, 0.9, 1, 0.1], particleCount: 150, windDirection: 0.1 },
  fog: { color: [0.7, 0.7, 0.8, 0.3], particleCount: 0, windDirection: 0 },
  storm: { color: [0.3, 0.3, 0.4, 0.25], particleCount: 300, windDirection: 0.7 },
};

export class HexWeatherRenderer {
  /**
   * 날씨별 오버레이 설정 반환
   */
  getOverlay(weather: WeatherType): WeatherOverlay {
    return WEATHER_OVERLAYS[weather];
  }
}
