/**
 * [18] 자녀 출생 및 능력치 유전 연산기 — ChildGeneticsEngine
 *
 * 목적: 부모의 능력치를 유전받은 자녀 데이터 생성.
 */
export class ChildGeneticsEngine {
    generateChild(parent1, parent2) {
        return { name: "새 자녀", war: (parent1.war + parent2.war) / 2 };
    }
}
//# sourceMappingURL=child_genetics_engine.js.map