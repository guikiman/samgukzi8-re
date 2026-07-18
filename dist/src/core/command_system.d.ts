/**
 * 삼국지 8 리메이크 — 커맨드 패턴 시스템
 * 파일: src/core/command_system.ts
 *
 * 커맨드 패턴 + 큐 + Undo/Redo 구현
 * 모든 무장 행동을 Command 객체로 캡슐화
 */
import { ICommand, SerializedCommand, CommandContext, CommandResult, SideEffect, CommandType, OfficerID, CityID, ID } from './types.js';
declare abstract class BaseCommand implements ICommand {
    readonly id: string;
    readonly type: CommandType;
    readonly officerId: OfficerID;
    readonly turnIssued: number;
    readonly timestamp: number;
    protected sideEffects: SideEffect[];
    constructor(type: CommandType, officerId: OfficerID, turnIssued: number);
    abstract execute(context: CommandContext): CommandResult;
    abstract undo(context: CommandContext): boolean;
    abstract serialize(): SerializedCommand;
    protected buildResult(success: boolean, message: string): CommandResult;
    protected recordSideEffect(target: SideEffect['target'], targetId: ID, field: string, oldValue: unknown, newValue: unknown): void;
}
export declare class DomesticCommand extends BaseCommand {
    private cityId;
    private facilityType;
    private goldCost;
    private statKey;
    constructor(officerId: OfficerID, cityId: CityID, facilityType: string, turn: number);
    execute(context: CommandContext): CommandResult;
    undo(context: CommandContext): boolean;
    serialize(): SerializedCommand;
}
export declare class TrainingCommand extends BaseCommand {
    private statKey;
    constructor(officerId: OfficerID, statKey: typeof TrainingCommand.prototype.statKey, turn: number);
    execute(context: CommandContext): CommandResult;
    undo(context: CommandContext): boolean;
    serialize(): SerializedCommand;
}
export declare class RecruitmentCommand extends BaseCommand {
    private targetOfficerId;
    constructor(officerId: OfficerID, targetOfficerId: OfficerID, turn: number);
    execute(context: CommandContext): CommandResult;
    undo(context: CommandContext): boolean;
    serialize(): SerializedCommand;
}
export declare class MovementCommand extends BaseCommand {
    private fromCityId;
    private toCityId;
    constructor(officerId: OfficerID, fromCityId: CityID, toCityId: CityID, turn: number);
    execute(context: CommandContext): CommandResult;
    undo(context: CommandContext): boolean;
    serialize(): SerializedCommand;
}
export declare class RestCommand extends BaseCommand {
    constructor(officerId: OfficerID, turn: number);
    execute(context: CommandContext): CommandResult;
    undo(context: CommandContext): boolean;
    serialize(): SerializedCommand;
}
export declare function deserializeCommand(data: SerializedCommand): ICommand;
export declare class CommandQueue {
    private pending;
    private executed;
    private undone;
    private maxHistory;
    constructor(maxHistory?: number);
    enqueue(command: ICommand): void;
    dequeue(): ICommand | undefined;
    executeNext(context: CommandContext): CommandResult | null;
    executeAll(context: CommandContext): CommandResult[];
    undoLast(context: CommandContext): boolean;
    redoLast(context: CommandContext): boolean;
    clear(): void;
    getPendingCount(): number;
    getExecutedCount(): number;
    canUndo(): boolean;
    canRedo(): boolean;
    serializeAll(): SerializedCommand[];
}
export {};
//# sourceMappingURL=command_system.d.ts.map