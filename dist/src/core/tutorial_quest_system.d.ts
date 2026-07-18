export type QuestStatus = "locked" | "available" | "in_progress" | "completed";
export interface TutorialQuest {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly steps: TutorialStep[];
    readonly prerequisites: string[];
    readonly category: "basics" | "domestic" | "military" | "diplomacy" | "social" | "marriage";
    readonly reward: string;
    status: QuestStatus;
}
export interface TutorialStep {
    readonly id: string;
    readonly instruction: string;
    readonly targetAction: string;
    completed: boolean;
    readonly highlightSelector?: string;
}
export declare class TutorialQuestSystem {
    private quests;
    private activeQuestId;
    private completedQuestIds;
    registerQuest(quest: TutorialQuest): void;
    generateDefaultQuests(): void;
    activateQuest(questId: string): boolean;
    completeStep(stepId: string): boolean;
    private unlockDependentQuests;
    getActiveQuest(): TutorialQuest | null;
    getAvailableQuests(): TutorialQuest[];
    getAllQuests(): TutorialQuest[];
    isQuestCompleted(questId: string): boolean;
    getCompletionPercentage(): number;
    reset(): void;
}
//# sourceMappingURL=tutorial_quest_system.d.ts.map