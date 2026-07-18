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

export class DynamicWeatherEngine {
    /**
     * 확률 분포 매트릭스에 기반하여 턴 시작 시 날씨를 변화시킵니다.
     */
    rollNextWeather(season: Season, region: RegionType): Weather {
        const roll = Math.random();

        if (season === 'WINTER') {
            if (region === 'NORTH') {
                if (roll < 0.6) return 'SNOW';
                if (roll < 0.8) return 'FOG';
                return 'SUNNY';
            } else {
                if (roll < 0.3) return 'RAIN';
                if (roll < 0.6) return 'FOG';
                return 'SUNNY';
            }
        } else if (season === 'SUMMER') {
            if (roll < 0.4) return 'RAIN';
            return 'SUNNY';
        } else if (season === 'SPRING') {
            if (roll < 0.3) return 'RAIN';
            if (roll < 0.5) return 'FOG';
            return 'SUNNY';
        } else {
            // AUTUMN
            if (roll < 0.25) return 'FOG';
            return 'SUNNY';
        }
    }

    /**
     * 현재 날씨에 따른 전투 제약 조건을 반환합니다.
     */
    getWeatherConstraints(weather: Weather): WeatherConstraints {
        switch (weather) {
            case 'RAIN':
                return {
                    canUseFire: false,
                    mobilityPenalty: 1,
                    cavalryChargeReduction: 0.1,
                    rangeCap: null,
                    fireSelfExtinguishBonus: 0.4,
                };
            case 'SNOW':
                return {
                    canUseFire: true,
                    mobilityPenalty: 2,
                    cavalryChargeReduction: 0.3,
                    rangeCap: null,
                    fireSelfExtinguishBonus: 0.0,
                };
            case 'FOG':
                return {
                    canUseFire: true,
                    mobilityPenalty: 1,
                    cavalryChargeReduction: 0.0,
                    rangeCap: 1,
                    fireSelfExtinguishBonus: 0.0,
                };
            case 'STORM':
                return {
                    canUseFire: false,
                    mobilityPenalty: 3,
                    cavalryChargeReduction: 0.5,
                    rangeCap: 1,
                    fireSelfExtinguishBonus: 0.6,
                };
            default: // SUNNY, CLOUDY
                return {
                    canUseFire: true,
                    mobilityPenalty: 0,
                    cavalryChargeReduction: 0.0,
                    rangeCap: null,
                    fireSelfExtinguishBonus: 0.0,
                };
        }
    }
}
