export type ConsoleCommand = (
  | { type: "add_gold"; factionId: string; amount: number }
  | { type: "add_rice"; factionId: string; amount: number }
  | { type: "set_affinity"; sourceId: string; targetId: string; value: number }
  | { type: "force_marriage"; officerA: string; officerB: string }
  | { type: "kill_officer"; officerId: string }
  | { type: "merge_factions"; targetFactionId: string; absorbedByFactionId: string }
  | { type: "skip_childhood"; childId: string; targetAge: number }
  | { type: "set_stat"; officerId: string; stat: string; value: number }
  | { type: "trigger_event"; eventId: string }
  | { type: "toggle_flag"; flag: string }
  | { type: "evaluate"; code: string }
  | { type: "help" }
  | { type: "list_officers"; filter?: string }
  | { type: "list_factions" }
  | { type: "set_weather"; cityId: string; weather: string }
  | { type: "add_population"; cityId: string; amount: number }
  | { type: "set_loyalty"; officerId: string; value: number }
);

export interface ConsoleResult {
  readonly success: boolean;
  readonly message: string;
  readonly data?: unknown;
}

export class DevSandboxConsole {
  private commandHistory: string[] = [];
  private maxHistory = 100;
  private customHandlers: Map<string, (args: string[]) => ConsoleResult> = new Map();

  registerHandler(commandName: string, handler: (args: string[]) => ConsoleResult): void {
    this.customHandlers.set(commandName.toLowerCase(), handler);
  }

  execute(input: string): ConsoleResult {
    this.commandHistory.push(input);
    if (this.commandHistory.length > this.maxHistory) {
      this.commandHistory.shift();
    }

    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    if (this.customHandlers.has(command)) {
      return this.customHandlers.get(command)!(args);
    }

    try {
      return this.executeBuiltin(trimmed);
    } catch (err) {
      return { success: false, message: `Error: ${err}` };
    }
  }

  private executeBuiltin(input: string): ConsoleResult {
    const parts = input.split(/\s+/);
    const cmd = parts[0]?.toLowerCase();

    switch (cmd) {
      case "help":
        return {
          success: true,
          message: `사용 가능한 명령어:
  help - 도움말 표시
  list_officers [filter] - 무장 목록 조회
  list_factions - 세력 목록 조회
  add_gold <faction_id> <amount> - 금 추가
  add_rice <faction_id> <amount> - 군량 추가
  set_affinity <source> <target> <value> - 친밀도 설정
  kill_officer <id> - 무장 제거
  set_stat <id> <stat> <value> - 능력치 설정
  e/kill/clear - 각종 유틸리티
  history - 명령어 기록`,
        };

      case "history":
        return { success: true, message: this.commandHistory.map((c, i) => `${i}: ${c}`).join("\n") };

      case "clear":
        return { success: true, message: "CLEAR_SCREEN" };

      case "e":
      case "eval":
        return { success: false, message: "보안상 eval 명령어가 비활성화되었습니다." };

      default:
        return { success: false, message: `알 수 없는 명령어: "${cmd}". help를 입력하세요.` };
    }
  }

  getHistory(): string[] {
    return [...this.commandHistory];
  }

  clearHistory(): void {
    this.commandHistory = [];
  }
}