/**
 * [Task 23] 동작 검증 인터페이스 (Action Validator)
 *
 * 유닛이 이미 사망했거나 목적지가 유효하지 않은 노드일 경우,
 * 실행 단계 전에 해당 명령을 필터링 및 로깅.
 */
export class ActionValidator {
    validate(context, officers, cities) {
        const officer = officers.get(context.officerId);
        if (!officer)
            return { valid: false, reason: "무장이 존재하지 않습니다." };
        if (context.requiresAlive && !officer.alive)
            return { valid: false, reason: "무장이 사망했습니다." };
        if (context.requiresCity) {
            const city = cities.get(context.targetId);
            if (!city)
                return { valid: false, reason: "목적지 도시가 존재하지 않습니다." };
        }
        return { valid: true };
    }
    filterValid(commands, officers, cities) {
        return commands.filter((cmd) => this.validate(cmd, officers, cities).valid);
    }
}
//# sourceMappingURL=action_validator.js.map