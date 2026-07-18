/**
 * [B2] 일기토 턴제 판정 엔진 — DuelTurnProcessor
 *
 * 목적: 5턴 동안 유저와 AI가 비공개로 선택한 카드를 동시 공개하여
 *       상성 및 데미지를 계산하고 투기 게이지를 누적.
 *
 * 핵심 로직:
 *   1. CRITICAL > ATTACK > DEFENSE > CRITICAL 가위바위보 상성
 *   2. FOCUS(FOCUS) 카드 활성화 시 다음 공격 데미지 1.5배 보정
 *   3. 5턴 종료 or HP 0시 승패 판정
 */
/**
 * 상성 테이블: key가 value를 이김
 * CRITICAL > ATTACK > DEFENSE > CRITICAL
 * DODGE: 모든 공격 회피 (단, CRITICAL에는 무효)
 * FOCUS: 공격 없음, 다음 턴 데미지 1.5x
 */
const COUNTER_TABLE = {
    ATTACK: 'DEFENSE', // 공격은 방어를 이김
    DEFENSE: 'CRITICAL', // 방어는 크리티컬을 막음
    CRITICAL: 'ATTACK', // 크리티컬은 공격을 뚫음
    DODGE: null, // 회피: 상성 없음 (특수 처리)
    FOCUS: null, // 집중: 상성 없음 (버프용)
};
/** 카드 타입별 기본 데미지 */
const CARD_DAMAGE = {
    ATTACK: 15,
    DEFENSE: 0,
    CRITICAL: 35,
    DODGE: 0,
    FOCUS: 0,
};
/** 카드 타입별 집중(Spirit) 소모량 */
const CARD_SPIRIT_COST = {
    ATTACK: 0,
    DEFENSE: 0,
    CRITICAL: 2,
    DODGE: 0,
    FOCUS: 1,
};
/** Spirit 최대치 */
const MAX_SPIRIT = 10;
/** 기본 HP (무력 기반으로 확장 가능) */
const BASE_HP = 100;
export class DuelTurnProcessor {
    constructor() {
        this.MAX_TURNS = 5;
    }
    /**
     * 일기토 초기 상태 생성
     */
    startDuel(playerId, playerMight, aiId, aiMight) {
        return {
            playerHp: BASE_HP + Math.floor(playerMight * 0.5),
            aiHp: BASE_HP + Math.floor(aiMight * 0.5),
            playerSpirit: 3,
            aiSpirit: 3,
            turn: 0,
            maxTurns: this.MAX_TURNS,
            playerFocusBoost: false,
            aiFocusBoost: false,
            results: [],
            winner: null,
            playerId,
            aiId,
        };
    }
    /**
     * 한 턴 처리: 플레이어 카드 + AI 카드 동시 공개 → 상성 판정 → 데미지 적용
     *
     * @param state      - 현재 듀얼 상태
     * @param playerCard - 플레이어가 선택한 카드
     * @param aiCard     - AI가 선택한 카드
     * @returns 업데이트된 DuelState
     */
    processTurn(state, playerCard, aiCard) {
        if (state.winner)
            return state;
        if (state.turn >= this.MAX_TURNS) {
            return {
                ...state,
                winner: state.playerHp > state.aiHp ? 'player' : 'ai',
            };
        }
        const newTurn = state.turn + 1;
        // --- Spirit 차감 ---
        let playerSpirit = state.playerSpirit - CARD_SPIRIT_COST[playerCard.type];
        let aiSpirit = state.aiSpirit - CARD_SPIRIT_COST[aiCard.type];
        // Spirit 부족 시 카드 무효화 (기본 ATTACK으로 대체)
        const actualPlayerCard = playerSpirit < 0
            ? { type: 'ATTACK', damage: CARD_DAMAGE.ATTACK, spiritCost: 0 }
            : playerCard;
        const actualAiCard = aiSpirit < 0
            ? { type: 'ATTACK', damage: CARD_DAMAGE.ATTACK, spiritCost: 0 }
            : aiCard;
        if (playerSpirit < 0)
            playerSpirit = state.playerSpirit; // Spirit 부족시 원복
        if (aiSpirit < 0)
            aiSpirit = state.aiSpirit;
        // --- FOCUS 카드 처리 (버프용, 공격 없음) ---
        let newPlayerFocusBoost = state.playerFocusBoost;
        let newAiFocusBoost = state.aiFocusBoost;
        let descParts = [];
        if (actualPlayerCard.type === 'FOCUS') {
            newPlayerFocusBoost = true;
            playerSpirit += 2; // FOCUS 사용 시 Spirit 2 회복
            descParts.push(`${state.playerId} 집중! 다음 공격 1.5배`);
        }
        if (actualAiCard.type === 'FOCUS') {
            newAiFocusBoost = true;
            aiSpirit += 2;
            descParts.push(`${state.aiId} 집중! 다음 공격 1.5배`);
        }
        // DODGE 처리 (회피 성공 시 데미지 0)
        const playerDodging = actualPlayerCard.type === 'DODGE';
        const aiDodging = actualAiCard.type === 'DODGE';
        // --- 상성 판정 ---
        let playerDamageDealt = 0;
        let aiDamageDealt = 0;
        const pType = actualPlayerCard.type;
        const aType = actualAiCard.type;
        // CRITICAL vs DODGE: CRITICAL은 DODGE 무시
        if (pType === 'CRITICAL' && aType === 'DODGE') {
            // CRITICAL은 회피 무시
            playerDamageDealt = CARD_DAMAGE.CRITICAL;
            descParts.push(`${state.playerId} 필살기! (회피 무시)`);
        }
        else if (aType === 'CRITICAL' && pType === 'DODGE') {
            aiDamageDealt = CARD_DAMAGE.CRITICAL;
            descParts.push(`${state.aiId} 필살기! (회피 무시)`);
        }
        else if (playerDodging) {
            // 플레이어 회피 성공
            descParts.push(`${state.playerId} 회피!`);
        }
        else if (aiDodging) {
            // AI 회피 성공
            descParts.push(`${state.aiId} 회피!`);
        }
        else {
            // 일반 상성 판정
            const pBeats = COUNTER_TABLE[pType];
            const aBeats = COUNTER_TABLE[aType];
            const playerWins = pBeats === aType;
            const aiWins = aBeats === pType;
            if (playerWins && !aiWins) {
                // 플레이어 카드가 AI 카드를 이김
                playerDamageDealt = CARD_DAMAGE[pType];
                if (state.playerFocusBoost) {
                    playerDamageDealt = Math.floor(playerDamageDealt * 1.5);
                    newPlayerFocusBoost = false; // 버프 소모
                    descParts.push(`${state.playerId} 집중 공격!`);
                }
                descParts.push(`${state.playerId}의 ${pType} 성공!`);
            }
            else if (aiWins && !playerWins) {
                // AI 카드가 플레이어 카드를 이김
                aiDamageDealt = CARD_DAMAGE[aType];
                if (state.aiFocusBoost) {
                    aiDamageDealt = Math.floor(aiDamageDealt * 1.5);
                    newAiFocusBoost = false;
                    descParts.push(`${state.aiId} 집중 공격!`);
                }
                descParts.push(`${state.aiId}의 ${aType} 성공!`);
            }
            else {
                // 무승부: 둘 다 ATTACK이면 상호 데미지
                if (pType === 'ATTACK' && aType === 'ATTACK') {
                    playerDamageDealt = Math.floor(CARD_DAMAGE.ATTACK * 0.5);
                    aiDamageDealt = Math.floor(CARD_DAMAGE.ATTACK * 0.5);
                    descParts.push('서로 공격! 상호 데미지!');
                }
                else {
                    descParts.push('공방이 팽팽합니다!');
                }
            }
        }
        // --- Spirit 수급 (턴 종료 시 기본 +1) ---
        playerSpirit += 1;
        aiSpirit += 1;
        // --- 데미지 적용 ---
        const newPlayerHp = Math.max(0, state.playerHp - aiDamageDealt);
        const newAiHp = Math.max(0, state.aiHp - playerDamageDealt);
        // --- 승패 판정 ---
        let winner = null;
        if (newPlayerHp <= 0)
            winner = 'ai';
        else if (newAiHp <= 0)
            winner = 'player';
        // 5턴 초과 시 HP 높은 쪽 승리
        if (!winner && newTurn >= this.MAX_TURNS) {
            winner = newPlayerHp > newAiHp ? 'player' : 'ai';
        }
        const result = {
            turn: newTurn,
            playerCard: actualPlayerCard,
            aiCard: actualAiCard,
            playerDamageDealt,
            aiDamageDealt,
            playerSpiritDelta: playerSpirit - state.playerSpirit,
            aiSpiritDelta: aiSpirit - state.aiSpirit,
            description: descParts.join(' / '),
        };
        return {
            playerHp: newPlayerHp,
            aiHp: newAiHp,
            playerSpirit: Math.min(MAX_SPIRIT, Math.max(0, playerSpirit)),
            aiSpirit: Math.min(MAX_SPIRIT, Math.max(0, aiSpirit)),
            turn: newTurn,
            maxTurns: this.MAX_TURNS,
            playerFocusBoost: newPlayerFocusBoost,
            aiFocusBoost: newAiFocusBoost,
            results: [...state.results, result],
            winner,
            playerId: state.playerId,
            aiId: state.aiId,
        };
    }
    /** AI 카드 선택 (무력 기반 가중치 랜덤) */
    selectAICard(state, aiMight) {
        const available = ['ATTACK', 'DEFENSE', 'DODGE', 'FOCUS'];
        if (state.aiSpirit >= CARD_SPIRIT_COST.CRITICAL) {
            available.push('CRITICAL');
        }
        // 무력 기반 가중치: 무력 높을수록 CRITICAL/ATTACK 선호
        const weights = {
            ATTACK: 0.3 + (aiMight / 200),
            DEFENSE: 0.25,
            DODGE: 0.15,
            FOCUS: 0.15,
            CRITICAL: state.aiSpirit >= CARD_SPIRIT_COST.CRITICAL ? 0.05 + (aiMight / 300) : 0,
        };
        const totalWeight = available.reduce((s, t) => s + (weights[t] ?? 0), 0);
        let roll = Math.random() * totalWeight;
        let selected = 'ATTACK';
        for (const type of available) {
            roll -= (weights[type] ?? 0);
            if (roll <= 0) {
                selected = type;
                break;
            }
        }
        return {
            type: selected,
            damage: CARD_DAMAGE[selected],
            spiritCost: CARD_SPIRIT_COST[selected],
        };
    }
}
//# sourceMappingURL=duel_turn_processor.js.map