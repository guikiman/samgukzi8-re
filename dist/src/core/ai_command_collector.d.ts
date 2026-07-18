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
export declare class AiCommandCollector {
    private engines;
    registerEngine(factionId: string, engine: AiDecisionEngine): void;
    collectAll(factions: AiContext[]): Promise<AiCommand[]>;
}
//# sourceMappingURL=ai_command_collector.d.ts.map