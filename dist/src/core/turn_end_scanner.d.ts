/**
 * [Task 18] TURN_END 페이즈 - 수명 주기 및 역사 이벤트 검증
 *
 * 자연사, 육아 주기 이벤트, 역사적 이벤트(연의전) 발동
 * 조건을 충족했는지 파악하고 상태 트리에 결과 반영.
 */
import { GameCalendar } from "./game_calendar";
import { OfficerState, FactionState } from "./sisyphus_orchestrator";
import { Xoshiro128 } from "./prng_xoshiro";
export interface HistoricalEvent {
    readonly year: number;
    readonly month: number;
    readonly eventType: string;
    readonly description: string;
    readonly condition: (officers: Map<string, OfficerState>, factions: Map<string, FactionState>) => boolean;
}
export interface TurnEndResult {
    readonly deaths: string[];
    readonly births: string[];
    readonly historicalEvents: string[];
    readonly gameOver?: {
        winner: string;
    };
}
export declare class TurnEndScanner {
    private historicalEvents;
    private readonly rng;
    constructor(rng: Xoshiro128);
    registerHistoricalEvent(event: HistoricalEvent): void;
    scan(calendar: GameCalendar, officers: Map<string, OfficerState>, factions: Map<string, FactionState>): TurnEndResult;
}
//# sourceMappingURL=turn_end_scanner.d.ts.map