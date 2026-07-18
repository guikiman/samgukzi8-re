/**
 * [Task 21] 다중 명령 우선순위 정렬기
 *
 * 수집된 모든 세력의 행동을 무장의 민첩성, 부대 병과 속도,
 * 명령 중요도 순서에 따라 재정렬.
 */
export type CommandType = "move" | "attack" | "tactic" | "strategy" | "domestic" | "diplomacy" | "wait";
export interface PrioritizedCommand {
    readonly factionId: string;
    readonly officerId: string;
    readonly type: CommandType;
    readonly priority: number;
    readonly agility: number;
}
export declare class CommandPrioritySorter {
    sort(commands: PrioritizedCommand[]): PrioritizedCommand[];
}
//# sourceMappingURL=command_priority_sorter.d.ts.map