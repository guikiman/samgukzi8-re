/**
 * [62] 세력 멸망 시 무장 거취 결정 트리 — PostFallDiplomacyAI
 *
 * 목적: 멸망 후 장수의 거취 결정.
 */
export class PostFallDiplomacyAI {
    decideFate(officer) {
        return officer.loyalty > 70 ? "STAY" : "WANDER";
    }
}
//# sourceMappingURL=post_fall_diplomacy_ai.js.map