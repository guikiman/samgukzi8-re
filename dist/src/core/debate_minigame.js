/**
 * [B12] 설전(Debate) 미니게임 엔진
 *
 * 삼국지 8 리메이크 스타일 설전 시스템
 * INT/WIT/PRESSURE 속성 카드 대결
 * LOGIC > FALLACY, WIT > LOGIC, PRESSURE > WIT, FALLACY > PRESSURE
 * MOOD 시스템: 연속 승리 시 보정
 */
const ALL_DEBATE_CARDS = {
    LOGIC: { type: 'LOGIC', power: 10, spiritCost: 0, label: '논리', description: '기본 논증, spirit 불필요' },
    WIT: { type: 'WIT', power: 8, spiritCost: 0, label: '재치', description: '재치있는 반박' },
    PRESSURE: { type: 'PRESSURE', power: 12, spiritCost: 0, label: '위압', description: '강한 압박' },
    RHETORIC: { type: 'RHETORIC', power: 20, spiritCost: 2, label: '수사', description: '화려한 언변, spirit 2 소모' },
    FALLACY: { type: 'FALLACY', power: 6, spiritCost: 0, label: '궤변', description: '논리적 오류 공격' },
    WISDOM: { type: 'WISDOM', power: 25, spiritCost: 3, label: '지혜', description: '깊은 통찰, spirit 3 소모' },
};
// 카드 승패 관계: LOGIC > FALLACY, WIT > LOGIC, PRESSURE > WIT, FALLACY > PRESSURE
const DEBATE_CARD_WIN = {
    LOGIC: ['FALLACY'],
    WIT: ['LOGIC'],
    PRESSURE: ['WIT'],
    RHETORIC: ['LOGIC', 'FALLACY', 'WIT'],
    FALLACY: ['PRESSURE'],
    WISDOM: ['LOGIC', 'WIT', 'PRESSURE', 'FALLACY', 'RHETORIC'],
};
export class DebateMinigame {
    constructor() {
        this.state = this.createInitialState('', '', '', { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 }, { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 });
    }
    createInitialState(playerId, enemyId, topic, _playerStats, _enemyStats) {
        return {
            turn: 0,
            playerId,
            enemyId,
            playerMood: 0,
            enemyMood: 0,
            playerSpirit: 3,
            enemySpirit: 3,
            playerScore: 50,
            enemyScore: 50,
            phase: 'READY',
            log: [],
            winner: null,
            maxTurns: 5,
            topic,
        };
    }
    /** 설전 시작 */
    startDebate(playerId, enemyId, playerStats, enemyStats, topic = '정세 논의') {
        // 지력에 따른 초기 spirit
        const playerSpirit = 3 + Math.floor((playerStats.intelligence - 50) / 20);
        const enemySpirit = 3 + Math.floor((enemyStats.intelligence - 50) / 20);
        this.state = {
            turn: 0,
            playerId,
            enemyId,
            playerMood: 0,
            enemyMood: 0,
            playerSpirit: Math.max(1, Math.min(5, playerSpirit)),
            enemySpirit: Math.max(1, Math.min(5, enemySpirit)),
            playerScore: 50,
            enemyScore: 50,
            phase: 'PLAYER_TURN',
            log: [`🎙️ "${topic}"에 관한 설전 시작! (${playerId} vs ${enemyId})`],
            winner: null,
            maxTurns: 5,
            topic,
        };
        return this.getState();
    }
    /** 사용 가능한 카드 목록 */
    getAvailableCards(spirit, _mood = 0) {
        return Object.values(ALL_DEBATE_CARDS).filter(card => card.spiritCost <= spirit);
    }
    /** 적 카드 선택 (AI) */
    enemyChooseCard() {
        const available = this.getAvailableCards(this.state.enemySpirit);
        return available[Math.floor(Math.random() * available.length)].type;
    }
    /** 카드 대결 해소 */
    resolveDebate(playerCard, enemyCard) {
        const pCard = ALL_DEBATE_CARDS[playerCard];
        const eCard = ALL_DEBATE_CARDS[enemyCard];
        // SPIRIT 차감 (매 턴 +1 보정)
        this.state = {
            ...this.state,
            playerSpirit: Math.min(5, Math.max(0, this.state.playerSpirit - pCard.spiritCost + 1)),
            enemySpirit: Math.min(5, Math.max(0, this.state.enemySpirit - eCard.spiritCost + 1)),
        };
        const pWins = DEBATE_CARD_WIN[playerCard]?.includes(enemyCard) ?? false;
        const eWins = DEBATE_CARD_WIN[enemyCard]?.includes(playerCard) ?? false;
        let pDamage = 0;
        let eDamage = 0;
        let logMsg = '';
        if (pWins && !eWins) {
            pDamage = pCard.power + this.state.playerMood * 3;
            eDamage = 0;
            this.state = { ...this.state, playerMood: Math.min(3, this.state.playerMood + 1), enemyMood: Math.max(-3, this.state.enemyMood - 1) };
            logMsg = `${this.state.playerId}의 ${pCard.label} → ${this.state.enemyId}에게 ${pDamage} 데미지!`;
        }
        else if (eWins && !pWins) {
            eDamage = eCard.power + this.state.enemyMood * 3;
            pDamage = 0;
            this.state = { ...this.state, enemyMood: Math.min(3, this.state.enemyMood + 1), playerMood: Math.max(-3, this.state.playerMood - 1) };
            logMsg = `${this.state.enemyId}의 ${eCard.label} → ${this.state.playerId}에게 ${eDamage} 데미지!`;
        }
        else {
            // 무승부: 서로 경미한 데미지
            pDamage = Math.floor((pCard.power + eCard.power) * 0.2);
            eDamage = pDamage;
            logMsg = '서로 팽팽한 논쟁!';
            // 무드 변화 없음
        }
        // 점수 차감
        this.state = {
            ...this.state,
            playerScore: Math.max(0, this.state.playerScore - pDamage),
            enemyScore: Math.max(0, this.state.enemyScore - eDamage),
            log: [...this.state.log, logMsg],
        };
    }
    /** 플레이어 카드 선택 후 턴 진행 */
    playCard(playerCardType) {
        if (this.state.phase === 'DONE')
            return this.getState();
        if (this.state.phase !== 'PLAYER_TURN')
            return this.getState();
        const card = ALL_DEBATE_CARDS[playerCardType];
        if (card.spiritCost > this.state.playerSpirit)
            return this.getState();
        const enemyCardType = this.enemyChooseCard();
        this.resolveDebate(playerCardType, enemyCardType);
        const newTurn = this.state.turn + 1;
        let winner = null;
        let phase = 'DONE';
        if (this.state.playerScore <= 0) {
            winner = this.state.enemyId;
            this.state = { ...this.state, log: [...this.state.log, `💀 ${this.state.playerId} 논파당함!`] };
        }
        else if (this.state.enemyScore <= 0) {
            winner = this.state.playerId;
            this.state = { ...this.state, log: [...this.state.log, `🏆 ${this.state.playerId} 설전 승리!`] };
        }
        else if (newTurn >= this.state.maxTurns) {
            winner = this.state.playerScore > this.state.enemyScore ? this.state.playerId :
                this.state.enemyScore > this.state.playerScore ? this.state.enemyId : null;
            this.state = {
                ...this.state,
                log: [...this.state.log, `${winner ? `🏆 ${winner} 승리!` : '⚖️ 무승부!'} (${this.state.playerScore}:${this.state.enemyScore})`],
            };
        }
        else {
            phase = 'PLAYER_TURN';
        }
        this.state = { ...this.state, turn: newTurn, phase, winner };
        return this.getState();
    }
    /** 설전 종료 여부 */
    isDebateOver() {
        return this.state.phase === 'DONE';
    }
    /** 현재 상태 반환 */
    getState() {
        return { ...this.state, log: [...this.state.log] };
    }
    /** 승자 반환 */
    getWinner() {
        return this.state.winner;
    }
    /** 설전 결과 요약 */
    getDebateResult() {
        const winner = this.state.winner;
        const loser = winner === this.state.playerId ? this.state.enemyId :
            winner === this.state.enemyId ? this.state.playerId : null;
        const scoreRemaining = winner === this.state.playerId ? this.state.playerScore :
            winner === this.state.enemyId ? this.state.enemyScore : 0;
        return { winner, loser, scoreRemaining, turnsUsed: this.state.turn };
    }
}
//# sourceMappingURL=debate_minigame.js.map