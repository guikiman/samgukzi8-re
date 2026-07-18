/**
 * [Task 23] 동작 검증 인터페이스 (Action Validator)
 *
 * 유닛이 이미 사망했거나 목적지가 유효하지 않은 노드일 경우,
 * 실행 단계 전에 해당 명령을 필터링 및 로깅.
 */
import { OfficerState, CityState } from "./sisyphus_orchestrator";
export interface ActionValidationContext {
    readonly officerId: string;
    readonly targetId: string;
    readonly actionType: string;
    readonly requiresAlive: boolean;
    readonly requiresCity: boolean;
}
export declare class ActionValidator {
    validate(context: ActionValidationContext, officers: Map<string, OfficerState>, cities: Map<string, CityState>): {
        valid: boolean;
        reason?: string;
    };
    filterValid(commands: ActionValidationContext[], officers: Map<string, OfficerState>, cities: Map<string, CityState>): ActionValidationContext[];
}
//# sourceMappingURL=action_validator.d.ts.map