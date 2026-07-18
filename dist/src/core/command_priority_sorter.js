/**
 * [Task 21] 다중 명령 우선순위 정렬기
 *
 * 수집된 모든 세력의 행동을 무장의 민첩성, 부대 병과 속도,
 * 명령 중요도 순서에 따라 재정렬.
 */
const COMMAND_BASE_PRIORITY = {
    move: 10,
    attack: 100,
    tactic: 90,
    strategy: 80,
    domestic: 30,
    diplomacy: 40,
    wait: 0,
};
export class CommandPrioritySorter {
    sort(commands) {
        return [...commands].sort((a, b) => {
            const priA = COMMAND_BASE_PRIORITY[a.type] + a.agility;
            const priB = COMMAND_BASE_PRIORITY[b.type] + b.agility;
            return priB - priA;
        });
    }
}
//# sourceMappingURL=command_priority_sorter.js.map