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
export declare class HexWeatherRenderer {
    /**
     * 날씨별 오버레이 설정 반환
     */
    getOverlay(weather: WeatherType): WeatherOverlay;
}
//# sourceMappingURL=hex_weather_renderer.d.ts.map