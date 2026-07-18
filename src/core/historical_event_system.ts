export interface HistoricalEvent {
  readonly id: string;
  readonly year: number;
  readonly month: number;
  readonly title: string;
  readonly description: string;
  readonly conditions: HistoricalCondition[];
  readonly effects: HistoricalEffect[];
  triggered: boolean;
  readonly oneTimeOnly: boolean;
}

export interface HistoricalCondition {
  readonly type: "year_reached" | "officer_alive" | "officer_dead" | "faction_exists" | "faction_destroyed" | "city_owned" | "relation_threshold";
  readonly params: Record<string, string | number>;
}

export interface HistoricalEffect {
  readonly type: "officer_transfer" | "faction_merge" | "relation_change" | "event_flag" | "message";
  readonly params: Record<string, string | number>;
}

export class HistoricalEventSystem {
  private events: HistoricalEvent[] = [];
  private triggeredIds = new Set<string>();
  private globalFlags = new Map<string, boolean>();

  registerEvent(event: HistoricalEvent): void {
    this.events.push(event);
  }

  registerDefaultEvents(): void {
    this.events = [
      {
        id: "three_visit", year: 207, month: 1,
        title: "삼고초려", description: "유비가 제갈량을 세 번 방문하여 군사로 삼았다.",
        conditions: [
          { type: "year_reached", params: { year: 207 } },
          { type: "officer_alive", params: { officerId: "liu_bei" } },
          { type: "officer_alive", params: { officerId: "zhuge_liang" } },
        ],
        effects: [{ type: "event_flag", params: { flag: "three_visit_completed" } }, { type: "message", params: { text: "삼고초려 이벤트 발생!" } }],
        triggered: false, oneTimeOnly: true,
      },
      {
        id: "battle_guandu", year: 200, month: 10,
        title: "관도대전", description: "조조가 원소를 관도에서 대파했다.",
        conditions: [
          { type: "year_reached", params: { year: 200 } },
          { type: "officer_alive", params: { officerId: "cao_cao" } },
          { type: "officer_alive", params: { officerId: "yuan_shao" } },
        ],
        effects: [{ type: "event_flag", params: { flag: "guandu_completed" } }, { type: "message", params: { text: "관도대전! 조조가 승리했다!" } }],
        triggered: false, oneTimeOnly: true,
      },
      {
        id: "chibi_battle", year: 208, month: 12,
        title: "적벽대전", description: "손권-유비 연합군이 조조의 대군을 적벽에서 격파했다.",
        conditions: [
          { type: "year_reached", params: { year: 208 } },
          { type: "officer_alive", params: { officerId: "zhou_yu" } },
          { type: "officer_alive", params: { officerId: "cao_cao" } },
        ],
        effects: [{ type: "event_flag", params: { flag: "chibi_completed" } }, { type: "message", params: { text: "적벽에 불이 붙었다! 조조 대패!" } }],
        triggered: false, oneTimeOnly: true,
      },
      {
        id: "yellow_turban", year: 184, month: 2,
        title: "황건적의 난", description: "장각이 황건적을 이끌고 봉기했다.",
        conditions: [{ type: "year_reached", params: { year: 184 } }],
        effects: [{ type: "event_flag", params: { flag: "yellow_turban_started" } }, { type: "message", params: { text: "황건적이 봉기했다! 천하가 혼란에 빠진다." } }],
        triggered: false, oneTimeOnly: true,
      },
      {
        id: "dong_zhuo_death", year: 192, month: 4,
        title: "동탁 주살", description: "왕윤의 계략으로 여포가 동탁을 죽였다.",
        conditions: [
          { type: "year_reached", params: { year: 192 } },
          { type: "officer_alive", params: { officerId: "lv_bu" } },
          { type: "officer_alive", params: { officerId: "dong_zhuo" } },
        ],
        effects: [{ type: "event_flag", params: { flag: "dong_zhuo_dead" } }, { type: "message", params: { text: "여포가 동탁을 주살했다!" } }],
        triggered: false, oneTimeOnly: true,
      },
    ];
  }

  checkEvents(currentYear: number, currentMonth: number, officerStatus: Map<string, boolean>, factionStatus: Map<string, boolean>): HistoricalEvent[] {
    const triggered: HistoricalEvent[] = [];

    for (const event of this.events) {
      if (event.triggered && event.oneTimeOnly) continue;
      const allConditionsMet = event.conditions.every((cond) => {
        return this.evaluateCondition(cond, currentYear, currentMonth, officerStatus, factionStatus);
      });

      if (allConditionsMet) {
        event.triggered = true;
        this.triggeredIds.add(event.id);
        this.applyEffects(event);
        triggered.push(event);
      }
    }

    return triggered;
  }

  private evaluateCondition(
    cond: HistoricalCondition,
    currentYear: number,
    currentMonth: number,
    officerStatus: Map<string, boolean>,
    factionStatus: Map<string, boolean>,
  ): boolean {
    switch (cond.type) {
      case "year_reached":
        return currentYear >= (cond.params.year as number) && currentMonth >= (cond.params.month as number ?? 1);
      case "officer_alive":
        return officerStatus.get(cond.params.officerId as string) ?? false;
      case "officer_dead":
        return !(officerStatus.get(cond.params.officerId as string) ?? true);
      case "faction_exists":
        return factionStatus.get(cond.params.factionId as string) ?? false;
      case "faction_destroyed":
        return !(factionStatus.get(cond.params.factionId as string) ?? true);
      default:
        return false;
    }
  }

  private applyEffects(event: HistoricalEvent): void {
    for (const effect of event.effects) {
      if (effect.type === "event_flag") {
        this.globalFlags.set(effect.params.flag as string, true);
      }
    }
  }

  isFlagSet(flag: string): boolean {
    return this.globalFlags.get(flag) ?? false;
  }

  getTriggeredEvents(): HistoricalEvent[] {
    return this.events.filter((e) => e.triggered);
  }

  getPendingEvents(currentYear: number, currentMonth: number): HistoricalEvent[] {
    return this.events.filter((e) => {
      if (e.triggered && e.oneTimeOnly) return false;
      return e.conditions.some((c) => c.type === "year_reached" && (c.params.year as number) >= currentYear);
    });
  }
}