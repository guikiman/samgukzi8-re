/**
 * [B3] 설전 논리 카드 시뮬레이터 — DebateCardEngine
 *
 * 목적: 지력 대결인 설전의 진행을 위한 논리 카드 덱 및 카테고리 매칭 처리.
 *
 * 핵심 로직:
 *   1. 제출된 카드의 속성이 전장 테마(도리론/웅변론/궤변론)와 일치할 경우 위력 1.2배 증폭
 *   2. 지력 차이에 따른 기본 논리 배리어(Logic Shield) 흡수량 수치화
 *   3. REASON > SOPHISTRY > THREAT > REASON 상성
 */
/**
 * 상성 테이블: key가 value를 이김
 * REASON > SOPHISTRY (도리는 궤변을 논파)
 * SOPHISTRY > THREAT (궤변은 위압을 흔들음)
 * THREAT > REASON (위압은 도리를 압도)
 */
const COUNTER_MAP = {
    REASON: 'SOPHISTRY',
    SOPHISTRY: 'THREAT',
    THREAT: 'REASON',
};
/** 카드 타입별 레이블 */
const CARD_LABELS = {
    REASON: '도리',
    THREAT: '위압',
    SOPHISTRY: '궤변',
};
/** 카드 타입과 테마 매칭 매핑 */
const THEME_MATCH = {
    REASONING: 'REASON',
    ELOQUENCE: 'THREAT',
    SOPHISTRY_THEME: 'SOPHISTRY',
};
/** 테마 이름 */
const THEME_LABELS = {
    REASONING: '도리론',
    ELOQUENCE: '웅변론',
    SOPHISTRY_THEME: '궤변론',
};
/** 기본 카드 위력 */
const BASE_CARD_POWER = {
    REASON: 12,
    THREAT: 12,
    SOPHISTRY: 12,
};
export class DebateCardEngine {
    constructor() {
        this.MAX_TURNS = 7;
    }
    /**
     * 설전 상태 초기화
     *
     * @param playerInt - 플레이어 지력
     * @param aiInt     - AI 지력
     * @param theme     - 설전 테마 (기본값: 랜덤)
     */
    startDebate(playerInt, aiInt, theme) {
        // 지력 기반 Logic HP
        const playerLogicHp = 40 + Math.floor(playerInt / 3);
        const aiLogicHp = 40 + Math.floor(aiInt / 3);
        // 지력 차이 기반 Logic Shield
        // Logic Shield = |playerInt - aiInt| * 0.5 (최대 15, 최소 0)
        const intDiff = playerInt - aiInt;
        const playerShield = intDiff > 0 ? Math.min(15, Math.floor(intDiff * 0.5)) : 0;
        const aiShield = intDiff < 0 ? Math.min(15, Math.floor(-intDiff * 0.5)) : 0;
        // 테마 랜덤 선택
        const themes = ['REASONING', 'ELOQUENCE', 'SOPHISTRY_THEME'];
        const selectedTheme = theme ?? themes[Math.floor(Math.random() * themes.length)];
        return {
            playerLogicHp,
            aiLogicHp,
            playerMaxLogicHp: playerLogicHp,
            aiMaxLogicHp: aiLogicHp,
            playerLogicShield: playerShield,
            aiLogicShield: aiShield,
            turn: 0,
            maxTurns: this.MAX_TURNS,
            playerCards: this.generateCards(playerInt, 5),
            aiCards: this.generateCards(aiInt, 5),
            currentTheme: selectedTheme,
            resultLog: [],
            winner: null,
        };
    }
    /**
     * 지력 기반 카드 덱 생성
     */
    generateCards(intelligence, count) {
        const cards = [];
        const types = ['REASON', 'THREAT', 'SOPHISTRY'];
        const powerBonus = Math.floor(intelligence / 15); // 지력 높을수록 기본 위력 증가
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * 3)];
            const basePower = BASE_CARD_POWER[type] + Math.floor(Math.random() * 6);
            cards.push({
                type,
                value: basePower + powerBonus,
                label: CARD_LABELS[type],
            });
        }
        return cards;
    }
    /**
     * 한 턴 실행
     *
     * @param state          - 현재 설전 상태
     * @param playerCardIndex - 플레이어가 선택한 카드 인덱스
     * @returns 업데이트된 DebateState
     */
    executeTurn(state, playerCardIndex) {
        if (state.winner)
            return state;
        if (state.turn >= this.MAX_TURNS) {
            return {
                ...state,
                winner: state.playerLogicHp > state.aiLogicHp ? 'player' : 'ai',
            };
        }
        if (state.playerCards.length === 0 || playerCardIndex >= state.playerCards.length) {
            return { ...state, winner: 'ai' };
        }
        const playerCard = state.playerCards[playerCardIndex];
        const aiCardIndex = Math.floor(Math.random() * state.aiCards.length);
        const aiCard = state.aiCards[aiCardIndex];
        // 사용한 카드 제거
        const remainingPlayerCards = state.playerCards.filter((_, i) => i !== playerCardIndex);
        const remainingAiCards = state.aiCards.filter((_, i) => i !== aiCardIndex);
        // --- 테마 매칭 확인 ---
        const matchedType = THEME_MATCH[state.currentTheme];
        const playerMatch = playerCard.type === matchedType;
        const aiMatch = aiCard.type === matchedType;
        // 테마 매칭 시 위력 1.2배
        const playerPower = playerMatch
            ? Math.floor(playerCard.value * 1.2)
            : playerCard.value;
        const aiPower = aiMatch
            ? Math.floor(aiCard.value * 1.2)
            : aiCard.value;
        // --- 상성 판정 ---
        const counteredByAI = COUNTER_MAP[playerCard.type]; // AI가 가진 카드 중 player를 이기는 타입
        const counteredByPlayer = COUNTER_MAP[aiCard.type]; // Player가 가진 카드 중 ai를 이기는 타입
        let rawPlayerDamage = 0; // 플레이어가 AI에게 가할 데미지
        let rawAiDamage = 0; // AI가 플레이어에게 가할 데미지
        let description = '';
        const descParts = [];
        if (counteredByPlayer === aiCard.type) {
            // 플레이어 카드가 AI 카드를 이김
            rawPlayerDamage = aiPower;
            descParts.push(`AI의 ${aiCard.label}(${aiPower})에 반론!`);
        }
        if (counteredByAI === playerCard.type) {
            // AI 카드가 플레이어 카드를 이김
            rawAiDamage = playerPower;
            descParts.push(`AI가 ${aiCard.label}(${aiPower})로 반론!`);
        }
        // 같은 속성 카드 제출 시 반론 데미지 2배
        if (playerCard.type === aiCard.type) {
            rawPlayerDamage = Math.floor(aiPower * 2);
            rawAiDamage = Math.floor(playerPower * 2);
            descParts.push(`같은 ${CARD_LABELS[playerCard.type]} 논쟁! 반론 2배!`);
        }
        // 무승부 (서로 다른 상성, 상쇄되지 않음)
        if (rawPlayerDamage === 0 && rawAiDamage === 0) {
            rawPlayerDamage = Math.floor(aiPower / 2);
            rawAiDamage = Math.floor(playerPower / 2);
            descParts.push(`팽팽한 논쟁 (${playerCard.label} vs ${aiCard.label})`);
        }
        // 테마 매칭 보너스 문구
        if (playerMatch) {
            descParts.push(`${THEME_LABELS[state.currentTheme]}에 맞춘 논리!`);
        }
        // --- Logic Shield 흡수 ---
        // Shield가 남아있으면 데미지의 50%를 Shield가 대신 흡수
        let actualPlayerDamage = rawAiDamage; // AI → Player 데미지
        let actualAiDamage = rawPlayerDamage; // Player → AI 데미지
        let shieldAbsorbedPlayer = 0;
        let shieldAbsorbedAi = 0;
        if (state.playerLogicShield > 0 && actualPlayerDamage > 0) {
            const absorbed = Math.min(state.playerLogicShield, Math.ceil(actualPlayerDamage * 0.5));
            actualPlayerDamage -= absorbed;
            shieldAbsorbedPlayer = absorbed;
        }
        if (state.aiLogicShield > 0 && actualAiDamage > 0) {
            const absorbed = Math.min(state.aiLogicShield, Math.ceil(actualAiDamage * 0.5));
            actualAiDamage -= absorbed;
            shieldAbsorbedAi = absorbed;
        }
        if (shieldAbsorbedPlayer > 0)
            descParts.push(`Logic Shield ${shieldAbsorbedPlayer} 흡수!`);
        if (shieldAbsorbedAi > 0)
            descParts.push(`AI Shield ${shieldAbsorbedAi} 흡수!`);
        // --- 데미지 적용 ---
        const newPlayerLogicHp = Math.max(0, state.playerLogicHp - actualPlayerDamage);
        const newAiLogicHp = Math.max(0, state.aiLogicHp - actualAiDamage);
        const newPlayerShield = Math.max(0, state.playerLogicShield - shieldAbsorbedPlayer);
        const newAiShield = Math.max(0, state.aiLogicShield - shieldAbsorbedAi);
        // --- 승패 판정 ---
        let winner = null;
        if (newPlayerLogicHp <= 0)
            winner = 'ai';
        else if (newAiLogicHp <= 0)
            winner = 'player';
        const newTurn = state.turn + 1;
        if (!winner && newTurn >= this.MAX_TURNS) {
            winner = newPlayerLogicHp > newAiLogicHp ? 'player' : 'ai';
        }
        // AI 카드 재생성 (바닥나면)
        const nextAiCards = remainingAiCards.length > 0
            ? remainingAiCards
            : this.generateCards(state.aiMaxLogicHp * 3, 3);
        const result = {
            turn: newTurn,
            playerCard,
            aiCard,
            playerDamage: actualPlayerDamage,
            aiDamage: actualAiDamage,
            themeMatch: playerMatch || aiMatch,
            shieldAbsorbedPlayer,
            shieldAbsorbedAi,
            description: descParts.join(' / '),
        };
        return {
            ...state,
            playerLogicHp: newPlayerLogicHp,
            aiLogicHp: newAiLogicHp,
            playerLogicShield: newPlayerShield,
            aiLogicShield: newAiShield,
            turn: newTurn,
            playerCards: remainingPlayerCards.length > 0
                ? remainingPlayerCards
                : this.generateCards(state.playerMaxLogicHp * 3, 3),
            aiCards: nextAiCards,
            resultLog: [...state.resultLog, result],
            winner,
        };
    }
    /** AI 카드 선택 (랜덤) */
    selectAICard(state) {
        if (state.aiCards.length === 0)
            return 0;
        return Math.floor(Math.random() * state.aiCards.length);
    }
    /** 사용 가능한 카드 목록 반환 */
    getAvailableCards(state) {
        return [...state.playerCards];
    }
}
//# sourceMappingURL=debate_card_engine.js.map