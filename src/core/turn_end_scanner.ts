/**
 * [Task 18] TURN_END 페이즈 - 수명 주기 및 역사 이벤트 검증
 *
 * 자연사, 육아 주기 이벤트, 역사적 이벤트(연의전) 발동
 * 조건을 충족했는지 파악하고 상태 트리에 결과 반영.
 */

import { GameCalendar } from "./game_calendar";
import { OfficerState, CityState, FactionState } from "./sisyphus_orchestrator";
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
  readonly gameOver?: { winner: string };
}

export class TurnEndScanner {
  private historicalEvents: HistoricalEvent[] = [];
  private readonly rng: Xoshiro128;

  constructor(rng: Xoshiro128) {
    this.rng = rng;
  }

  registerHistoricalEvent(event: HistoricalEvent): void {
    this.historicalEvents.push(event);
  }

  scan(calendar: GameCalendar, officers: Map<string, OfficerState>, factions: Map<string, FactionState>): TurnEndResult {
    const result: TurnEndResult = { deaths: [], births: [], historicalEvents: [] };

    for (const [id, officer] of officers) {
      if (!officer.alive) continue;

      if (this.rng.float() < 0.002) {
        result.deaths.push(id);
      }
    }

    for (const event of this.historicalEvents) {
      if (event.year === calendar.year && event.month === calendar.month) {
        if (event.condition(officers, factions)) {
          result.historicalEvents.push(event.description);
        }
      }
    }

    const aliveFactions = Array.from(factions.values()).filter((f) => f.alive);
    if (aliveFactions.length <= 1 && aliveFactions.length > 0) {
      return { ...result, gameOver: { winner: aliveFactions[0].id } };
    }

    return result;
  }
}
