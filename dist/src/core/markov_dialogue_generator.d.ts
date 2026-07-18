/**
 * [12] 마르코프 체인(Markov Chain) 기반 절차적 NPC 대사 변이 매퍼
 *
 * MarkovDialogueGenerator:
 *   - 형태소 분석 기반 상태 변이 행렬 P 모델링
 *   - 우호도 상태에 맞춰 런타임 단어 조합 체인 생성
 *   - 매번 미묘하게 다른 문맥과 뉘앙스의 대사 출력
 */
export interface MarkovState {
    readonly prefix: readonly string[];
    readonly suffix: string;
    probability: number;
}
export interface DialogueContext {
    readonly affinity: number;
    readonly location: string;
    readonly timeOfDay: string;
    readonly npcPersonality: string;
}
export declare class MarkovDialogueGenerator {
    private chain;
    private readonly contexts;
    /**
     * [12] 코퍼스(corpus) 학습 — 상태 변이 행렬 구축
     *
     * P(next | current) = count(current → next) / count(current)
     */
    learn(corpus: string[]): void;
    /**
     * [12] 문맥 기반 대사 생성
     *
     * 우호도(affinity)에 따라 발화 템플릿 선택 후
     * 마르코프 체인으로 단어 조합 생성
     */
    generate(context: DialogueContext, maxWords?: number): string;
    /**
     * [12] 마르코프 연쇄 생성
     * 현재 단어 → 확률 기반 다음 단어 선택
     */
    generateChain(startWord: string, maxWords: number): string;
    private selectGreeting;
    private selectTopic;
    /**
     * [12] 학습된 체인 초기화 (새로운 NPC 성격 부여)
     */
    reset(): void;
    getChainSize(): number;
}
//# sourceMappingURL=markov_dialogue_generator.d.ts.map