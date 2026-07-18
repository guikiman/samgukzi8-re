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

export class TutorialQuestSystem {
  private quests: TutorialQuest[] = [];
  private activeQuestId: string | null = null;
  private completedQuestIds = new Set<string>();

  registerQuest(quest: TutorialQuest): void {
    this.quests.push(quest);
  }

  generateDefaultQuests(): void {
    this.quests = [
      {
        id: "quest_basics_01", title: "게임 시작하기", description: "첫 번째 턴을 시작해보세요.",
        steps: [
          { id: "step_01", instruction: "게임 메인 메뉴를 확인하세요.", targetAction: "view_main_menu", completed: false, highlightSelector: "#main-menu" },
          { id: "step_02", instruction: "새 게임을 시작하세요.", targetAction: "start_new_game", completed: false, highlightSelector: "#btn-new-game" },
        ],
        prerequisites: [], category: "basics", reward: "기초 지식", status: "available",
      },
      {
        id: "quest_domestic_01", title: "내정 맛보기", description: "도시의 내정 명령을 내려보세요.",
        steps: [
          { id: "step_dom_01", instruction: "도시 화면을 엽니다.", targetAction: "open_city_screen", completed: false, highlightSelector: "#city-view" },
          { id: "step_dom_02", instruction: "내정 명령을 선택하세요.", targetAction: "select_domestic_command", completed: false },
          { id: "step_dom_03", instruction: "무장을 배정하고 명령을 실행하세요.", targetAction: "execute_domestic", completed: false },
        ],
        prerequisites: ["quest_basics_01"], category: "domestic", reward: "내정 경험치 +50", status: "locked",
      },
      {
        id: "quest_social_01", title: "인맥 쌓기", description: "다른 무장과 친분을 쌓아보세요.",
        steps: [
          { id: "step_soc_01", instruction: "무장 목록에서 다른 무장을 선택하세요.", targetAction: "select_officer", completed: false },
          { id: "step_soc_02", instruction: "선물을 증정하거나 교류를 시도하세요.", targetAction: "interact_with_officer", completed: false },
        ],
        prerequisites: ["quest_basics_01"], category: "social", reward: "친밀도 +20", status: "locked",
      },
      {
        id: "quest_marriage_01", title: "가문의 번영", description: "결혼하여 가문을 이어가세요.",
        steps: [
          { id: "step_mar_01", instruction: "친밀도 70 이상인 이성 무장을 찾으세요.", targetAction: "find_spouse_candidate", completed: false },
          { id: "step_mar_02", instruction: "청혼을 시도하세요.", targetAction: "propose_marriage", completed: false },
        ],
        prerequisites: ["quest_social_01"], category: "marriage", reward: "배우자 획득", status: "locked",
      },
      {
        id: "quest_military_01", title: "첫 출병", description: "군대를 조직하고 전투를 경험하세요.",
        steps: [
          { id: "step_mil_01", instruction: "부대 편성 화면을 엽니다.", targetAction: "open_formation", completed: false },
          { id: "step_mil_02", instruction: "무장을 전열에 배치하세요.", targetAction: "assign_officers", completed: false },
          { id: "step_mil_03", instruction: "출병 명령을 내리세요.", targetAction: "start_expedition", completed: false },
        ],
        prerequisites: ["quest_basics_01"], category: "military", reward: "전투 경험치 +100", status: "locked",
      },
    ];
  }

  activateQuest(questId: string): boolean {
    const quest = this.quests.find((q) => q.id === questId);
    if (!quest) return false;
    if (quest.status === "locked") return false;
    quest.status = "in_progress";
    this.activeQuestId = questId;
    return true;
  }

  completeStep(stepId: string): boolean {
    if (!this.activeQuestId) return false;
    const quest = this.quests.find((q) => q.id === this.activeQuestId);
    if (!quest) return false;
    const step = quest.steps.find((s) => s.id === stepId);
    if (!step || step.completed) return false;
    step.completed = true;

    if (quest.steps.every((s) => s.completed)) {
      quest.status = "completed";
      this.completedQuestIds.add(quest.id);
      this.activeQuestId = null;
      this.unlockDependentQuests(quest.id);
    }
    return true;
  }

  private unlockDependentQuests(completedQuestId: string): void {
    for (const quest of this.quests) {
      if (quest.status === "locked" && quest.prerequisites.includes(completedQuestId)) {
        quest.status = "available";
      }
    }
  }

  getActiveQuest(): TutorialQuest | null {
    if (!this.activeQuestId) return null;
    return this.quests.find((q) => q.id === this.activeQuestId) ?? null;
  }

  getAvailableQuests(): TutorialQuest[] {
    return this.quests.filter((q) => q.status === "available" || q.status === "in_progress");
  }

  getAllQuests(): TutorialQuest[] {
    return [...this.quests];
  }

  isQuestCompleted(questId: string): boolean {
    return this.completedQuestIds.has(questId);
  }

  getCompletionPercentage(): number {
    if (this.quests.length === 0) return 0;
    return Math.round((this.completedQuestIds.size / this.quests.length) * 100);
  }

  reset(): void {
    this.quests = [];
    this.completedQuestIds.clear();
    this.activeQuestId = null;
  }
}