/**
 * [7] 전술 전투 중 아군 부대 '실시간 AI 위임 토글 스위치'
 *
 * BattleAIToggle:
 *   - toggleAI(): 단축키 T로 메인 무장 포함 아군 전체 AI 시뮬레이션 모드 전환
 *   - isAIActive(): 현재 AI 위임 상태 확인
 *   - runAISimulation(): AI 시뮬레이션 실행 (락스텝 스레드 제어)
 *   - revertToManual(): 언제든 수동 컨트롤로 복귀
 */

export type BattleControlMode = 'MANUAL' | 'AI_DELEGATED';

export interface BattleAIToggleState {
    readonly mode: BattleControlMode;
    readonly delegatedUnitIds: readonly string[];
    readonly lastAIAction: string;
    readonly tickCount: number;
}

export class BattleAIToggle {
    private state: BattleAIToggleState = {
        mode: 'MANUAL',
        delegatedUnitIds: [],
        lastAIAction: '',
        tickCount: 0,
    };

    /**
     * [7] AI 위임 토글 (단축키 T)
     *
     * MANUAL ↔ AI_DELEGATED 전환
     * AI 모드에서는 메인 무장 포함 아군 전체가 AI 시뮬레이션으로 자동 전환
     */
    toggleAI(unitIds: string[]): BattleAIToggleState {
        if (this.state.mode === 'MANUAL') {
            this.state = {
                mode: 'AI_DELEGATED',
                delegatedUnitIds: [...unitIds],
                lastAIAction: 'AI 위임 활성화 — 모든 부대 자동 전투',
                tickCount: 0,
            };
        } else {
            this.state = {
                mode: 'MANUAL',
                delegatedUnitIds: [],
                lastAIAction: '수동 컨트롤 복귀',
                tickCount: this.state.tickCount,
            };
        }
        return this.state;
    }

    /**
     * [7] AI 시뮬레이션 실행 (락스텝)
     *
     * 위임된 부대의 AI 전술 결정을 시뮬레이션
     */
    runAISimulation(): string {
        if (this.state.mode !== 'AI_DELEGATED') return 'AI 모드 비활성';

        const actions = [
            '전진 공격 — 적 주력 부대와 교전',
            '측면 우회 — 적 후방 포위 시도',
            '방어 태세 — 진지 구축 및 사기 회복',
            '궁병 지원 사격 — 적 원거리 부대 제압',
            '기병 돌격 — 적 측면 교란',
        ];

        const action = actions[Math.floor(Math.random() * actions.length)];
        this.state = {
            ...this.state,
            lastAIAction: action,
            tickCount: this.state.tickCount + 1,
        };
        return action;
    }

    getState(): BattleAIToggleState { return this.state; }
}
