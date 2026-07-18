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
    readonly affinity: number;    // 0-100 우호도
    readonly location: string;    // 'tavern' | 'market' | 'street'
    readonly timeOfDay: string;   // 'morning' | 'afternoon' | 'evening'
    readonly npcPersonality: string;
}

export class MarkovDialogueGenerator {
    private chain: Map<string, Map<string, number>> = new Map();
    private readonly contexts: string[] = ['greeting', 'farewell', 'trade', 'rumor', 'weather'];

    /**
     * [12] 코퍼스(corpus) 학습 — 상태 변이 행렬 구축
     *
     * P(next | current) = count(current → next) / count(current)
     */
    learn(corpus: string[]): void {
        for (const sentence of corpus) {
            const words = sentence.split(/\s+/);
            for (let i = 0; i < words.length - 1; i++) {
                const current = words[i].toLowerCase();
                const next = words[i + 1].toLowerCase();

                if (!this.chain.has(current)) {
                    this.chain.set(current, new Map());
                }
                const transitions = this.chain.get(current)!;
                transitions.set(next, (transitions.get(next) ?? 0) + 1);
            }
        }

        // 확률 정규화
        for (const [current, transitions] of this.chain) {
            const total = [...transitions.values()].reduce((a, b) => a + b, 0);
            for (const [next, count] of transitions) {
                transitions.set(next, count / total);
            }
        }
    }

    /**
     * [12] 문맥 기반 대사 생성
     *
     * 우호도(affinity)에 따라 발화 템플릿 선택 후
     * 마르코프 체인으로 단어 조합 생성
     */
    generate(context: DialogueContext, maxWords: number = 20): string {
        const greeting = this.selectGreeting(context.affinity);
        const topic = this.selectTopic(context);
        const words = this.generateChain(greeting, maxWords - 3);

        return `${greeting} ${words}`;
    }

    /**
     * [12] 마르코프 연쇄 생성
     * 현재 단어 → 확률 기반 다음 단어 선택
     */
    generateChain(startWord: string, maxWords: number): string {
        const words: string[] = [startWord.toLowerCase()];
        let current = startWord.toLowerCase();

        for (let i = 0; i < maxWords; i++) {
            const transitions = this.chain.get(current);
            if (!transitions || transitions.size === 0) break;

            // 가중치 확률 기반 다음 단어 선택
            const rand = Math.random();
            let cumulative = 0;
            let nextWord = '';

            for (const [word, prob] of transitions) {
                cumulative += prob;
                if (rand <= cumulative) {
                    nextWord = word;
                    break;
                }
            }

            if (!nextWord) break;
            words.push(nextWord);
            current = nextWord;
        }

        return words.join(' ');
    }

    private selectGreeting(affinity: number): string {
        if (affinity >= 80) return '어서 오십시오, 주인님!';
        if (affinity >= 50) return '반갑습니다, 손님이시여!';
        if (affinity >= 20) return '어이, 무슨 일이요?';
        return '...또 왔소?';
    }

    private selectTopic(context: DialogueContext): string {
        const topics: Record<string, string[]> = {
            tavern: ['술', '소문', '모험'],
            market: ['물건', '장사', '가격'],
            street: ['날씨', '전쟁', '소식'],
        };
        const pool = topics[context.location] ?? topics.tavern;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * [12] 학습된 체인 초기화 (새로운 NPC 성격 부여)
     */
    reset(): void {
        this.chain.clear();
    }

    getChainSize(): number { return this.chain.size; }
}
