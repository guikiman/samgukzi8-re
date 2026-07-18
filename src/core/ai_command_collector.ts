/**
 * [Task 13] COMMAND_INPUT 페이즈 - 비동기 AI 명령 수집기
 *
 * 모든 AI 세력이 비동기로 명령 연산을 동시다발적으로
 * 진행한 뒤 오케스트레이터 큐로 수집하는 병렬 수집기.
 */

export interface AiCommand {
  readonly factionId: string;
  readonly type: string;
  readonly target?: string;
  readonly priority: number;
}

export interface AiDecisionEngine {
  decide(factionId: string, context: AiContext): Promise<AiCommand[]>;
}

export interface AiContext {
  readonly factionGold: number;
  readonly factionRice: number;
  readonly officerCount: number;
  readonly cityCount: number;
  readonly atWar: boolean;
}

export class AiCommandCollector {
  private engines = new Map<string, AiDecisionEngine>();

  registerEngine(factionId: string, engine: AiDecisionEngine): void {
    this.engines.set(factionId, engine);
  }

  async collectAll(factions: AiContext[]): Promise<AiCommand[]> {
    const promises: Promise<AiCommand[]>[] = [];

    for (const ctx of factions) {
      const engine = this.engines.get(ctx.factionGold.toString());
      if (engine) {
        promises.push(engine.decide(ctx.factionGold.toString(), ctx));
      }
    }

    const results = await Promise.allSettled(promises);
    const commands: AiCommand[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        commands.push(...result.value);
      }
    }

    commands.sort((a, b) => b.priority - a.priority);
    return commands;
  }
}
