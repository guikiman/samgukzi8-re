/**
 * 삼국지 8 리메이크 — 핵심 타입 정의
 * 파일: src/core/types.ts
 *
 * 모든 도메인 엔티티, 커맨드, 상태, 이벤트 타입 정의
 * 정규화 상태 트리 구조 + 커맨드 패턴 인터페이스
 */
// ============================================================
// 게임 페이즈 (유한 상태 머신)
// ============================================================
export var GamePhase;
(function (GamePhase) {
    GamePhase["TITLE"] = "TITLE";
    GamePhase["WORLD_MAP"] = "WORLD_MAP";
    GamePhase["COUNCIL"] = "COUNCIL";
    GamePhase["PERSONAL_ACTION"] = "PERSONAL_ACTION";
    GamePhase["BATTLE"] = "BATTLE";
    GamePhase["DIALOGUE"] = "DIALOGUE";
    GamePhase["EVENT"] = "EVENT";
    GamePhase["GAME_OVER"] = "GAME_OVER";
})(GamePhase || (GamePhase = {}));
export function monthToSeason(month) {
    const m = ((month - 1) % 12) + 1;
    if (m >= 3 && m <= 5)
        return 'SPRING';
    if (m >= 6 && m <= 8)
        return 'SUMMER';
    if (m >= 9 && m <= 11)
        return 'AUTUMN';
    return 'WINTER';
}
// ============================================================
// 무장 (Officer) 도메인
// ============================================================
export var OfficerRank;
(function (OfficerRank) {
    OfficerRank[OfficerRank["UNRANKED"] = 0] = "UNRANKED";
    OfficerRank[OfficerRank["RANK9"] = 9] = "RANK9";
    OfficerRank[OfficerRank["RANK8"] = 8] = "RANK8";
    OfficerRank[OfficerRank["RANK7"] = 7] = "RANK7";
    OfficerRank[OfficerRank["RANK6"] = 6] = "RANK6";
    OfficerRank[OfficerRank["RANK5"] = 5] = "RANK5";
    OfficerRank[OfficerRank["RANK4"] = 4] = "RANK4";
    OfficerRank[OfficerRank["RANK3"] = 3] = "RANK3";
    OfficerRank[OfficerRank["RANK2"] = 2] = "RANK2";
    OfficerRank[OfficerRank["RANK1"] = 1] = "RANK1";
})(OfficerRank || (OfficerRank = {}));
export var OfficerStatus;
(function (OfficerStatus) {
    OfficerStatus["LORD"] = "LORD";
    OfficerStatus["Viceroy"] = "VICEROY";
    OfficerStatus["Strategist"] = "STRATEGIST";
    OfficerStatus["Governor"] = "GOVERNOR";
    OfficerStatus["OFFICER"] = "OFFICER";
    OfficerStatus["FREE"] = "FREE";
    OfficerStatus["REBEL"] = "REBEL";
})(OfficerStatus || (OfficerStatus = {}));
// ============================================================
// 도시 (City) 도메인
// ============================================================
export var FacilityType;
(function (FacilityType) {
    FacilityType["PALACE"] = "PALACE";
    FacilityType["WALL"] = "WALL";
    FacilityType["MARKET"] = "MARKET";
    FacilityType["FARM"] = "FARM";
    FacilityType["TAVERN"] = "TAVERN";
    FacilityType["BLACKSMITH"] = "BLACKSMITH";
    FacilityType["GRANARY"] = "GRANARY";
    FacilityType["BARRACKS"] = "BARRACKS";
})(FacilityType || (FacilityType = {}));
//# sourceMappingURL=types.js.map